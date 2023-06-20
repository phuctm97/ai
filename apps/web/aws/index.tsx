import type { ICredentials } from "@aws-amplify/core";
import type { FC } from "react";

import { Auth } from "@aws-amplify/auth";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { atom, useAtomValue } from "jotai";
import { Suspense, useEffect } from "react";

import { credentialsAtom } from "~/auth";

function asDynamoDBClient(credentials: ICredentials): DynamoDBClient {
  return new DynamoDBClient({
    region: process.env.NEXT_PUBLIC_REGION,
    credentials: Auth.essentialCredentials(credentials),
  });
}

export const dynamoDBClientAtom = atom<
  DynamoDBClient | Promise<DynamoDBClient>
>((get) => {
  const credentialsGet = get(credentialsAtom);
  if (credentialsGet instanceof Promise)
    return credentialsGet.then(asDynamoDBClient);
  return asDynamoDBClient(credentialsGet);
});

function asDynamoDBDocumentClient(
  dynamoDBClient: DynamoDBClient
): DynamoDBDocumentClient {
  return DynamoDBDocumentClient.from(dynamoDBClient);
}

export const dynamoDBDocumentClientAtom = atom<
  DynamoDBDocumentClient | Promise<DynamoDBDocumentClient>
>((get) => {
  const dynamoDBClientGet = get(dynamoDBClientAtom);
  if (dynamoDBClientGet instanceof Promise)
    return dynamoDBClientGet.then(asDynamoDBDocumentClient);
  return asDynamoDBDocumentClient(dynamoDBClientGet);
});

const DynamoDBDocumentClientWorker: FC = () => {
  const dynamoDBDocumentClient = useAtomValue(dynamoDBDocumentClientAtom);
  useEffect(
    () => () => dynamoDBDocumentClient.destroy(),
    [dynamoDBDocumentClient]
  );
  return null;
};

const DynamoDBClientWorker: FC = () => {
  const dynamoDBClient = useAtomValue(dynamoDBClientAtom);
  useEffect(() => () => dynamoDBClient.destroy(), [dynamoDBClient]);
  return (
    <Suspense>
      <DynamoDBDocumentClientWorker />
    </Suspense>
  );
};

const AwsWorker: FC = () => (
  <Suspense>
    <DynamoDBClientWorker />
  </Suspense>
);

export default AwsWorker;
