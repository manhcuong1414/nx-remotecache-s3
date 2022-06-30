import {
  RemoteCacheImplementation,
  ShouldRetrieveCacheImplementation,
  ShouldStoreCacheImplementation,
} from './type';
import { CacheContextAware, CacheContextAwareImpl } from './CacheContext';
import { Readable } from 'stream';

export abstract class CacheProcessor<P extends RemoteCacheImplementation & CacheContextAware>
  extends CacheContextAwareImpl
  implements RemoteCacheImplementation
{
  private _caches: P[] = [];
  private _name: string = 'S3 Storage';

  get name(): string {
    return this._name;
  }

  public size() {
    return this._caches.length;
  }

  protected get caches(): P[] {
    return this._caches;
  }

  public register(cache: P) {
    cache.setCacheContext(this.getCacheContext());
    this.caches.push(cache);
  }

  public abstract canHandleCache(cache: P): boolean;
}

export class DownloadCacheProcessor
  extends CacheProcessor<ShouldRetrieveCacheImplementation & CacheContextAware>
  implements ShouldRetrieveCacheImplementation
{
  getKey(): string {
    throw new Error('Should not call this function');
  }

  async fileExists(filename?: string): Promise<boolean> {
    try {
      for (const cache of this.caches) {
        if (await cache.fileExists(filename)) {
          console.info(`Found file when use cache ${cache.name}`);
          return true;
        }
        console.info(`Not Found file when use cache ${cache.name}`);
      }
    } catch (e) {
      console.error('Error when checking file', e);
    }

    return Promise.resolve(false);
  }

  async retrieveFile(filename?: string): Promise<NodeJS.ReadableStream> {
    try {
      for (const cache of this.caches) {
        if (await cache.fileExists(filename)) {
          console.info(`Downloading file when use cache ${cache.name}`);
          return cache.retrieveFile(filename);
        } else {
          console.info(`No cache found for ${cache.name}`);
        }
      }
    } catch (e) {
      console.error('Error when retrieving file', e);
    }
    return Promise.resolve(null as any);
  }

  public canHandleCache(
    cache: (RemoteCacheImplementation | ShouldRetrieveCacheImplementation) & CacheContextAware
  ): boolean {
    return Boolean((cache as ShouldRetrieveCacheImplementation).retrieveFile);
  }
}

// interface
// behavior

export class UploadCacheProcessor
  extends CacheProcessor<ShouldStoreCacheImplementation & CacheContextAware>
  implements ShouldStoreCacheImplementation
{
  async storeFile(filename: string, data: Readable): Promise<void> {
    try {
      await Promise.all(
        this.caches
          .filter((cache) => cache.shouldStoreFile(filename))
          .map((cache) => cache.storeFile(filename, data))
      );
    } catch (e) {
      console.error('Error when uploading file', e);
    }
  }

  shouldStoreFile(): boolean {
    return true;
  }

  public canHandleCache(
    cache: (RemoteCacheImplementation | ShouldStoreCacheImplementation) & CacheContextAware
  ): boolean {
    return Boolean((cache as ShouldStoreCacheImplementation).storeFile);
  }
}

export class AnyCacheProcessor
  extends CacheProcessor<RemoteCacheImplementation & CacheContextAware>
  implements ShouldStoreCacheImplementation, ShouldRetrieveCacheImplementation
{
  private downloadCacheProcessor: DownloadCacheProcessor = new DownloadCacheProcessor();
  private uploadCacheProcessor: UploadCacheProcessor = new UploadCacheProcessor();

  public register(cache: RemoteCacheImplementation & CacheContextAware) {
    this.downloadCacheProcessor.setCacheContext(this.getCacheContext());
    this.uploadCacheProcessor.setCacheContext(this.getCacheContext());

    if (this.downloadCacheProcessor.canHandleCache(cache)) {
      this.downloadCacheProcessor.register(cache as any);
    }
    if (this.uploadCacheProcessor.canHandleCache(cache)) {
      this.uploadCacheProcessor.register(cache as any);
    }
  }

  size(): number {
    return this.uploadCacheProcessor.size() + this.downloadCacheProcessor.size();
  }

  public canHandleCache(cache: RemoteCacheImplementation & CacheContextAware): boolean {
    return (
      this.downloadCacheProcessor.canHandleCache(cache) ||
      this.uploadCacheProcessor.canHandleCache(cache)
    );
  }

  async storeFile(filename: string, data: Readable): Promise<void> {
    return this.uploadCacheProcessor.storeFile(filename, data);
  }

  shouldStoreFile(): boolean {
    return this.uploadCacheProcessor.shouldStoreFile();
  }

  getKey(): string {
    return this.downloadCacheProcessor.getKey();
  }

  async fileExists(filename?: string): Promise<boolean> {
    return this.downloadCacheProcessor.fileExists(filename);
  }

  async retrieveFile(filename?: string): Promise<NodeJS.ReadableStream> {
    return this.downloadCacheProcessor.retrieveFile(filename);
  }
}
