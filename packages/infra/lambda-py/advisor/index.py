import json
import os
import urllib.request
from datetime import date as date_cls

import boto3
from boto3.dynamodb.conditions import Key
from anthropic import Anthropic
from anthropic.lib.tools import beta_tool

client = Anthropic(api_key=os.environ["ANTHROPIC_API_KEY"])
table = boto3.resource("dynamodb").Table(os.environ["TABLE_NAME"])


def _num(v):
  return float(v) if v is not None else None


def _loc(v):
  if isinstance(v, dict):
    return {"lat": _num(v.get("lat")), "lon": _num(v.get("lon"))}
  return None


@beta_tool
def search_catches(species: str = "", area: str = "", limit: int = 20) -> str:
  """公開されている釣果を検索する。どこで何が釣れているかの根拠に使う。

  Args:
    species: 魚種名で絞り込み（部分一致。空なら全魚種）
    area: エリア名で絞り込み（部分一致。空なら全エリア）
    limit: 返す最大件数
  """
  res = table.query(
    IndexName="GSI2",
    KeyConditionExpression=Key("GSI2PK").eq("PUBLIC"),
    ScanIndexForward=False,  # 新しい順
    Limit=100,
  )
  out = []
  for it in res.get("Items", []):
    if species and species not in (it.get("species") or ""):
      continue
    if area and area not in (it.get("areaName") or ""):
      continue
    out.append({
      "catchId": it.get("catchId"),
      "species": it.get("species"),
      "area": it.get("areaName"),
      "method": it.get("method"),
      "size": _num(it.get("size")),
      "count": _num(it.get("count")),
      "caughtAt": it.get("caughtAt"),
      "location": _loc(it.get("location")),
    })
    if len(out) >= limit:
      break
  return json.dumps({"catches": out}, ensure_ascii=False)


@beta_tool
def get_forecast(latitude: float, longitude: float, date: str = "") -> str:
  """指定した緯度経度・日付の天気予報（気温・風・気圧）を取得する。

  Args:
    latitude: 緯度
    longitude: 経度
    date: YYYY-MM-DD（空なら今日）
  """
  d = date or date_cls.today().isoformat()
  url = (
    f"https://api.open-meteo.com/v1/forecast?latitude={latitude}&longitude={longitude}"
    f"&start_date={d}&end_date={d}"
    f"&hourly=temperature_2m,weather_code,wind_speed_10m,surface_pressure&timezone=Asia/Tokyo"
  )
  try:
    with urllib.request.urlopen(url, timeout=10) as r:
      data = json.loads(r.read())
    return json.dumps({"date": d, "hourly": data.get("hourly", {})}, ensure_ascii=False)
  except Exception as e:
    return json.dumps({"error": str(e)})


SYSTEM = """あなたは釣りアドバイザーです。ユーザーの相談に、ツールで調べた実際の釣果データと天気予報を根拠に答えてください。
- search_catches で公開釣果を調べ「どこで何が釣れているか」を根拠(catchId)付きで示す
- 必要なら get_forecast で予定日の天気を確認し、条件を踏まえて提案する
- 推測で断定せず、ツールで裏を取る。分からないことは分からないと言う
- 日本語で簡潔に、実用的に答える"""


def handler(event, context):
  body = json.loads(event.get("body") or "{}")
  question = (body.get("question") or "").strip()
  if not question:
    return {"statusCode": 400, "body": json.dumps({"message": "question required"})}

  runner = client.beta.messages.tool_runner(
    model="claude-opus-4-8",
    max_tokens=2048,
    system=SYSTEM,
    tools=[search_catches, get_forecast],
    messages=[{"role": "user", "content": question}],
  )
  final = runner.until_done()
  text = "".join(b.text for b in final.content if b.type == "text")
  return {
    "statusCode": 200,
    "headers": {"content-type": "application/json"},
    "body": json.dumps({"answer": text}, ensure_ascii=False),
  }
