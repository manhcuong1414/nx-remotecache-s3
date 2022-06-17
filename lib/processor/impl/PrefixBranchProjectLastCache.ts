import { getLatestFileInAFolder, hasLatestFileInAFolder } from "../../utils";
import { getCacheContext } from "../CacheContext";
import { ShouldStoreCacheImplementation } from "../type";

const getKey = () => `${getCacheContext().prefix}/${getCacheContext().branchName}/${getCacheContext().project}`;

export const PrefixBranchProjectLastCache: ShouldStoreCacheImplementation = {
  name: "PrefixBranchProjectLastCache",
  shouldStoreFile: () => false,
  fileExists: () => hasLatestFileInAFolder(getCacheContext().client, getCacheContext().bucket, getKey()),
  retrieveFile: () => getLatestFileInAFolder(getCacheContext().client, getCacheContext().bucket, getKey()),
  storeFile: () => Promise.resolve()
};