"use client";

import { dynamic } from "~/dynamic";

import PageFallback from "./page-fallback";

export default dynamic(import("./page-component"), PageFallback);
