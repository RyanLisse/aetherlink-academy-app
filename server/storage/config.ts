export interface StorageConfig{
 readonly bucket:string;
 readonly endpoint:string;
 readonly accessKeyId:string;
 readonly secretAccessKey:string;
 readonly region:string;
}

type Source=Record<string,string|undefined>;
const pick=(source:Source,...names:string[])=>{for(const name of names){const value=source[name];if(typeof value==='string'&&value.trim())return value.trim();}return '';};

export const readStorageConfig=(source:Source=process.env):StorageConfig=>({
 bucket:pick(source,'S3_BUCKET','R2_BUCKET'),
 endpoint:pick(source,'S3_ENDPOINT','R2_ENDPOINT').replace(/\/+$/,''),
 accessKeyId:pick(source,'S3_ACCESS_KEY_ID','R2_ACCESS_KEY_ID'),
 secretAccessKey:pick(source,'S3_SECRET_ACCESS_KEY','R2_SECRET_ACCESS_KEY'),
 region:pick(source,'S3_REGION','R2_REGION')||'auto',
});

export const isStorageConfigured=(config:StorageConfig)=>Boolean(config.bucket&&config.endpoint&&config.accessKeyId&&config.secretAccessKey);
