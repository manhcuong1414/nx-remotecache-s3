import { S3Client } from '@aws-sdk/client-s3';

export interface CacheContext {
  client: S3Client;

  prefix: string;
  bucket: string;
  branchName: string;
  fallbackBranch: string | undefined;
  project: string;

  fallbackGitHash: string | undefined;
  localCacheBuildFor: string[];
}

export interface CacheContextAware {
  getCacheContext(): CacheContext | undefined;

  setCacheContext(cacheContext: CacheContext): void;
}

export abstract class CacheContextAwareImpl implements CacheContextAware {
  private _cacheContext: CacheContext | undefined;

  getCacheContext(): CacheContext {
    if (!this._cacheContext) {
      throw new Error('No cache context available');
    }
    return this._cacheContext;
  }

  setCacheContext(cacheContext: CacheContext) {
    this._cacheContext = cacheContext;
  }
}
