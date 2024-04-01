import { Plugin } from 'vite'

export declare type TencentConfig = {
  secretId: string;
  secretKey: string;
  bucket: string;
  region: string;
  bucketName: string;
  remoteDir: string;
  from: string;
  excludesExtra?: string[];
};
/**
* 腾讯云cos插件
* @param config cos配置
* @returns
*/
declare function vitePluginTencentOss(options: TencentConfig): Plugin

export { vitePluginTencentOss as default }