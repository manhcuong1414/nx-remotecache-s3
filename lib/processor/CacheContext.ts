import { S3Client } from "@aws-sdk/client-s3";
import { getCurrentTask } from "./TaskAware";

interface CacheContext {
  client: S3Client,

  prefix: string,
  bucket: string,
  branchName: string,
  fallbackBranch: string | undefined,
  project: string,

  fallbackGitHash: string | undefined;
}

let cacheContext: CacheContext = {
  bucket: '',
  branchName: '',
  client: null as any,
  fallbackBranch: '',
  fallbackGitHash: '',
  prefix: '',
  get project() {
    return getCurrentTask()?.target.project;
  }
};

export const getCacheContext = () => cacheContext;

export const setCacheContext = (config: Partial<CacheContext>) => {
  cacheContext = {...cacheContext, ...config};
}