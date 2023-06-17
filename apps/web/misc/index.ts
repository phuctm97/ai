import type { Atom, PrimitiveAtom } from "jotai";

import { atom } from "jotai";

export const symbolUnset = Symbol("unset");

export const promiseNever = new Promise<never>(() => {
  // Ignore
});

export function atomWithPromise<T>(): PrimitiveAtom<T> {
  return atom<T>(promiseNever as T);
}

export function isNotNil<T>(value: T): value is NonNullable<T> {
  return value != null;
}

export function isNotNilAtom<T>(
  nullableAtom: Atom<T | Promise<T>>
): Atom<boolean | Promise<boolean>> {
  return atom<boolean | Promise<boolean>>((get) => {
    const nullableGet = get(nullableAtom);
    if (nullableGet instanceof Promise) return nullableGet.then(isNotNil);
    return isNotNil(nullableGet);
  });
}

export function mustNotNil<T>(value: T): NonNullable<T> | Promise<never> {
  return isNotNil(value) ? value : promiseNever;
}

export function mustNotNilAtom<T>(
  nullableAtom: Atom<T | Promise<T>>
): Atom<NonNullable<T> | Promise<NonNullable<T>>> {
  return atom<NonNullable<T> | Promise<NonNullable<T>>>((get) => {
    const nullableGet = get(nullableAtom);
    if (nullableGet instanceof Promise) return nullableGet.then(mustNotNil);
    return mustNotNil(nullableGet);
  });
}
