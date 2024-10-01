This repo is to reprodce this issue: https://github.com/getsentry/sentry-electron/issues/992

To reproduce:
1. run `npm install`
2. run `npm run dev`
3. Observe the error in the console
4. Comment lines 7-17 in `src/main/index.ts` for everything to work as expected. 