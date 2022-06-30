import {
  CustomRunnerOptions,
  getFileNameFromHash,
  RemoteCacheImplementation,
} from 'nx-remotecache-custom';
import { RemoteCache } from '@nrwl/workspace/src/tasks-runner/default-tasks-runner';
import { getSafeRemoteCacheImplementation } from 'nx-remotecache-custom/get-safe-remote-cache-implementation';
import { SafeRemoteCacheImplementation } from 'nx-remotecache-custom/types/safe-remote-cache-implementation';
import { archiveFolder, extractFolder } from '../utils/file';
import { readdir, rm } from 'fs/promises';
import { copy } from 'fs-extra';
import { workspaceRoot } from '@nrwl/workspace/src/utils/app-root';
import { join } from 'path';

const createRemoteCacheStore =
  (safeImplementation: Promise<SafeRemoteCacheImplementation | null>): RemoteCache['store'] =>
  async (hash, cacheDirectory) => {
    const implementation = await safeImplementation;

    if (!implementation) {
      return false;
    }

    const file = getFileNameFromHash(hash);
    const { storeFile } = implementation;
    const dirs = await readdir(cacheDirectory);
    const stream = archiveFolder(
      cacheDirectory,
      dirs.filter((fileName) => fileName !== 'terminalOutputs' && fileName !== 'outputs')
    );

    await storeFile(file, stream);

    return true;
  };

const createRemoteCacheRetrieve =
  (safeImplementation: Promise<SafeRemoteCacheImplementation | null>): RemoteCache['retrieve'] =>
  async (hash) => {
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

    if (!stream) {
      return false;
    }

    const destination = join(workspaceRoot, 'tmp');
    await extractFolder(stream, destination);
    const cachedDirectory = join(destination, 'outputs');
    await copy(cachedDirectory, workspaceRoot, { recursive: true, overwrite: true });
    await rm(destination, { recursive: true, force: true });
    // await writeCommitFile(destination);

    return false; // for local build cache, even cache is hit, should not use the cache as output, let the task run again, the cache is downloaded only for boosting task run speed
  };

export const createLocalBuildRemoteCache = (
  implementation: Promise<RemoteCacheImplementation>,
  options: CustomRunnerOptions
): RemoteCache => {
  const safeImplementation = getSafeRemoteCacheImplementation(implementation, options);

  return {
    retrieve: createRemoteCacheRetrieve(safeImplementation),
    store: createRemoteCacheStore(safeImplementation),
  };
};
