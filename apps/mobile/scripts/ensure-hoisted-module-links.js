/**
 * Metro / Expo autolinking can watch apps/mobile/node_modules/<pkg> even when
 * pnpm hoists the real install to the workspace root. Missing paths → ENOENT on watch (Windows).
 */
const fs = require("fs");
const path = require("path");

const mobileRoot = path.join(__dirname, "..");
const workspaceRoot = path.resolve(mobileRoot, "../..");
const mobileNm = path.join(mobileRoot, "node_modules");

// pnpm sometimes places @react-navigation/* under apps/mobile/node_modules with older
// versions than the workspace root. Metro prefers the first node_modules path → duplicate
// @react-navigation/core → SceneView / beginWork: "element type is undefined".
const nestedReactNavigation = path.join(mobileNm, "@react-navigation");
if (fs.existsSync(nestedReactNavigation)) {
  fs.rmSync(nestedReactNavigation, { recursive: true, force: true });
  console.log("[ensure-hoisted-module-links] removed apps/mobile/node_modules/@react-navigation (monorepo hoisted copy only)");
}

const PACKAGES = [
  "expo-font",
  "expo-image-picker",
  "@react-native-async-storage/async-storage",
];

for (const name of PACKAGES) {
  const target = path.resolve(workspaceRoot, "node_modules", name);
  const linkPath = path.join(mobileNm, name);

  if (!fs.existsSync(target)) {
    console.warn(`[ensure-hoisted-module-links] skip ${name}: not found at ${target}`);
    continue;
  }
  if (fs.existsSync(linkPath)) {
    continue;
  }
  // path.dirname(linkPath), not mobileNm — a scoped package like
  // @react-native-async-storage/async-storage needs its scope folder created
  // first, or the symlink itself has nowhere to go.
  fs.mkdirSync(path.dirname(linkPath), { recursive: true });
  const type = process.platform === "win32" ? "junction" : "dir";
  fs.symlinkSync(target, linkPath, type);
  console.log(`[ensure-hoisted-module-links] linked ${name} -> ${target}`);
}
