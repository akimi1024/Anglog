import { APIGatewayProxyHandlerV2WithJWTAuthorizer } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand } from "@aws-sdk/lib-dynamodb";

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const TABLE_NAME = process.env.TABLE_NAME!;

export const handler: APIGatewayProxyHandlerV2WithJWTAuthorizer = async (
  event,
) => {
  const userId = event.requestContext.authorizer.jwt.claims.sub as string;
  const jobId = event.queryStringParameters?.jobId;
  if (!jobId)
    return {
      statusCode: 400,
      body: JSON.stringify({ message: "jobId required" }),
    };

  const got = await ddb.send(
    new GetCommand({
      TableName: TABLE_NAME,
      Key: { PK: `ADVISOR#${jobId}`, SK: "META" },
    }),
  );
  if (!got.Item)
    return { statusCode: 404, body: JSON.stringify({ message: "not found" }) };
  if (got.Item.userId !== userId)
    return { statusCode: 403, body: JSON.stringify({ message: "forbidden" }) };

  return {
    statusCode: 200,
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      status: got.Item.status,
      answer: got.Item.answer ?? null,
      catchIds: got.Item.catchIds ?? [],
    }),
  };
};
