import type { Construct } from "constructs";

import { CfnOutput, CfnResource, RemovalPolicy } from "aws-cdk-lib";

export type CfnResourceClass = typeof CfnResource.prototype.constructor & {
  readonly CFN_RESOURCE_TYPE_NAME: string;
};

export function is<T extends CfnResourceClass>(
  cfnConstruct: Construct | undefined,
  cfnClass: T
): boolean {
  if (!cfnConstruct) return false;
  if (CfnResource.isCfnResource(cfnConstruct))
    return cfnConstruct.cfnResourceType === cfnClass.CFN_RESOURCE_TYPE_NAME;
  return is(cfnConstruct.node.tryFindChild("Resource"), cfnClass);
}

export class MissingEnvironmentVariableError extends Error {
  constructor(public readonly key: string) {
    super(`Missing environment variable: ${key}.`);
  }
}

export function env(key: string): string {
  const value = process.env[key];
  if (!value) throw new MissingEnvironmentVariableError(key);
  return value;
}

export class InvalidOutputError extends Error {
  constructor(public readonly key: string, public readonly value: unknown) {
    super(`Invalid output: key=${key} value=${value}.`);
  }
}

export function output(
  scope: Construct,
  records: Record<string, string>
): void {
  for (const key in records) {
    const value = records[key];
    if (typeof value !== "string") throw new InvalidOutputError(key, value);
    new CfnOutput(scope, key, { value });
  }
}

export function batchApplyRemovalPolicy(
  removalPolicy: RemovalPolicy,
  ...constructs: Construct[]
): void {
  for (const construct of constructs)
    if (CfnResource.isCfnResource(construct))
      construct.applyRemovalPolicy(removalPolicy);
    else {
      const resource = construct.node.tryFindChild("Resource");
      if (resource && CfnResource.isCfnResource(resource))
        resource.applyRemovalPolicy(removalPolicy);
    }
}

export function destroyOnRemoval(...constructs: Construct[]): void {
  batchApplyRemovalPolicy(RemovalPolicy.DESTROY, ...constructs);
}

export function retainOnRemoval(...constructs: Construct[]): void {
  batchApplyRemovalPolicy(RemovalPolicy.RETAIN, ...constructs);
}

export function snapshotOnRemoval(...constructs: Construct[]): void {
  batchApplyRemovalPolicy(RemovalPolicy.SNAPSHOT, ...constructs);
}
