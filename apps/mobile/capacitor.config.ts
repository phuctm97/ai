import type { CapacitorConfig } from "@capacitor/cli";

import path from "path";

const config: CapacitorConfig = {
  appId: "com.phuctm97.ai",
  appName: "AI",
  webDir: path.resolve(__dirname, "..", "www", "out-for-mobile"),
};

export default config;
