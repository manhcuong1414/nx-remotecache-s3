import { Readable } from 'stream';

export interface RemoteCacheImplementation {
  /**
   * A name to identify your remote cache.
   * Mainly used for console logging. So please use a pretty string.
   * @example `name: 'My Beautiful Cache'`
   */
  name: string;
}

export interface ShouldRetrieveCacheImplementation extends RemoteCacheImplementation {
  getKey: (key?: string) => string;
  /**
   * Checks whether a file exists on the remote cache.
   * @param filename Filename of the file.
   * @returns `true` if the file exists, `false` if not.
   */
  fileExists: (filename?: string) => Promise<boolean>;
  /**
   * Retrieves a file from the remote cache.
   * @param filename Filename of the file.
   * @returns Buffer of the data that was retrieved from the remote cache.
   */
  retrieveFile: (filename?: string) => Promise<NodeJS.ReadableStream>;
}

export interface ShouldStoreCacheImplementation extends RemoteCacheImplementation {
  shouldStoreFile(filename: string): boolean;

  storeFile: (filename: string, data: Readable) => Promise<unknown>;
}

export interface S3RunnerOptions {
  url: string;
  secretKey: string;
  accessKey: string;
  bucket: string;
  region?: string;
  project: string;
  prefix: string;
  localCacheBuildFor: string[];
}
