import { RemoteCache } from '@nrwl/workspace/src/tasks-runner/default-tasks-runner';

export const createMultiRemoteCache = async (
  remoteCachesPS: Promise<RemoteCache[]>
): Promise<RemoteCache> => {
  const remoteCaches = await remoteCachesPS;

  return {
    retrieve: async (hash: string, cacheDirectory: string) => {
      for (const cache of remoteCaches) {
        if (await cache.retrieve(hash, cacheDirectory)) {
          return true;
        }
      }
      return false;
    },
    store: async (hash: string, cacheDirectory: string) => {
      return (
        await Promise.all(remoteCaches.map((cache) => cache.store(hash, cacheDirectory)))
      ).some((result) => result);
    },
  };
};