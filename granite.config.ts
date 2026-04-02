import { defineConfig } from '@apps-in-toss/web-framework/config';

export default defineConfig({
  appName: 'dangi-weather',

  brand: {
    displayName: '단기날씨',
    primaryColor: '#3182F6',
    icon: '',
  },

  web: {
    host: 'localhost',
    port: 5173,
    commands: {
      dev: 'vite',
      build: 'tsc -b && vite build',
    },
  },

  permissions: [
    {
      name: 'location',
      access: 'access',
    },
  ],

  outdir: 'dist',

  webViewProps: {
    type: 'partner',
  },
});