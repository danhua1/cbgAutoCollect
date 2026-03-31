import { defineConfig } from 'umi';

export default defineConfig({
  npmClient: 'npm',
  routes: [{ path: '/', component: '@/pages/Accounts' }],
  favicons: [],
});
