import "./layout.css";

import type { FC, PropsWithChildren } from "react";

import { Inconsolata, Inter } from "next/font/google";

import { Configuration } from "./configuration";

const inconsolata = Inconsolata({
  variable: "--tw-font-inconsolata",
  subsets: ["latin"],
});

const inter = Inter({
  variable: "--tw-font-inter",
  subsets: ["latin"],
});

const Layout: FC<PropsWithChildren> = ({ children }) => (
  <html className={`${inconsolata.variable} ${inter.variable}`} lang="en">
    <body>
      <Configuration>{children}</Configuration>
    </body>
  </html>
);

export default Layout;
