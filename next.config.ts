import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // A stray package-lock.json exists in the home directory; pin the workspace root to this app.
  turbopack: { root: path.resolve(__dirname) },
};

export default nextConfig;
