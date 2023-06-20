import type { DynamicOptionsLoadingProps } from "next/dynamic";
import type { FC } from "react";

const PageFallback: FC<DynamicOptionsLoadingProps> = () => (
  <main className="container mx-auto flex max-w-md flex-col items-center justify-start px-4 py-10">
    Loading…
  </main>
);

export default PageFallback;
