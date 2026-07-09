const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');
const rootNodeModules = path.resolve(workspaceRoot, 'node_modules');
const projectNodeModules = path.resolve(projectRoot, 'node_modules');
const sharedPackage = path.resolve(workspaceRoot, 'packages/shared');

const config = getDefaultConfig(projectRoot);

config.watchFolders = [
  ...(config.watchFolders || []),
  sharedPackage,
  rootNodeModules,
];
config.resolver.nodeModulesPaths = [projectNodeModules, rootNodeModules];
config.resolver.extraNodeModules = {
  react: path.resolve(rootNodeModules, 'react'),
  'react-native': path.resolve(rootNodeModules, 'react-native'),
};

module.exports = withNativeWind(config, {
  input: path.join(projectRoot, 'global.css'),
  configPath: path.join(projectRoot, 'tailwind.config.ts'),
  typescriptEnvPath: path.join(projectRoot, 'nativewind-env.d.ts'),
});
