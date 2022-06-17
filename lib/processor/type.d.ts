import { RemoteCacheImplementation } from "nx-remotecache-custom/types/remote-cache-implementation";

export interface ShouldStoreCacheImplementation extends RemoteCacheImplementation {
  shouldStoreFile(filename: string): boolean;
}