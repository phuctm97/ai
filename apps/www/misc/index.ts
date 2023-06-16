import type { Atom, PrimitiveAtom } from "jotai";

import { atom } from "jotai";

export function isNotNil<T>(value: T): value is NonNullable<T> {
  return value != null;
}

export const promiseNever = new Promise<never>(() => {
  // Ignore
});

export function atomWithPromise<T>(): PrimitiveAtom<T> {
  return atom<T>(promiseNever as T);
}

export function isNotNilAtom<T>(nullableAtom: Atom<T>): Atom<boolean> {
  return atom<boolean>((get) => isNotNil(get(nullableAtom)));
}

export function mustNotNilAtom<T>(
  nullableAtom: Atom<T>
): Atom<NonNullable<T> | Promise<NonNullable<T>>> {
  return atom<NonNullable<T> | Promise<NonNullable<T>>>((get) => {
    const nullableValue = get(nullableAtom);
    return isNotNil(nullableValue) ? nullableValue : promiseNever;
  });
}
