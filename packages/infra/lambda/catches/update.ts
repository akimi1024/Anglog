import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
} from "@aws-sdk/lib-dynamodb";
import { APIGatewayProxyHandlerV2WithJWTAuthorizer } from "aws-lambda";
import { z } from "zod";
import ngeohash from "ngeohash";

const client = DynamoDBDocumentClient.from(new DynamoDBClient({}), {
  marshallOptions: { removeUndefinedValues: true },
});
const TABLE_NAME = process.env.TABLE_NAME!;

const updateCatchSchema = z.object({
  caughtAt: z.string().optional(),
  species: z.string().optional(),
  size: z.number().nonnegative().optional(),
  count: z.number().int().positive().optional(),
  method: z.enum(["lure", "bait", "fly", "other"]).optional(),
  tackle: z.string().optional(),
  reel: z.string().optional(),
  memo: z.string().optional(),
  imageKeys: z.array(z.string()).optional(),
  location: z.object({ lat: z.number(), lon: z.number() }).optional(),
  areaName: z.string().optional(),
  isPublic: z.boolean().optional(),
});

export const handler: APIGatewayProxyHandlerV2WithJWTAuthorizer = async (
  event,
) => {
  const userId = event.requestContext.authorizer.jwt.claims.sub as string;
  const id = event.pathParameters?.id;
  if (!id) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        message: "id required",
      }),
    };
  }

  const parsed = updateCatchSchema.safeParse(JSON.parse(event.body ?? "{}"));
  if (!parsed.success) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        message: "invalid input",
        issues: parsed.error.issues,
      }),
    };
  }
  const updates = parsed.data;

  // 既存を取得
  const got = await client.send(
    new GetCommand({
      TableName: TABLE_NAME,
      Key: { PK: `CATCH#${id}`, SK: "META" },
    }),
  );
  if (!got.Item) {
    return { statusCode: 404, body: JSON.stringify({ message: "not found" }) };
  }

  // 所有者チェック
  if (got.Item.userId !== userId) {
    return { statusCode: 403, body: JSON.stringify({ message: "forbidden" }) };
  }

  // 更新
  const now = new Date().toISOString();
  const merged: Record<string, any> = {
    ...got.Item,
    ...updates,
    updatedAt: now,
  };

  // 派生値の作り直し
  const geohash = merged.location
    ? ngeohash.encode(merged.location.lat, merged.location.lon)
    : undefined;
  merged.geohash = geohash;

  merged.GSI1SK = merged.caughtAt;
  if (merged.isPublic) {
    merged.GSI2PK = "PUBLIC";
    merged.GSI2SK = merged.caughtAt;
  } else {
    delete merged.GSI2PK;
    delete merged.GSI2SK;
  }
  if (geohash) {
    merged.GSI3PK = `CATCH#${geohash.slice(0, 5)}`;
    merged.GSI3SK = `${geohash}#${merged.caughtAt}`;
  } else {
    delete merged.GSI3PK;
    delete merged.GSI3SK;
  }

  // 上書き
  await client.send(new PutCommand({ TableName: TABLE_NAME, Item: merged }));
  return {
    statusCode: 200,
    headers: { "content-type": "application/json" },
    body: JSON.stringify(merged),
  };
};
