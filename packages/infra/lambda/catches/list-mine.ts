import { Catch, Page } from "@anglog/shared";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { APIGatewayProxyHandlerV2WithJWTAuthorizer } from "aws-lambda";

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

export const handler: APIGatewayProxyHandlerV2WithJWTAuthorizer = async (
  event,
) => {
  const userId = event.requestContext.authorizer.jwt.claims.sub as string;
  const limit = Number(event.queryStringParameters?.limit ?? "20");
  const cursor = event.queryStringParameters?.cursor;

  const res = await client.send(
    new QueryCommand({
      TableName: TABLE_NAME,
      IndexName: "GSI1",
      KeyConditionExpression: "GSI1PK = :pk",
      ExpressionAttributeValues: { ":pk": `USER#${userId}` },
      ScanIndexForward: false,
      Limit: limit,
      ExclusiveStartKey: decodeCursor(cursor),
    }),
  );

  const page: Page<Catch> = {
    items: (res.Items ?? []) as Catch[],
    nextCursor: encodeCursor(res.LastEvaluatedKey),
  };
  return {
    statusCode: 200,
    headers: { "content-type": "application/json" },
    body: JSON.stringify(page),
  };
};
