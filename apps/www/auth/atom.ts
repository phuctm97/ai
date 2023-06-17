import type { CognitoUser } from "@aws-amplify/auth";
import type { CognitoUserSession } from "amazon-cognito-identity-js";

import { Auth } from "@aws-amplify/auth";
import { Hub } from "@aws-amplify/core";
import { atom } from "jotai";

import { isNotNil, promiseNever, symbolUnset } from "~/misc";

const userWritableAtom = atom<typeof symbolUnset | CognitoUser | undefined>(
  symbolUnset
);

userWritableAtom.onMount = (set) =>
  Hub.listen("auth", (capsule) => {
    switch (capsule.payload.event) {
      case "signIn":
      case "autoSignIn":
        set(capsule.payload.data);
        break;
      case "signOut":
        set(undefined);
        break;
    }
  });

const errUnauthenticated = "The user is not authenticated";

function asUnauthenticatedUser(err: unknown): void {
  if (err !== errUnauthenticated) throw err;
}

export const userAtom = atom<
  CognitoUser | undefined | Promise<CognitoUser | undefined>
>((get) => {
  const userWritableValue = get(userWritableAtom);
  if (userWritableValue !== symbolUnset) return userWritableValue;
  return Auth.currentAuthenticatedUser().catch(asUnauthenticatedUser);
});

export const authedAtom = atom<boolean | Promise<boolean>>((get) => {
  const userGet = get(userAtom);
  if (!(userGet instanceof Promise)) return isNotNil(userGet);
  return userGet.then(isNotNil);
});

const authorizationHeaderWritableAtom = atom<
  undefined | string | Promise<string>
>(undefined);

authorizationHeaderWritableAtom.onMount = (set) =>
  Hub.listen("auth", (capsule) => {
    switch (capsule.payload.event) {
      case "signIn":
      case "autoSignIn":
      case "tokenRefresh":
        set(undefined);
        break;
      case "signOut":
        set(promiseNever);
        break;
    }
  });

function asAuthorizationHeader(user: CognitoUserSession): string {
  return `Bearer ${user.getAccessToken().getJwtToken()}`;
}

function asUnauthenticatedAuthorizationHeader(err: unknown): Promise<string> {
  if (err !== errUnauthenticated) throw err;
  return promiseNever;
}

export const authorizationHeaderAtom = atom<string | Promise<string>>((get) => {
  const authorizationHeaderWritableValue = get(authorizationHeaderWritableAtom);
  if (authorizationHeaderWritableValue) return authorizationHeaderWritableValue;
  return Auth.currentSession()
    .then(asAuthorizationHeader)
    .catch(asUnauthenticatedAuthorizationHeader);
});
