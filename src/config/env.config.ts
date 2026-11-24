import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '4000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  storage: {
    provider: process.env.STORAGE_PROVIDER || 's3',
    bucket: process.env.STORAGE_BUCKET || 'videos',
    endpoint: process.env.STORAGE_ENDPOINT || undefined,
    region: process.env.STORAGE_REGION || 'us-east-1',
    accessKeyId: process.env.STORAGE_ACCESS_KEY || '',
    secretAccessKey: process.env.STORAGE_SECRET_KEY || '',
    forcePathStyle: process.env.STORAGE_FORCE_PATH_STYLE === 'true',
  },
};
