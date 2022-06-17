import { RemoteCacheImplementation } from "nx-remotecache-custom/types/remote-cache-implementation";
import { Readable } from "stream";
import { ShouldStoreCacheImplementation } from "./type";

class CacheProcessor implements RemoteCacheImplementation {
  private caches: ShouldStoreCacheImplementation[] = [];
  private _name: string = "S3 Storage";

  get name(): string {
    return this._name;
  }

  public size() {
    return this.caches.length;
  }

  public register(cache: ShouldStoreCacheImplementation) {
    this.caches.push(cache);
  }

  async fileExists(filename: string): Promise<boolean> {
    try {
      for (const cache of this.caches) {
        if (await cache.fileExists(filename)) {
          console.info(`Found file when use cache ${cache.name}`);
          return true;
        }
        console.info(`Not Found file when use cache ${cache.name}`);
      }
    } catch (e) {
      console.error("Error when checking file", e);
    }

    return Promise.resolve(false);
  }

  async retrieveFile(filename: string): Promise<NodeJS.ReadableStream> {
    try {
      for (const cache of this.caches) {
        if (await cache.fileExists(filename)) {
          console.info(`Downloading file when use cache ${cache.name}`);
          return cache.retrieveFile(filename);
        }
      }
    } catch (e) {
      console.error("Error when retrieving file", e);
    }
    return Promise.resolve(null as any);
  }

  async storeFile(filename: string, data: Readable): Promise<void> {
    try {
      // const cloneableStream = cloneable(data);
      await Promise.all(this.caches
        .filter(cache => cache.shouldStoreFile(filename))
        .map(cache => cache.storeFile(filename, data))
      );
      // for (const cache of this.caches) {
      //   if (cache.shouldStoreFile(filename)) {
      //     console.info(`Storing file when use cache ${cache.name}`);
      //     await cache.storeFile(filename, data);
      //   }
      // }
    } catch (e) {
      console.error("Error when uploading file", e);
    }
  }

}

const cache = new CacheProcessor();

export const getCache = () => cache;