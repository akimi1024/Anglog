import { Catch } from "@anglog/shared";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand } from "@aws-sdk/lib-dynamodb";
import { APIGatewayProxyHandlerV2 } from "aws-lambda";

const client = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const TABLE_NAME = process.env.TABLE_NAME!;

export const handler: APIGatewayProxyHandlerV2 = async (event) => {
  const id = event.pathParameters?.id;
  if (!id) {
    return {
      statusCode: 400,
      body: JSON.stringify({ message: "id required" }),
    };
  }

  const res = await client.send(
    new GetCommand({
      TableName: TABLE_NAME,
      Key: { PK: `CATCH#${id}`, SK: "META" },
    }),
  );

  if (!res) {
    return {
      statusCode: 404,
      body: JSON.stringify({ message: "not found" }),
    };
  }
  return {
    statusCode: 200,
    headers: { "content-type": "application/json" },
    body: JSON.stringify(res.Item as Catch),
  };
};
