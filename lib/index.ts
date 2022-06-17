import { S3Client } from "@aws-sdk/client-s3";
import {
  createCustomRunner,
  CustomRunnerOptions,
  initEnv,
  RemoteCacheImplementation
} from "nx-remotecache-custom";
import simpleGit from "simple-git";
import defaultTasksRunner from "@nrwl/workspace/tasks-runners/default";
import { getCacheContext } from "./processor/CacheContext";
import { getCache } from "./processor/CacheProcessor";
import { PrefixBranchProjectCache } from "./processor/impl/PrefixBranchProjectCache";
import { PrefixBranchProjectLastCache } from "./processor/impl/PrefixBranchProjectLastCache";
import {
  PrefixFallbackBranchProjectLastCache
} from "./processor/impl/PrefixFallbackBranchProjectLastCache";
import { PrefixGitHashProjectCache } from "./processor/impl/PrefixGitHashProjectCache";
import { wrapTaskAware } from "./processor/TaskAware";
import {
  PrefixFallbackGitHashProjectCache
} from "./processor/impl/PrefixFallbackGitHashProjectCache";

type DefaultTasksRunner = typeof defaultTasksRunner;

const ENV_URL = "NX_CACHE_S3_URL";
const ENV_ACCESS_KEY = "NX_CACHE_S3_ACCESS_KEY";
const ENV_SECRET_KEY = "NX_CACHE_S3_SECRET_KEY";
const ENV_PATH = "NX_CACHE_S3_BUCKET";
const ENV_REGION = "NX_CACHE_S3_REGION";
const ENV_FALLBACK_BRANCH = "NX_CACHE_S3_FALLBACK_BRANCH";
const ENV_FALLBACK_GIT_HASH = "NX_CACHE_S3_FALLBACK_GIT_HASH";

const getEnv = (key: string) => process.env[key];

interface S3RunnerOptions {
  url: string;
  secretKey: string;
  accessKey: string;
  bucket: string;
  region?: string;
  project: string;
  prefix: string;
}

const getClient = (options: CustomRunnerOptions<S3RunnerOptions>): S3Client => {
  return new S3Client({
    endpoint: getEnv(ENV_URL) ?? options.url,
    credentials: {
      accessKeyId: getEnv(ENV_ACCESS_KEY) ?? options.accessKey,
      secretAccessKey: getEnv(ENV_SECRET_KEY) ?? options.secretKey
    },
    region: getEnv(ENV_REGION) ?? options.region
  });
};

const wrapCustomRunner = <T extends Object>(
  setup: (options: CustomRunnerOptions<T>) => Promise<RemoteCacheImplementation>
): DefaultTasksRunner => (tasks, options: any, context) => {
  return createCustomRunner<T>(setup)(tasks.map(temp => wrapTaskAware(temp)), options, context);
};

const registerCaches = () => {
  console.info(`Pre-cache has [${getCache().size()}] items`);
  getCache().register(PrefixBranchProjectCache);
  getCache().register(PrefixBranchProjectLastCache);
  getCache().register(PrefixFallbackBranchProjectLastCache);
  getCache().register(PrefixGitHashProjectCache);
  getCache().register(PrefixFallbackGitHashProjectCache);
  console.info(`Registered [${getCache().size()}] items`);
};

const runner: unknown = wrapCustomRunner<S3RunnerOptions>(
  async (options): Promise<RemoteCacheImplementation> => {
    initEnv(options);
    getCacheContext().client = getClient(options);
    getCacheContext().bucket = getEnv(ENV_PATH) ?? options.bucket;
    getCacheContext().fallbackBranch = getEnv(ENV_FALLBACK_BRANCH);
    getCacheContext().branchName = (await simpleGit().branch()).current;
    getCacheContext().prefix = options.prefix;
    getCacheContext().fallbackGitHash = getEnv(ENV_FALLBACK_GIT_HASH);

    registerCaches();
    return {
      name: "S3 Storage",
      fileExists: filename => getCache().fileExists(filename),
      retrieveFile: filename => getCache().retrieveFile(filename),
      storeFile: (filename, data) => getCache().storeFile(filename, data)
    };
  }
);

export default runner;
