import { Plugin } from 'vite'

export declare type TencentConfig = {
  secretId: string; // 你的secretId
  secretKey: string; // 你的secretKey
  bucket: string; // 存储桶名称
  region: string; // 存储桶地区
  ignore: string; // 忽略文件，不写默认去除html
  base: string; // url,完整cdn的地址前缀https://**.com/**/
  from: string; // 上传目录，默认dist
  test: boolean; // 是否测试，默认false
  enabled: boolean; // 是否开启，默认true
};
/**
* 腾讯云cos插件
* @param config cos配置
* @returns
*/
declare function vitePluginTencentOss(options: TencentConfig): Plugin

export { vitePluginTencentOss as default }