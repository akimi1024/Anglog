#! user/bin/env node
import * as cdk from "aws-cdk-lib";
import { AnglogStack } from "../lib/anglog-stack";
import { access } from "fs";

const app = new cdk.App();

new AnglogStack(app, "AnglogStack", {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
})