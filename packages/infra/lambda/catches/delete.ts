import type { APIGatewayProxyHandlerV2WithJWTAuthorizer } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DeleteCommand,
  DynamoDBDocumentClient,
  GetCommand,
} from "@aws-sdk/lib-dynamodb";
import { DeleteObjectsCommand, S3Client } from "@aws-sdk/client-s3";

const client = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const s3 = new S3Client({});
const TABLE_NAME = process.env.TABLE_NAME!;
const BUCKET_NAME = process.env.BUCKET_NAME!;

export const handler: APIGatewayProxyHandlerV2WithJWTAuthorizer = async (
  event,
) => {
  const userId = event.requestContext.authorizer.jwt.claims.sub as string;
  const id = event.pathParameters?.id;
  if (!id)
    return {
      statusCode: 400,
      body: JSON.stringify({ message: "id required" }),
    };
  const key = { PK: `CATCH#${id}`, SK: "META" };
  const got = await client.send(
    new GetCommand({ TableName: TABLE_NAME, Key: key }),
  );
  if (!got.Item)
    return { statusCode: 404, body: JSON.stringify({ message: "not found" }) };

  if (got.Item.userId !== userId)
    return { statusCode: 403, body: JSON.stringify({ message: "forbidden" }) };

  const imageKeys = (got.Item.imageKeys ?? []) as string[];
  if (imageKeys.length > 0) {
    try {
      await s3.send(
        new DeleteObjectsCommand({
          Bucket: BUCKET_NAME,
          Delete: { Objects: imageKeys.map((Key) => ({ Key })) },
        }),
      );
    } catch {
      // 掃除失敗は握りつぶす（本体の削除は続行）
    }
  }

  await client.send(new DeleteCommand({ TableName: TABLE_NAME, Key: key }));
  return { statusCode: 204, body: "" };
};
