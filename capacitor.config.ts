import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'xin.zbyblq',
  appName: 'zbyblq',
  webDir: 'dist',
  // 在开发阶段，允许访问本地服务器 到生产阶段后需要删除或注释
  // server: {
  //   url: 'http://192.168.1.4:5173',
  //   cleartext: true
  // }
};

export default config;
