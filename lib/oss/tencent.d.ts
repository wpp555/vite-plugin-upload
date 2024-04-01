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
export default function (config: TencentConfig): import("vite").Plugin;
