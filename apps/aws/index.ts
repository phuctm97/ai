import type { AppProps, StackProps } from "aws-cdk-lib";

import { App, Stack } from "aws-cdk-lib";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as dotenv from "dotenv";
import * as fs from "fs";
import * as path from "path";

import * as addons from "./addons";

class MyStack extends Stack {
  constructor(app: App, id: string, props?: StackProps) {
    super(app, id, props);

    addons.cfn.destroyOnRemoval(
      ...this.node.children.filter(
        (child) => !addons.cfn.is(child, lambda.CfnFunction)
      )
    );
  }
}

class MyApp extends App {
  constructor(props?: AppProps) {
    super(props);

    for (const fileName of [".env.local", ".env"]) {
      const filePath = path.resolve(__dirname, fileName);
      if (!fs.existsSync(filePath)) continue;
      dotenv.config({ path: filePath });
    }

    new MyStack(this, "AI");
  }
}

new MyApp();
