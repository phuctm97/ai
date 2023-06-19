import type { CognitoUser } from "@aws-amplify/auth";
import type { ICredentials } from "@aws-amplify/core";
import type { CognitoUserSession } from "amazon-cognito-identity-js";
import type { FC } from "react";

import { Auth } from "@aws-amplify/auth";
import { Hub } from "@aws-amplify/core";
import { atom, useAtom, useAtomValue } from "jotai";
import { useEffect } from "react";

import { isNotNilAtom, mustNotNilAtom, symbolUnset } from "~/misc";

const userListenableAtom = atom<typeof symbolUnset | CognitoUser | undefined>(
  symbolUnset
);

userListenableAtom.onMount = (set) =>
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

const errUnauthed = "The user is not authenticated";

function userNullableCatch(err: unknown): undefined {
  if (err !== errUnauthed) throw err;
  return undefined;
}

const userNullableAtom = atom<
  CognitoUser | undefined | Promise<CognitoUser | undefined>
>((get) => {
  const userListenableGet = get(userListenableAtom);
  if (userListenableGet !== symbolUnset) return userListenableGet;
  return Auth.currentAuthenticatedUser().catch(userNullableCatch);
});

export const userAtom = mustNotNilAtom(userNullableAtom);

const sessionNullableAtom = atom<CognitoUserSession | undefined>(undefined);

export const sessionAtom = mustNotNilAtom(sessionNullableAtom);

const credentialsNullableAtom = atom<ICredentials | undefined>(undefined);

export const credentialsAtom = mustNotNilAtom(credentialsNullableAtom);

function asAuthorizationHeader(session: CognitoUserSession): string {
  return `Bearer ${session.getAccessToken().getJwtToken()}`;
}

export const authorizationHeaderAtom = atom<string | Promise<string>>((get) => {
  const sessionGet = get(sessionAtom);
  if (sessionGet instanceof Promise)
    return sessionGet.then(asAuthorizationHeader);
  return asAuthorizationHeader(sessionGet);
});

export const authedAtom = isNotNilAtom(userNullableAtom);

interface UserWorkerProps {
  user: CognitoUser;
}

const UserWorker: FC<UserWorkerProps> = ({ user }) => {
  const [session, setSession] = useAtom(sessionNullableAtom);
  const [credentials, setCredentials] = useAtom(credentialsNullableAtom);
  useEffect(() => {
    let active = true;
    Auth.currentSession()
      .then((session) => {
        if (active) setSession(session);
      })
      .catch((err) => {
        if (active) console.error(err);
      });
    Auth.currentCredentials()
      .then((credentials) => {
        if (active) setCredentials(credentials);
      })
      .catch((err) => {
        if (active) console.error(err);
      });
    return () => {
      active = false;
      setSession(undefined);
      setCredentials(undefined);
    };
  }, [user, setSession, setCredentials]);
  useEffect(() => {
    if (!session) return;
    let active = true;
    const expiration = Math.min(
      session.getAccessToken().getExpiration(),
      session.getIdToken().getExpiration()
    );
    const timeout = window.setTimeout(() => {
      if (active)
        user.refreshSession(session.getRefreshToken(), (err) => {
          if (active)
            if (err) console.error(err);
            else
              Auth.currentSession()
                .then((session) => {
                  if (active) setSession(session);
                })
                .catch((err) => {
                  if (active) console.error(err);
                });
        });
    }, (expiration - 60) * 1000 - Date.now());
    return () => {
      active = false;
      window.clearTimeout(timeout);
    };
  }, [user, session, setSession]);
  useEffect(() => {
    if (!credentials || !credentials.expiration) return;
    let active = true;
    const timeout = window.setTimeout(() => {
      if (active)
        Auth.currentCredentials()
          .then((credentials) => {
            if (active) setCredentials(credentials);
          })
          .catch((err) => {
            if (active) console.error(err);
          });
    }, credentials.expiration.getTime());
    return () => {
      active = false;
      window.clearTimeout(timeout);
    };
  }, [user, credentials, setCredentials]);
  return null;
};

const AuthWorker: FC = () => {
  const user = useAtomValue(userAtom);
  return <UserWorker user={user} />;
};

export default AuthWorker;
