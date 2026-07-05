import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { APIGatewayProxyHandlerV2 } from "aws-lambda";
import { Catch, Page } from "@anglog/shared";

const client = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const TABLE_NAME = process.env.TABLE_NAME!;

function encodeCursor(
  key: Record<string, unknown> | undefined,
): string | undefined {
  return key
    ? Buffer.from(JSON.stringify(key)).toString("base64url")
    : undefined;
}

function decodeCursor(
  cursor: string | undefined,
): Record<string, unknown> | undefined {
  return cursor
    ? JSON.parse(Buffer.from(cursor, "base64url").toString())
    : undefined;
}

export const handler: APIGatewayProxyHandlerV2 = async (event) => {
  const limit = Number(event.queryStringParameters?.limit ?? "20");
  const cursor = event.queryStringParameters?.cursor;

  const res = await client.send(
    new QueryCommand({
      TableName: TABLE_NAME,
      IndexName: "GSI2",
      KeyConditionExpression: "GSI2PK = :pk",
      ExpressionAttributeValues: { ":pk": "PUBLIC" },
      ScanIndexForward: false,
      Limit: limit,
      ExclusiveStartKey: decodeCursor(cursor),
    }),
  );

  const page: Page<Catch> = {
    items: (res.Items ?? []) as Catch[],
  };
  return {
    statusCode: 200,
    headers: { "content-type": "application/json" },
    body: JSON.stringify(page),
  };
};
