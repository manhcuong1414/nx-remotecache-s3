import { getFileByKey, isFileExisted, uploadFile } from "../../utils";
import { getCacheContext } from "../CacheContext";
import { ShouldStoreCacheImplementation } from "../type";

const getKey = (filename: string) => `${getCacheContext().prefix}/${getCacheContext().branchName}/${getCacheContext().project}/${filename}`;

export const PrefixBranchProjectCache: ShouldStoreCacheImplementation = {
  name: "PrefixBranchProjectCache",
  shouldStoreFile: () => true,
  fileExists: (filename) => isFileExisted(getCacheContext().client, getCacheContext().bucket, getKey(filename)),
  storeFile: (filename, stream) => uploadFile(getCacheContext().client, getCacheContext().bucket, getKey(filename), stream),
  retrieveFile: (filename) => getFileByKey(getCacheContext().client, getCacheContext().bucket, getKey(filename))
};