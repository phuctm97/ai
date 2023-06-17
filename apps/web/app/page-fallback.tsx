import type { FC } from "react";

const PageFallback: FC = () => (
  <main className="container mx-auto flex max-w-md flex-col items-center justify-start space-y-4 px-4 py-10">
    Loading…
  </main>
);

export default PageFallback;
