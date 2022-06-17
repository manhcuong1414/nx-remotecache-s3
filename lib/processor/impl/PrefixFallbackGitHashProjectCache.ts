import { getFileByKey, isFileExisted } from "../../utils";
import { getCacheContext } from "../CacheContext";
import { ShouldStoreCacheImplementation } from "../type";

const getKey = (filename: string) => `${getCacheContext().prefix}/git/${getCacheContext().branchName}/${getCacheContext().project}/${filename}`;

export const PrefixFallbackGitHashProjectCache: ShouldStoreCacheImplementation = {
  name: "PrefixFallbackGitHashProjectCache",
  shouldStoreFile: () => false,
  fileExists: async (filename) => !!getCacheContext().fallbackGitHash && isFileExisted(getCacheContext().client, getCacheContext().bucket, getKey(filename)),
  retrieveFile: () => getFileByKey(getCacheContext().client, getCacheContext().bucket, getKey(getCacheContext().fallbackGitHash as string)),
  storeFile: () => Promise.resolve()
};