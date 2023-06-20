import type { CognitoUser } from "@aws-amplify/auth";
import type { ICredentials } from "@aws-amplify/core";
import type { CognitoUserSession } from "amazon-cognito-identity-js";
import type { FC } from "react";

import { Auth } from "@aws-amplify/auth";
import { Hub } from "@aws-amplify/core";
import { atom, useAtom } from "jotai";
import { useEffect } from "react";

import { isNotNil, mustNotNilAtom, promiseNever } from "~/misc";

const errUnauthed = "The user is not authenticated";

const userNullableAtom = atom<CognitoUser | null | undefined>(undefined);

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

export const authedAtom = atom<boolean | Promise<boolean>>((get) => {
  const userNullableGet = get(userNullableAtom);
  if (typeof userNullableGet === "undefined") return promiseNever;
  return isNotNil(userNullableGet);
});

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
  const [user, setUser] = useAtom(userNullableAtom);
  useEffect(() => {
    let active = true;
    Auth.currentAuthenticatedUser()
      .then((user) => {
        if (active) setUser(user);
      })
      .catch((err) => {
        if (active)
          if (err === errUnauthed) setUser(null);
          else console.error(err);
      });
    return () => {
      active = false;
      setUser(undefined);
    };
  }, [setUser]);
  useEffect(
    () =>
      Hub.listen("auth", (capsule) => {
        switch (capsule.payload.event) {
          case "signIn":
          case "autoSignIn":
            setUser(capsule.payload.data);
            break;
          case "signOut":
            setUser(null);
            break;
        }
      }),
    [setUser]
  );
  return user ? <UserWorker user={user} /> : null;
};

export default AuthWorker;
