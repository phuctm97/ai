import "client-only";

import type { Atom, Getter, WritableAtom } from "jotai";
import type { DynamicOptions, DynamicOptionsLoadingProps } from "next/dynamic";
import type { FC } from "react";

import { atom, useAtomValue } from "jotai";
import { loadable } from "jotai/utils";
import nextDynamic from "next/dynamic";
import { Suspense } from "react";

export const dynamicRestAtom = atom(true);

async function dynamicRead(get: Getter): Promise<boolean> {
  if (typeof window !== "undefined") {
    const { dynamicAtom } = await import("./dynamic");
    const dynamicGet = await get(dynamicAtom);
    const dynamicRest = get(dynamicRestAtom);
    return dynamicGet && dynamicRest;
  }
  return false;
}

export const dynamicAtom = atom(dynamicRead);

export const dynamicLoadableAtom = loadable(dynamicAtom);

export type DynamicLoader<P> = Promise<{
  default: FC<P>;
}>;

const DynamicFallback: FC<DynamicOptionsLoadingProps> = () => null;

export function dynamic<P extends JSX.IntrinsicAttributes>(
  loader: DynamicLoader<P>,
  FallbackComponent: FC<DynamicOptionsLoadingProps> = DynamicFallback
): FC<P> {
  const LoadableComponent = nextDynamic(() => loader, {
    ssr: false,
    loading: FallbackComponent as DynamicOptions<P>["loading"],
  });
  const DynamicComponent: FC<P> = (props) => {
    const dynamicLoadable = useAtomValue(dynamicLoadableAtom);
    if (dynamicLoadable.state !== "hasData" || !dynamicLoadable.data)
      return <FallbackComponent />;
    return (
      <Suspense fallback={<FallbackComponent />}>
        <LoadableComponent {...props} />
      </Suspense>
    );
  };
  return DynamicComponent;
}

export type AtomWithDynamicLoader<T> = Promise<{
  default: Atom<T | Promise<T>>;
}>;

function isWritableAtomWithDynamic<
  Value,
  Args extends unknown[] = unknown[],
  Result = unknown
>(atom: Atom<Value>): atom is WritableAtom<Value, Args, Result> {
  return "write" in atom;
}

export function atomWithDynamic<T>(
  loader: AtomWithDynamicLoader<T>,
  initialValue: T
): WritableAtom<T, [T], void> {
  const primitiveAtom = atom(initialValue);
  const loaderLoadableAtom = loadable(atom(loader));
  const getterLoadableAtom = loadable(
    atom((get) => {
      const dynamicLoadable = get(dynamicLoadableAtom);
      if (dynamicLoadable.state !== "hasData" || !dynamicLoadable.data)
        return get(primitiveAtom);
      const loaderLoadable = get(loaderLoadableAtom);
      if (loaderLoadable.state !== "hasData") return get(primitiveAtom);
      return get(loaderLoadable.data.default);
    })
  );
  return atom<T, [T, boolean?], void>(
    (get, { setSelf }) => {
      const getterLoadable = get(getterLoadableAtom);
      if (getterLoadable.state !== "hasData") return get(primitiveAtom);
      if (getterLoadable.data !== get(primitiveAtom))
        setSelf(getterLoadable.data, true);
      return getterLoadable.data;
    },
    (get, set, value, primitiveOnly) => {
      set(primitiveAtom, value);
      if (primitiveOnly) return;
      const dynamicLoadable = get(dynamicLoadableAtom);
      if (dynamicLoadable.state !== "hasData" || !dynamicLoadable.data) return;
      const loaderLoadable = get(loaderLoadableAtom);
      if (loaderLoadable.state !== "hasData") return;
      const loaderAtom = loaderLoadable.data.default;
      if (!isWritableAtomWithDynamic(loaderAtom)) return;
      set(loaderAtom, value);
    }
  );
}
