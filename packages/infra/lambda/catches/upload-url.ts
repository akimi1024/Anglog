import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { DynamoDBDocumentClient, GetCommand } from "@aws-sdk/lib-dynamodb";
import { APIGatewayProxyHandlerV2WithJWTAuthorizer } from "aws-lambda";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { randomUUID } from "crypto";

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const s3 = new S3Client({});
const TABLE_NAME = process.env.TABLE_NAME;
const BUCKET_NAME = process.env.BUCKET_NAME;

export const handler: APIGatewayProxyHandlerV2WithJWTAuthorizer = async (
  event,
) => {
  const userId = event.requestContext.authorizer.jwt.claims.sub as string;
  const id = event.pathParameters?.id;
  if (!id) {
    return {
      statusCode: 400,
      body: JSON.stringify({ message: "id required" }),
    };
  }

  const got = await ddb.send(
    new GetCommand({
      TableName: TABLE_NAME,
      Key: { PK: `CATCH#${id}`, SK: "META" },
    }),
  );

  if (!got.Item) {
    return {
      statusCode: 404,
      body: JSON.stringify({ message: "not found" }),
    };
  }
  if (got.Item.userId !== userId) {
    return {
      statusCode: 403,
      body: JSON.stringify({ message: "forbidden" }),
    };
  }

  const body = JSON.parse(event.body ?? "{}");
  const contentType: string = body.contentType ?? "image/jpeg";
  if (!contentType.startsWith("image/")) {
    return {
      statusCode: 400,
      body: JSON.stringify({ message: "image only" }),
    };
  }

  const ext = contentType.split("/")[1] ?? "jpg";
  const key = `catches/${id}/${randomUUID()}.${ext}`;

  const uploadUrl = await getSignedUrl(
    s3,
    new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      ContentType: contentType,
    }),
    { expiresIn: 300 },
  );

  return {
    statusCode: 200,
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ uploadUrl, key }),
  };
};
