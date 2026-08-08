import json
import os
from anthropic import Anthropic

client = Anthropic(api_key=os.environ["ANTHROPIC_API_KEY"])

def handler(event, context):
  body = json.loads(event.get("body") or "{}")
  question = (body.get("question") or "").strip()
  if not question:
    return {"statusCode": 400, "body": json.dumps({"message": "question required"})}

  msg = client.messages.create(
    model="claude-opus-4-8",
    max_tokens=1024,
    messages=[{"role": "user", "content": question}],
  )
  text = "".join(b.text for b in msg.content if b.type == "text")
  return {
    "statusCode": 200,
    "headers": {"content-type": "application/json"},
    "body": json.dumps({"answer": text}),
  }