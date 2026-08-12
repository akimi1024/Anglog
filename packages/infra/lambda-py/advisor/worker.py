import json
import os
import re
import urllib.request
from datetime import date as date_cls, datetime, timezone

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


def _extract_catch_ids(text: str):
  m = re.search(r"\[\[catchIds:(.*?)\]\]", text)
  ids = [x.strip() for x in m.group(1).split(",")] if m else []
  ids = [x for x in ids if x]
  clean = re.sub(r"\[\[catchIds:.*?\]\]", "", text).strip()  # 本文からマーカー除去
  return clean, ids

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


def _update(job_id, status, answer, catch_ids=None):
  table.update_item(
    Key={"PK": f"ADVISOR#{job_id}", "SK": "META"},
    UpdateExpression="SET #s = :s, answer = :a, catchIds = :c, updatedAt = :u",
    ExpressionAttributeNames={"#s": "status"},
    ExpressionAttributeValues={
        ":s": status, ":a": answer, ":c": catch_ids or [],
        ":u": datetime.now(timezone.utc).isoformat(),
    },
  )


SYSTEM = """あなたは釣りアドバイザーです。ツールで調べた実データと天気予報を根拠に答えてください。
- search_catches で自分のアプリの公開釣果を調べ、根拠(catchId)付きで示す
- web_search で外部の最近の釣果情報も調べてよい。外部情報の出典は必ず [媒体名](URL) の markdownリンク形式で書き、「アプリ内の釣果」と「外部情報」を区別する
- get_forecast で予定日の天気を確認し、条件を踏まえて提案する
- 推測で断定せず裏を取る。不確かなことは不確かと言う
- 日本語で簡潔に、実用的に答える
- 回答の最後に、提案の根拠にしたアプリ内釣果の catchId を [[catchIds: id1, id2]] の形式で1行だけ出力する（該当が無ければ [[catchIds: ]]）"""


def handler(event, context):
  job_id = event["jobId"]
  question = event["question"]
  try:
    runner = client.beta.messages.tool_runner(
      model="claude-opus-4-8",
      max_tokens=2048,
      system=SYSTEM,
      tools=[
        search_catches,
        get_forecast,
        {"type": "web_search_20260209", "name": "web_search", "max_uses": 5},
      ],
      messages=[{"role": "user", "content": question}],
    )
    final = runner.until_done()
    row = "".join(b.text for b in final.content if b.type == "text")
    answer, catch_ids = _extract_catch_ids(row)
    _update(job_id, "done", answer, catch_ids)
  except Exception as e:
    _update(job_id, "error", str(e))