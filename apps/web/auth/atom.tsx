import type { CognitoUser } from "@aws-amplify/auth";
import type { CognitoUserSession } from "amazon-cognito-identity-js";
import type { FC } from "react";

import { Auth } from "@aws-amplify/auth";
import { Hub } from "@aws-amplify/core";
import { atom, useAtomValue, useSetAtom } from "jotai";
import { Suspense, useEffect } from "react";

import { isNotNilAtom, mustNotNilAtom, symbolUnset } from "~/misc";

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

export const errUnauthed = "The user is not authenticated";

function userNullableCatch(err: unknown): undefined {
  if (err !== errUnauthed) throw err;
  return undefined;
}

const userNullableAtom = atom<
  CognitoUser | undefined | Promise<CognitoUser | undefined>
>((get) => {
  const userWritableValue = get(userWritableAtom);
  if (userWritableValue !== symbolUnset) return userWritableValue;
  return Auth.currentAuthenticatedUser().catch(userNullableCatch);
});

export const authedAtom = isNotNilAtom(userNullableAtom);

export const userAtom = mustNotNilAtom(userNullableAtom);

const sessionRefreshableAtom = atom(0);

const refreshSessionAtom = atom(null, (get, set) =>
  set(sessionRefreshableAtom, (sessionRefreshable) => sessionRefreshable + 1)
);

function sessionNullableCatch(err: unknown): undefined {
  if (err !== errUnauthed) throw err;
  return undefined;
}

const sessionNullableAtom = atom<
  CognitoUserSession | undefined | Promise<CognitoUserSession | undefined>
>((get) => {
  get(sessionRefreshableAtom);
  return Auth.currentSession().catch(sessionNullableCatch);
});

export const sessionAtom = mustNotNilAtom(sessionNullableAtom);

function asAuthorizationHeader(session: CognitoUserSession): string {
  return `Bearer ${session.getAccessToken().getJwtToken()}`;
}

export const authorizationHeaderAtom = atom<string | Promise<string>>((get) => {
  const sessionGet = get(sessionAtom);
  if (sessionGet instanceof Promise)
    return sessionGet.then(asAuthorizationHeader);
  return asAuthorizationHeader(sessionGet);
});

const SessionWorker: FC = () => {
  const user = useAtomValue(userAtom);
  const session = useAtomValue(sessionAtom);
  const refreshSession = useSetAtom(refreshSessionAtom);
  useEffect(() => {
    const exp = Math.min(
      session.getAccessToken().getExpiration(),
      session.getIdToken().getExpiration()
    );
    const timeout = window.setTimeout(() => {
      user.refreshSession(session.getRefreshToken(), (err) => {
        if (err) console.error(err);
        else refreshSession();
      });
    }, (exp - 60) * 1000 - Date.now());
    return () => window.clearTimeout(timeout);
  }, [user, session, refreshSession]);
  return null;
};

const AuthWorker: FC = () => (
  <Suspense>
    <SessionWorker />
  </Suspense>
);

export default AuthWorker;
