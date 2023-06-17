import type { AppProps, StackProps } from "aws-cdk-lib";

import { App, Duration, Stack } from "aws-cdk-lib";
import * as cognito from "aws-cdk-lib/aws-cognito";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as customResources from "aws-cdk-lib/custom-resources";
import * as dotenv from "dotenv";
import * as fs from "fs";
import * as path from "path";

import * as addons from "./addons";

class MyStack extends Stack {
  constructor(app: App, id: string, props?: StackProps) {
    super(app, id, props);

    const userPool = new cognito.UserPool(this, "UserPool", {
      selfSignUpEnabled: false,
      signInAliases: { username: true, preferredUsername: true, email: true },
      signInCaseSensitive: false,
      accountRecovery: cognito.AccountRecovery.EMAIL_ONLY,
    });

    const userPoolClient = userPool.addClient("Client", {
      authFlows: { userSrp: true },
      readAttributes: new cognito.ClientAttributes().withStandardAttributes({
        email: true,
        emailVerified: true,
        fullname: true,
      }),
      writeAttributes: new cognito.ClientAttributes().withStandardAttributes({
        fullname: true,
      }),
      idTokenValidity: Duration.minutes(5),
      accessTokenValidity: Duration.minutes(5),
    });

    const identityPool = new addons.cognito.IdentityPool(this, "IdentityPool", {
      allowUnauthenticatedIdentities: true,
      authenticationProviders: {
        userPools: [
          new addons.cognito.UserPoolAuthenticationProvider({
            userPool,
            userPoolClient,
          }),
        ],
      },
    });

    // Grant Cognito user's direct access to AWS resources.
    // • How to enable/customize Cognito attributes for access controls:https://docs.aws.amazon.com/cognito/latest/developerguide/using-afac-with-cognito-identity-pools.html
    // • How to use Cognito attributes for access controls: https://docs.aws.amazon.com/cognito/latest/developerguide/using-attributes-for-access-control-policy-example.html
    // • Default mappings of Cognito attributes to session tags: https://docs.aws.amazon.com/cognito/latest/developerguide/provider-mappings.html
    // • How STS session tags work: https://docs.aws.amazon.com/IAM/latest/UserGuide/id_session-tags.html
    const setIdentityPoolPrincipalTagAttributeMap: customResources.AwsSdkCall =
      {
        service: "CognitoIdentity",
        action: "setPrincipalTagAttributeMap",
        parameters: {
          IdentityPoolId: identityPool.identityPoolId,
          IdentityProviderName: userPool.userPoolProviderName,
          PrincipalTags: { cognito_username: "cognito:username" },
          UseDefaults: false,
        },
        physicalResourceId: customResources.PhysicalResourceId.of(
          identityPool.identityPoolId
        ),
      };
    const deleteIdentityPoolPrincipalTagAttributeMap: customResources.AwsSdkCall =
      {
        service: "CognitoIdentity",
        action: "setPrincipalTagAttributeMap",
        parameters: {
          IdentityPoolId: identityPool.identityPoolId,
          IdentityProviderName: userPool.userPoolProviderName,
          PrincipalTags: {},
          UseDefaults: false,
        },
      };

    new customResources.AwsCustomResource(this, "IdentityPoolPrincipalTags", {
      onCreate: setIdentityPoolPrincipalTagAttributeMap,
      onUpdate: setIdentityPoolPrincipalTagAttributeMap,
      onDelete: deleteIdentityPoolPrincipalTagAttributeMap,
      policy: customResources.AwsCustomResourcePolicy.fromSdkCalls({
        resources: [identityPool.identityPoolArn],
      }),
      installLatestAwsSdk: false,
    });

    const assistantTable = new dynamodb.Table(this, "AssistantTable", {
      partitionKey: { name: "userId", type: dynamodb.AttributeType.STRING },
      sortKey: { name: "assistantId", type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
    });

    assistantTable.grantReadWriteData(identityPool.authenticatedRole);

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
