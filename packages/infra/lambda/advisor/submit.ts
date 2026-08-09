import { APIGatewayProxyHandlerV2WithJWTAuthorizer } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";
import { LambdaClient, InvokeCommand } from "@aws-sdk/client-lambda";
import { randomUUID } from "crypto";

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const lambdaClient = new LambdaClient({});
const TABLE_NAME = process.env.TABLE_NAME!;
const WORKER = process.env.WORKER_FUNCTION_NAME!;

export const handler: APIGatewayProxyHandlerV2WithJWTAuthorizer = async (
  event,
) => {
  const userId = event.requestContext.authorizer.jwt.claims.sub as string;
  const body = JSON.parse(event.body ?? "{}");
  const question = (body.question ?? "").trim();
  if (!question)
    return {
      statusCode: 400,
      body: JSON.stringify({ message: "question required" }),
    };

  const jobId = randomUUID();
  const now = new Date().toISOString();
  await ddb.send(
    new PutCommand({
      TableName: TABLE_NAME,
      Item: {
        PK: `ADVISOR#${jobId}`,
        SK: "META",
        userId,
        question,
        status: "running",
        createdAt: now,
        updatedAt: now,
      },
    }),
  );
  await lambdaClient.send(
    new InvokeCommand({
      FunctionName: WORKER,
      InvocationType: "Event", // ← 非同期。即返る
      Payload: Buffer.from(JSON.stringify({ jobId, question, userId })),
    }),
  );
  return {
    statusCode: 202,
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ jobId }),
  };
};
