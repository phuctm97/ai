import "./layout.css";

import type { FC, PropsWithChildren } from "react";

import { Inconsolata, Inter } from "next/font/google";
import Script from "next/script";

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
      <Script id="lazy-onload-script" strategy="lazyOnload">
        {"window.dispatchEvent(new Event('lazy-load'))"}
      </Script>
    </body>
  </html>
);

export default Layout;
