"use client";

import type { FC, PropsWithChildren } from "react";

import { Provider } from "jotai";

import { dynamic } from "~/dynamic";

const Auth = dynamic(import("~/auth"));
const Aws = dynamic(import("~/aws"));

export const Configuration: FC<PropsWithChildren> = ({ children }) => (
  <Provider>
    <Auth />
    <Aws />
    {children}
  </Provider>
);
