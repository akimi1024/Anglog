import {
  Stack,
  StackProps,
  RemovalPolicy,
  CfnOutput,
  Duration,
} from "aws-cdk-lib";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as cognito from "aws-cdk-lib/aws-cognito";
import * as lambda from "aws-cdk-lib/aws-lambda";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import { HttpLambdaIntegration } from "aws-cdk-lib/aws-apigatewayv2-integrations";
import * as budgets from "aws-cdk-lib/aws-budgets";
import { Construct } from "constructs";
import { HttpUserPoolAuthorizer } from "aws-cdk-lib/aws-apigatewayv2-authorizers";
import {
  CorsHttpMethod,
  HttpApi,
  HttpMethod,
} from "aws-cdk-lib/aws-apigatewayv2";

export class AnglogStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const table = new dynamodb.Table(this, "AnglogTable", {
      tableName: "anglog",
      partitionKey: { name: "PK", type: dynamodb.AttributeType.STRING },
      sortKey: { name: "SK", type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: RemovalPolicy.DESTROY, // 本番の際はRETAIN
    });

    table.addGlobalSecondaryIndex({
      indexName: "GSI1",
      partitionKey: { name: "GSI1PK", type: dynamodb.AttributeType.STRING },
      sortKey: { name: "GSI1SK", type: dynamodb.AttributeType.STRING },
    });

    table.addGlobalSecondaryIndex({
      indexName: "GSI2",
      partitionKey: { name: "GSI2PK", type: dynamodb.AttributeType.STRING },
      sortKey: { name: "GSI2SK", type: dynamodb.AttributeType.STRING },
    });

    table.addGlobalSecondaryIndex({
      indexName: "GSI3",
      partitionKey: { name: "GSI3PK", type: dynamodb.AttributeType.STRING },
      sortKey: { name: "GSI3SK", type: dynamodb.AttributeType.STRING },
    });

    const imageBucket = new s3.Bucket(this, "ImageBucket", {
      removalPolicy: RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      encryption: s3.BucketEncryption.S3_MANAGED,
      cors: [
        {
          allowedMethods: [s3.HttpMethods.GET, s3.HttpMethods.PUT],
          allowedOrigins: ["*"],
          allowedHeaders: ["*"],
        },
      ],
    });

    const userPool = new cognito.UserPool(this, "UserPool", {
      selfSignUpEnabled: true,
      signInAliases: { email: true },
      autoVerify: { email: true },
      passwordPolicy: {
        minLength: 8,
        requireLowercase: true,
        requireDigits: true,
        requireUppercase: false,
        requireSymbols: false,
      },
      accountRecovery: cognito.AccountRecovery.EMAIL_ONLY,
      removalPolicy: RemovalPolicy.DESTROY,
    });

    const userPoolClient = userPool.addClient("WebClient", {
      authFlows: { userSrp: true },
      generateSecret: false,
    });

    const hellofn = new NodejsFunction(this, "HelloFunction", {
      entry: "lambda/hello.ts",
      runtime: lambda.Runtime.NODEJS_22_X,
      timeout: Duration.seconds(10),
    });

    const httpApi = new HttpApi(this, "AnglogHttpApi", {
      corsPreflight: {
        allowOrigins: ["http://localhost:3000"],
        allowMethods: [
          CorsHttpMethod.GET,
          CorsHttpMethod.POST,
          CorsHttpMethod.PUT,
          CorsHttpMethod.DELETE,
        ],
        allowHeaders: ["authorization", "content-type"],
      },
    });

    new CfnOutput(this, "Apiurl", {
      value: httpApi.apiEndpoint,
    });

    new CfnOutput(this, "UserPoolId", {
      value: userPool.userPoolId,
    });

    new CfnOutput(this, "UserPoolClient", {
      value: userPoolClient.userPoolClientId,
    });

    new budgets.CfnBudget(this, "MonthlyBudgets", {
      budget: {
        budgetName: "anglog-monthly",
        budgetType: "COST",
        timeUnit: "MONTHLY",
        budgetLimit: {
          amount: 13,
          unit: "USD",
        },
      },
      notificationsWithSubscribers: [
        {
          notification: {
            notificationType: "ACTUAL",
            comparisonOperator: "GREATER_THAN",
            threshold: 80,
            thresholdType: "PERCENTAGE",
          },
          subscribers: [
            { subscriptionType: "EMAIL", address: "a.miyazawa1024@gmail.com" },
          ],
        },
        {
          notification: {
            notificationType: "ACTUAL",
            comparisonOperator: "GREATER_THAN",
            threshold: 100,
            thresholdType: "PERCENTAGE",
          },
          subscribers: [
            { subscriptionType: "EMAIL", address: "a.miyazawa1024@gmail.com" },
          ],
        },
      ],
    });

    const authorizer = new HttpUserPoolAuthorizer(
      "CognitoAuthorizer",
      userPool,
      {
        userPoolClients: [userPoolClient],
      },
    );

    const createCatchFn = new NodejsFunction(this, "CreateCatchFunction", {
      entry: "lambda/catches/create.ts",
      runtime: lambda.Runtime.NODEJS_22_X,
      timeout: Duration.seconds(10),
      environment: {
        TABLE_NAME: table.tableName,
      },
    });

    const listCatchesFn = new NodejsFunction(this, "ListCatchFunction", {
      entry: "lambda/catches/list.ts",
      runtime: lambda.Runtime.NODEJS_22_X,
      timeout: Duration.seconds(10),
      environment: {
        TABLE_NAME: table.tableName,
      },
    });

    const getCatchFn = new NodejsFunction(this, "GetCatchFunction", {
      entry: "lambda/catches/get.ts",
      runtime: lambda.Runtime.NODEJS_22_X,
      timeout: Duration.seconds(10),
      environment: {
        TABLE_NAME: table.tableName,
      },
    });

    table.grantWriteData(createCatchFn);
    table.grantReadData(listCatchesFn);
    table.grantReadData(getCatchFn);

    httpApi.addRoutes({
      path: "/catches",
      methods: [HttpMethod.POST],
      integration: new HttpLambdaIntegration(
        "CreateCatchIntegration",
        createCatchFn,
      ),
      authorizer,
    });

    httpApi.addRoutes({
      path: "/catches",
      methods: [HttpMethod.GET],
      integration: new HttpLambdaIntegration(
        "ListCatchIntegration",
        listCatchesFn,
      ),
    });

      httpApi.addRoutes({
      path: "/catches/{id}",
      methods: [HttpMethod.GET],
      integration: new HttpLambdaIntegration(
        "GetCatchIntegration",
        getCatchFn,
      ),
    });
  }
}
