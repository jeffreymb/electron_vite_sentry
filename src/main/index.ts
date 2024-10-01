import { is } from '@electron-toolkit/utils';
import icon from '../../build/icon.png?asset';
import { app, BrowserWindow } from 'electron';

import * as Sentry from '@sentry/electron/main';
import {resolve} from "path";

Sentry.init({
  enabled: false,
  dsn: process.env.SENTRY_DSN,
  transportOptions: {
    maxAgeDays: 15,
    maxQueueSize: 30,
    flushAtStartup: true,
  },
});

app.whenReady().then(async () => {
  const mainWindow = new BrowserWindow({
    icon,
    show: false,
    webPreferences: {
      preload: resolve(__dirname, '../preload/index.mjs'),
    }
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    await mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'] + '#init');
  } else {
    await mainWindow.loadFile(resolve(__dirname, '../renderer/index.html'), {
      hash: 'init',
    });
  }
})