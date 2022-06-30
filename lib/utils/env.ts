export const getEnv = (key: string) => process.env[key];

export const ENV_URL = "NX_CACHE_S3_URL";
export const ENV_ACCESS_KEY = "NX_CACHE_S3_ACCESS_KEY";
export const ENV_SECRET_KEY = "NX_CACHE_S3_SECRET_KEY";
export const ENV_PATH = "NX_CACHE_S3_BUCKET";
export const ENV_REGION = "NX_CACHE_S3_REGION";
export const ENV_FALLBACK_BRANCH = "NX_CACHE_S3_FALLBACK_BRANCH";
export const ENV_FALLBACK_GIT_HASH = "NX_CACHE_S3_FALLBACK_GIT_HASH";
