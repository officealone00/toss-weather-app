import { defineConfig } from '@apps-in-toss/web-framework/config';

export default defineConfig({
  // ⚠️ 앱인토스 콘솔에서 등록한 앱 이름으로 변경하세요
  appName: 'toss-weather',

  brand: {
    // ⚠️ 콘솔에 등록한 이름과 동일하게 입력
    displayName: '오늘날씨',
    primaryColor: '#3182F6',
    // ⚠️ 앱 아이콘 URL (콘솔에 등록한 아이콘)
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

  // 위치 권한 요청 (날씨 앱에 필수)
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
