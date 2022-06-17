import { getFileByKey, isFileExisted, uploadFile } from "../../utils";
import { getCacheContext } from "../CacheContext";
import simpleGit from "simple-git";
import { ShouldStoreCacheImplementation } from "../type";

const getKey = (filename: string) => `${getCacheContext().prefix}/git/${getCacheContext().branchName}/${getCacheContext().project}/${filename}`;

export const PrefixGitHashProjectCache: ShouldStoreCacheImplementation = {
  name: "PrefixGitHashProjectCache",
  shouldStoreFile: () => true,
  fileExists: async () => isFileExisted(getCacheContext().client, getCacheContext().bucket, getKey(await simpleGit().revparse("HEAD"))),
  retrieveFile: async () => getFileByKey(getCacheContext().client, getCacheContext().bucket, getKey(await simpleGit().revparse("HEAD"))),
  storeFile: async (_, stream) => {
    const commitHash = await simpleGit().revparse("HEAD");
    await uploadFile(getCacheContext().client, getCacheContext().bucket, `${getCacheContext().prefix}/git/${getCacheContext().project}/${commitHash}.tar.gz`, stream);
  }
};