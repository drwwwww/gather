const path = require("path");
const { getDefaultConfig } = require("expo/metro-config");

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, "../..");
const rootNavigation = path.join(workspaceRoot, "node_modules", "@react-navigation");

const config = getDefaultConfig(projectRoot);

config.watchFolders = [workspaceRoot];
// Project first: mobile must resolve its own React 19 (Expo 54); web stays on React 18.
// postinstall links expo-font into projectRoot/node_modules so native paths exist for Metro watch.
config.resolver.nodeModulesPaths = [
  path.join(projectRoot, "node_modules"),
  path.join(workspaceRoot, "node_modules"),
];
config.resolver.disableHierarchicalLookup = true;

// Monorepo: never resolve @react-navigation/* from a stale nested copy under apps/mobile.
// (ensure-hoisted-module-links also deletes that folder on prestart/postinstall.)
config.resolver.extraNodeModules = {
  ...(config.resolver.extraNodeModules || {}),
  "@react-navigation/bottom-tabs": path.join(rootNavigation, "bottom-tabs"),
  "@react-navigation/core": path.join(rootNavigation, "core"),
  "@react-navigation/elements": path.join(rootNavigation, "elements"),
  "@react-navigation/native": path.join(rootNavigation, "native"),
  "@react-navigation/native-stack": path.join(rootNavigation, "native-stack"),
  "@react-navigation/routers": path.join(rootNavigation, "routers"),
};

module.exports = config;
