// eslint-disable-next-line no-unused-vars
import type { ForgeConfig } from '@electron-forge/shared-types';
import { FusesPlugin } from '@electron-forge/plugin-fuses';
import { FuseV1Options, FuseVersion } from '@electron/fuses';
import { readdir, unlinkSync } from 'fs';
import { resolve } from 'path';

const includeFolders = ['/node_modules', '/dist'];
const includePaths = ['/package.json'];

const config: ForgeConfig = {
  packagerConfig: {
    name: 'ABC Client 17',
    asar: true,
    icon: resolve(__dirname, './build/icon'),
    // Removes dependencies in devDependencies from node_modules.
    prune: true,
    ignore: (path) => {
      let ignore = true;

      // If the blank path ('') is ignored, nothing is included and the build crashes.
      if (includePaths.includes(path) || path === '') {
        return false;
      }

      for (const item of includeFolders) {
        if (path.startsWith(item)) {
          ignore = false;
          break;
        }
      }

      return ignore;
    },
  },
  rebuildConfig: {},
  makers: [],
  plugins: [
    new FusesPlugin({
      version: FuseVersion.V1,
      [FuseV1Options.RunAsNode]: false,
      [FuseV1Options.EnableCookieEncryption]: true,
      [FuseV1Options.EnableNodeOptionsEnvironmentVariable]: false,
      [FuseV1Options.EnableNodeCliInspectArguments]: false,
      [FuseV1Options.EnableEmbeddedAsarIntegrityValidation]: true,
      [FuseV1Options.OnlyLoadAppFromAsar]: true,
      // Setting this to false breaks the app. It just shows a white screen.
      [FuseV1Options.GrantFileProtocolExtraPrivileges]: true,
    }),
  ],
  hooks: {
    packageAfterExtract: async (_, buildPath) => {
      readdir(resolve(buildPath, 'locales'), (_, files) => {
        files.forEach((file) => {
          if (!file.match(/en-.+.+\.pak$/)) {
            // Remove everything except the English locale files
            unlinkSync(resolve(buildPath, 'locales', file));
          }
        });
      });
    },
  },
};

export default config;
