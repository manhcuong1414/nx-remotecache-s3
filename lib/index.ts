import { S3Client } from '@aws-sdk/client-s3';
import { CustomRunnerOptions, initEnv, RemoteCacheImplementation } from 'nx-remotecache-custom';
import simpleGit from 'simple-git';
import defaultTasksRunner from '@nrwl/workspace/tasks-runners/default';
import { PrefixBranchProjectCache } from './processor/impl/PrefixBranchProjectCache';
import { PrefixGitHashProjectCache } from './processor/impl/PrefixGitHashProjectCache';
import { getCurrentTask, wrapTaskAware } from './processor/TaskAware';
import {
  ENV_ACCESS_KEY,
  ENV_FALLBACK_BRANCH,
  ENV_FALLBACK_GIT_HASH,
  ENV_PATH,
  ENV_REGION,
  ENV_SECRET_KEY,
  ENV_URL,
  getEnv,
} from './utils/env';
import { S3RunnerOptions } from './processor/type';
import { CacheContext } from './processor/CacheContext';
import { createRemoteCache } from './cache/default.remote-cache';
import { Readable } from 'stream';
import { AnyCacheProcessor } from './processor/CacheProcessor';
import { createMultiRemoteCache } from './cache/multi.remote-cache';
import { PrefixBranchProjectLastCache } from './processor/impl/PrefixBranchProjectLastCache';
import { PrefixFallbackBranchProjectLastCache } from './processor/impl/PrefixFallbackBranchProjectLastCache';
import { PrefixFallbackGitHashProjectCache } from './processor/impl/PrefixFallbackGitHashProjectCache';
import { createLocalBuildRemoteCache } from './cache/local-build.remote-cache';

type DefaultTasksRunner = typeof defaultTasksRunner;

const getClient = (options: S3RunnerOptions): S3Client => {
  return new S3Client({
    endpoint: getEnv(ENV_URL) ?? options.url,
    credentials: {
      accessKeyId: getEnv(ENV_ACCESS_KEY) ?? options.accessKey,
      secretAccessKey: getEnv(ENV_SECRET_KEY) ?? options.secretKey,
    },
    region: getEnv(ENV_REGION) ?? options.region,
  });
};
const withTaskAware =
  (taskRunner: DefaultTasksRunner): DefaultTasksRunner =>
  (tasks, options: any, context) => {
    return taskRunner(
      tasks.map((temp) => wrapTaskAware(temp)),
      options,
      context
    );
  };

// Cache context
const cacheContext: CacheContext = {
  bucket: '',
  branchName: '',
  client: null as any,
  fallbackBranch: '',
  fallbackGitHash: '',
  prefix: '',
  localCacheBuildFor: [],
  get project() {
    return getCurrentTask()?.target.project;
  },
};
const getCacheContext = () => cacheContext;
const initCacheContext = async (options: S3RunnerOptions) => {
  getCacheContext().client = getClient(options);
  getCacheContext().bucket = getEnv(ENV_PATH) ?? options.bucket;
  getCacheContext().fallbackBranch = getEnv(ENV_FALLBACK_BRANCH);
  getCacheContext().branchName = (await simpleGit().branch()).current;
  getCacheContext().prefix = options.prefix;
  getCacheContext().fallbackGitHash = getEnv(ENV_FALLBACK_GIT_HASH);
  getCacheContext().localCacheBuildFor = options.localCacheBuildFor || [];
};
//

// 1st one will download & store exact cache
const exactCacheManager = new AnyCacheProcessor();
const initExactCacheManager = () => {
  exactCacheManager.setCacheContext(getCacheContext());
  console.info(`Pre-cache has [${exactCacheManager.size()}] items`);
  exactCacheManager.register(new PrefixBranchProjectCache());
  exactCacheManager.register(new PrefixGitHashProjectCache());
  console.info(`Registered [${exactCacheManager.size()}] items`);
};
const initExactRemoteCache = (options: CustomRunnerOptions<S3RunnerOptions>) =>
  createRemoteCache(
    Promise.resolve({
      name: 'Exact Cache Storage',
      fileExists: (filename: string) => exactCacheManager.fileExists(filename),
      retrieveFile: (filename: string) => exactCacheManager.retrieveFile(filename),
      storeFile: (filename: string, data: Readable) => exactCacheManager.storeFile(filename, data),
    } as RemoteCacheImplementation),
    options
  );
// 2nd one will download cache for accelerate build task
const localBuildCacheManager = new AnyCacheProcessor();
const initLocalCacheManager = () => {
  localBuildCacheManager.setCacheContext(getCacheContext());
  console.info(`Pre-cache has [${localBuildCacheManager.size()}] items`);
  localBuildCacheManager.register(new PrefixBranchProjectLastCache());
  localBuildCacheManager.register(new PrefixFallbackBranchProjectLastCache());
  localBuildCacheManager.register(new PrefixFallbackGitHashProjectCache());
  console.info(`Registered [${localBuildCacheManager.size()}] items`);
};
const initLocalBuildRemoteCache = (options: CustomRunnerOptions<S3RunnerOptions>) =>
  createLocalBuildRemoteCache(
    Promise.resolve({
      name: 'Local Build Cache Storage',
      fileExists: (filename: string) => getCacheContext().localCacheBuildFor.includes(getCacheContext().project) && localBuildCacheManager.fileExists(filename),
      retrieveFile: (filename: string) => getCacheContext().localCacheBuildFor.includes(getCacheContext().project) && localBuildCacheManager.retrieveFile(filename),
      storeFile: (filename: string, data: Readable) => {
        if (getCacheContext().localCacheBuildFor.includes(getCacheContext().project)) {
          localBuildCacheManager.storeFile(filename, data);
        }
      }
    } as RemoteCacheImplementation),
    options
  );

const runner: DefaultTasksRunner = async (tasks: any, options: any, context: any) => {
  initEnv(options);
  await initCacheContext(options);
  initExactCacheManager();
  initLocalCacheManager();

  const multiCacheManager = await createMultiRemoteCache(
    Promise.all([initExactRemoteCache(options), initLocalBuildRemoteCache(options)])
  );

  return defaultTasksRunner(
    tasks,
    {
      ...options,
      remoteCache: multiCacheManager,
    },
    context
  ) as any;
};

export default withTaskAware(runner as DefaultTasksRunner);
