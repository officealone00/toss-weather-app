import { defineConfig } from '@apps-in-toss/web-framework/config';
export default defineConfig({
  appName: 'dangi-weather',
  brand: {
    displayName: '단기날씨',
    primaryColor: '#3182F6',
    icon: 'https://static.toss.im/appsintoss/24163/2934131a-571d-47ae-9ead-546ff0229c95.png',
  },
  web: {
    host: 'localhost',
    port: 5173,
    commands: {
      dev: 'ait dev',
      build: 'tsc -b && vite build',
    },
  },
  permissions: [],
  outdir: 'dist',
  webViewProps: {
    type: 'partner',
  },
});