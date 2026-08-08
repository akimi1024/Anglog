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
import { TARGET_PARTITIONS } from "aws-cdk-lib/cx-api";
import * as cloudfront from "aws-cdk-lib/aws-cloudfront";
import * as origins from "aws-cdk-lib/aws-cloudfront-origins";
import * as s3deploy from "aws-cdk-lib/aws-s3-deployment";
import { PythonFunction } from "@aws-cdk/aws-lambda-python-alpha";
import * as secrets from "aws-cdk-lib/aws-secretsmanager";

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

    // 非公開S3を CloudFront 経由で公開配信（OAC）
    const imageCdn = new cloudfront.Distribution(this, "ImageCdn", {
      defaultBehavior: {
        origin: origins.S3BucketOrigin.withOriginAccessControl(imageBucket),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
      },
    });

    // ---- web 静的サイト ----
    const webBucket = new s3.Bucket(this, "webBucket", {
      removalPolicy: RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      encryption: s3.BucketEncryption.S3_MANAGED,
    });

    // 拡張子なしURL → .html に書き換え（Next の out/ は catches/detail.html 形式）
    const rewriteFn = new cloudfront.Function(this, "WebRewriteFunction", {
      code: cloudfront.FunctionCode.fromInline(`
        function handler(event) {
          var request = event.request;
          var uri = request.uri;
          if (uri.charAt(uri.length - 1) === "/") {
            request.uri = uri + "index.html";
          } else if (uri.indexOf(".") === -1) {
            request.uri = uri + ".html";
          }
          return request;
        }
      `),
    });

    const webCdn = new cloudfront.Distribution(this, "webCdn", {
      defaultRootObject: "index.html",
      defaultBehavior: {
        origin: origins.S3BucketOrigin.withOriginAccessControl(webBucket),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        functionAssociations: [
          {
            function: rewriteFn,
            eventType: cloudfront.FunctionEventType.VIEWER_REQUEST,
          },
        ],
      },
      errorResponses: [
        {
          httpStatus: 404,
          responsePagePath: "/404.html",
          responseHttpStatus: 404,
        },
      ],
    });
    new CfnOutput(this, "WebCdnDomain", {
      value: webCdn.distributionDomainName,
    });

    new s3deploy.BucketDeployment(this, "WebDeploy", {
      sources: [s3deploy.Source.asset("../../apps/web/out")],
      destinationBucket: webBucket,
      distribution: webCdn,
      distributionPaths: ["/*"],
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
        allowOrigins: [
          "http://localhost:3000",
          `https://${webCdn.distributionDomainName}`,
        ],
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

    // 保存済みシークレットを参照
    const anthropicKey = secrets.Secret.fromSecretNameV2(
      this,
      "AnthropicKey",
      "anglog/anthropic-key",
    );

    const advisorFn = new PythonFunction(this, "AdvisorFunction", {
      entry: "lambda-py/advisor",
      index: "index.py",
      handler: "handler",
      runtime: lambda.Runtime.PYTHON_3_13,
      timeout: Duration.seconds(60),
      memorySize: 512,
      environment: {
        ANTHROPIC_API_KEY: anthropicKey.secretValue.unsafeUnwrap(),
        TABLE_NAME: table.tableName,
      },
    });

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

    const listMyCatchesFn = new NodejsFunction(this, "ListMyCatchesFunction", {
      entry: "lambda/catches/list-mine.ts",
      runtime: lambda.Runtime.NODEJS_22_X,
      timeout: Duration.seconds(10),
      environment: {
        TABLE_NAME: table.tableName,
      },
    });

    const updateCatchFn = new NodejsFunction(this, "UpdateCatchFunction", {
      entry: "lambda/catches/update.ts",
      runtime: lambda.Runtime.NODEJS_22_X,
      timeout: Duration.seconds(10),
      environment: {
        TABLE_NAME: table.tableName,
        BUCKET_NAME: imageBucket.bucketName,
      },
    });

    const deleteCatchFn = new NodejsFunction(this, "DeleteCatchFunction", {
      entry: "lambda/catches/delete.ts",
      runtime: lambda.Runtime.NODEJS_22_X,
      timeout: Duration.seconds(10),
      environment: {
        TABLE_NAME: table.tableName,
        BUCKET_NAME: imageBucket.bucketName,
      },
    });

    const uploadUrlFn = new NodejsFunction(this, "UploadUrlFunction", {
      entry: "lambda/catches/upload-url.ts",
      runtime: lambda.Runtime.NODEJS_22_X,
      timeout: Duration.seconds(10),
      environment: {
        TABLE_NAME: table.tableName,
        BUCKET_NAME: imageBucket.bucketName,
      },
    });

    new CfnOutput(this, "ImageCdnDomain", {
      value: imageCdn.distributionDomainName,
    });

    // table権限
    table.grantWriteData(createCatchFn);
    table.grantReadData(listCatchesFn);
    table.grantReadData(getCatchFn);
    table.grantReadData(listMyCatchesFn);
    table.grantReadWriteData(updateCatchFn);
    table.grantReadWriteData(deleteCatchFn);
    table.grantReadData(uploadUrlFn);
    table.grantReadData(advisorFn);

    // S3権限
    imageBucket.grantPut(uploadUrlFn);
    imageBucket.grantDelete(updateCatchFn);
    imageBucket.grantDelete(deleteCatchFn);

    httpApi.addRoutes({
      path: "/advisor",
      methods: [HttpMethod.POST],
      integration: new HttpLambdaIntegration("AdvisorIntegration", advisorFn),
      authorizer,
    });

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
      integration: new HttpLambdaIntegration("GetCatchIntegration", getCatchFn),
    });

    httpApi.addRoutes({
      path: "/catches/me",
      methods: [HttpMethod.GET],
      integration: new HttpLambdaIntegration(
        "ListMyCatchesIntegration",
        listMyCatchesFn,
      ),
      authorizer,
    });

    httpApi.addRoutes({
      path: "/catches/{id}",
      methods: [HttpMethod.PUT],
      integration: new HttpLambdaIntegration(
        "UpdateCatchesIntegration",
        updateCatchFn,
      ),
      authorizer,
    });

    httpApi.addRoutes({
      path: "/catches/{id}",
      methods: [HttpMethod.DELETE],
      integration: new HttpLambdaIntegration(
        "DeleteCatchesIntegration",
        deleteCatchFn,
      ),
      authorizer,
    });

    httpApi.addRoutes({
      path: "/catches/{id}/image-url",
      methods: [HttpMethod.POST],
      integration: new HttpLambdaIntegration(
        "UploadUrlIntegration",
        uploadUrlFn,
      ),
      authorizer,
    });
  }
}
