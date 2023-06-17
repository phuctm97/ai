import type * as AmplifyAuth from "@aws-amplify/auth";

declare module "@aws-amplify/auth" {
  // See https://docs.aws.amazon.com/cognito/latest/developerguide/user-pool-settings-attributes.html
  export interface CognitoUser extends AmplifyAuth.CognitoUser {
    challengeParam?: Record<string, string>;
    attributes: {
      sub: string;
      email: string;
      email_verified: boolean;
      name?: string;
    };
  }
  export type CognitoUserAttributeName = keyof CognitoUser["attributes"];
  export type CognitoUserAttributeValue<
    T extends CognitoUserAttributeName = CognitoUserAttributeName
  > = CognitoUser["attributes"][T];
}
