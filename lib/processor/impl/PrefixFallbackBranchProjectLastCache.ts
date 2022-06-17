import { getLatestFileInAFolder, hasLatestFileInAFolder } from "../../utils";
import { getCacheContext } from "../CacheContext";
import { ShouldStoreCacheImplementation } from "../type";

const getKey = () => `${getCacheContext().prefix}/${getCacheContext().fallbackBranch}/${getCacheContext().project}`;

export const PrefixFallbackBranchProjectLastCache: ShouldStoreCacheImplementation = {
  name: "PrefixFallbackBranchProjectLastCache",
  shouldStoreFile: () => false,
  fileExists: async () => !!getCacheContext().fallbackBranch && hasLatestFileInAFolder(getCacheContext().client, getCacheContext().bucket, getKey()),
  retrieveFile: () => getLatestFileInAFolder(getCacheContext().client, getCacheContext().bucket, getKey()),
  storeFile: () => Promise.resolve()
};