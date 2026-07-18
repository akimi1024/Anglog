import type { APIGatewayProxyHandlerV2WithJWTAuthorizer } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";
import ngeohash from "ngeohash";
import { z } from "zod";
import type { Catch } from "@anglog/shared";
import { fetchWeather } from "../weather";

const createCatchSchema = z.object({
  caughtAt: z.string(),
  species: z.string().min(1),
  size: z.number().nonnegative().optional(),
  count: z.number().int().nonnegative().optional(),
  method: z.enum(["lure", "bait", "fly", "other"]).optional(),
  tackle: z.string().optional(),
  reel: z.string().optional(),
  memo: z.string().optional(),
  imageKeys: z.array(z.string()).default([]),
  location: z.object({ lat: z.number(), lon: z.number() }).optional(),
  areaName: z.string().optional(),
  isPublic: z.boolean(),
});

const client = DynamoDBDocumentClient.from(new DynamoDBClient({}), {
  marshallOptions: { removeUndefinedValues: true },
});
const TABLE_NAME = process.env.TABLE_NAME!;

export const handler: APIGatewayProxyHandlerV2WithJWTAuthorizer = async (
  event,
) => {
  // 1. 承認済みユーザーID（Cognito Sub）
  const userId = event.requestContext.authorizer.jwt.claims.sub as string;

  // 2. 入力を実行時検証（壊れていたら400）
  const parsed = createCatchSchema.safeParse(JSON.parse(event.body ?? "{}"));
  if (!parsed.success) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        message: "invalid input",
        issues: parsed.error.issues,
      }),
    };
  }
  const input = parsed.data;

  // 3. サーバが決める値
  const catchId = crypto.randomUUID();
  const now = new Date().toISOString();
  const geohash = input.location
    ? ngeohash.encode(input.location.lat, input.location.lon)
    : undefined;

  const weather = input.location
    ? await fetchWeather(input.location, input.caughtAt)
    : undefined;

  // 4. DynamoDBアイテムを組み立て（ドメイン属性 ＋ インデックスキー）
  const item: Record<string, unknown> = {
    PK: `CATCH#${catchId}`,
    SK: "META",
    GSI1PK: `USER#${userId}`,
    GSI1SK: input.caughtAt,
    ...input,
    catchId,
    userId,
    geohash,
    weather,
    createdAt: now,
    updatedAt: now,
  };

  // 公開なら公開フィード(GSI2)にも載せる
  if (input.isPublic) {
    item.GSI2PK = "PUBLIC";
    item.GSI2SK = input.caughtAt;
  }
  // 位置があれば地図用(GSI3)にも載せる
  if (geohash) {
    item.GSI3PK = `CATCH#${geohash.slice(0, 5)}`;
    item.GSI3SK = `${geohash}#${input.caughtAt}`;
  }

  // 5. 書き込み
  await client.send(new PutCommand({ TableName: TABLE_NAME, Item: item }));

  // 6. 作成した釣果を返す
  const created: Catch = {
    catchId,
    userId,
    ...input,
    geohash,
    weather,
    createdAt: now,
    updatedAt: now,
  };
  return {
    statusCode: 201,
    headers: { "content-type": "application/json" },
    body: JSON.stringify(created),
  };
};
