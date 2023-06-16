import "client-only";

import type { Getter } from "jotai";

import { atom } from "jotai";

async function configure(): Promise<void> {
  // Run pre configurations
  await new Promise((resolve) => window.setTimeout(resolve));
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
