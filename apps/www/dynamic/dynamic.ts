import type { Analytics } from "@aws-amplify/analytics";
import type { Getter } from "jotai";

import { Auth } from "@aws-amplify/auth";
import { Hub } from "@aws-amplify/core";
import { atom } from "jotai";

async function configureAmplify(
  category: typeof Auth | typeof Analytics,
  data: object
): Promise<void> {
  return new Promise((resolve, reject) => {
    let close: (() => void) | undefined;
    try {
      const channel = category.getModuleName().toLowerCase();
      const event =
        channel === "analytics" ? "pinpointProvider_configured" : "configured";
      close = Hub.listen(channel, (capsule) => {
        switch (capsule.payload.event) {
          case event:
            close?.();
            resolve();
            break;
        }
      });
      category.configure(data);
    } catch (err) {
      close?.();
      reject(err);
    }
  });
}

async function configure(): Promise<void> {
  await configureAmplify(Auth, {
    region: process.env.NEXT_PUBLIC_REGION,
    userPoolId: process.env.NEXT_PUBLIC_USER_POOL_ID,
    userPoolWebClientId: process.env.NEXT_PUBLIC_USER_POOL_WEB_CLIENT_ID,
    identityPoolId: process.env.NEXT_PUBLIC_IDENTITY_POOL_ID,
  });
}

const configurePromise = configure();

const asyncConfiguredAtom = atom(false);

const asyncConfigureAtom = atom(
  (get) => get(asyncConfiguredAtom),
  async (get, set) => {
    if (get(asyncConfiguredAtom)) return;
    // Run async configurations
    await new Promise((resolve) => window.setTimeout(resolve));
    set(asyncConfiguredAtom, true);
  }
);

const configuredAtom = atom(false);

const configureAtom = atom(
  (get) => get(configuredAtom) && get(asyncConfiguredAtom),
  (get, set) => {
    if (get(configuredAtom)) return;
    // Run configurations
    set(asyncConfigureAtom).catch(console.error);
    set(configuredAtom, true);
  }
);

configureAtom.onMount = (set) => set();

async function dynamicRead(get: Getter): Promise<boolean> {
  await configurePromise;
  return get(configureAtom);
}

export const dynamicAtom = atom(dynamicRead);
