import {
  CustomRunnerOptions,
  getFileNameFromHash,
  RemoteCacheImplementation,
} from 'nx-remotecache-custom';
import { RemoteCache } from '@nrwl/workspace/src/tasks-runner/default-tasks-runner';
import { getSafeRemoteCacheImplementation } from 'nx-remotecache-custom/get-safe-remote-cache-implementation';
import { join } from 'path';
import { SafeRemoteCacheImplementation } from 'nx-remotecache-custom/types/safe-remote-cache-implementation';
import { archiveFolder, extractFolder, writeCommitFile } from '../utils/file';

const createRemoteCacheRetrieve =
  (safeImplementation: Promise<SafeRemoteCacheImplementation | null>): RemoteCache['retrieve'] =>
  async (hash, cacheDirectory) => {
    const implementation = await safeImplementation;

    if (!implementation) {
      return false;
    }

    const file = getFileNameFromHash(hash);
    const { fileExists, retrieveFile } = implementation;
    const isFileCached = await fileExists(file);

    if (!isFileCached) {
      return false;
    }

    const stream = await retrieveFile(file);
    const destination = join(cacheDirectory, hash);

    if (!stream) {
      return false;
    }

    await extractFolder(stream, destination);
    await writeCommitFile(destination);

    return true;
  };

const createRemoteCacheStore =
  (safeImplementation: Promise<SafeRemoteCacheImplementation | null>): RemoteCache['store'] =>
  async (hash, cacheDirectory) => {
    const implementation = await safeImplementation;

    if (!implementation) {
      return false;
    }

    const file = getFileNameFromHash(hash);
    const { storeFile } = implementation;
    const stream = archiveFolder(cacheDirectory, [hash]);

    await storeFile(file, stream);

    return true;
  };

export const createRemoteCache = (
  implementation: Promise<RemoteCacheImplementation>,
  options: CustomRunnerOptions
): RemoteCache => {
  const safeImplementation = getSafeRemoteCacheImplementation(implementation, options);

  return {
    retrieve: createRemoteCacheRetrieve(safeImplementation),
    store: createRemoteCacheStore(safeImplementation),
  };
};
