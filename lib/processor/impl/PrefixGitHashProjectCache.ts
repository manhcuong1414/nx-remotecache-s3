import { getFileByKey, isFileExisted, uploadFile } from '../../utils';
import { ShouldRetrieveCacheImplementation, ShouldStoreCacheImplementation } from '../type';
import { CacheContextAwareImpl } from '../CacheContext';
import simpleGit from 'simple-git';
import { Readable } from 'stream';

const getCurrentCommitHash = () => simpleGit().revparse('HEAD');

export class PrefixGitHashProjectCache
  extends CacheContextAwareImpl
  implements ShouldStoreCacheImplementation, ShouldRetrieveCacheImplementation
{
  private _name = 'PrefixGitHashProjectCache';
  get name(): string {
    return this._name;
  }

  async fileExists(): Promise<boolean> {
    return isFileExisted(
      this.getCacheContext().client,
      this.getCacheContext().bucket,
      this.getKey(await getCurrentCommitHash())
    );
  }

  async retrieveFile(): Promise<NodeJS.ReadableStream> {
    return getFileByKey(
      this.getCacheContext().client,
      this.getCacheContext().bucket,
      this.getKey(await getCurrentCommitHash())
    );
  }

  getKey(filename: string | undefined): string {
    return `${this.getCacheContext().prefix}/git/${this.getCacheContext().branchName}/${
      this.getCacheContext().project
    }/${filename}.tar.gz`;
  }

  async storeFile(_: string | undefined, stream: Readable): Promise<void> {
    await uploadFile(
      this.getCacheContext().client,
      this.getCacheContext().bucket,
      this.getKey(await getCurrentCommitHash()),
      stream
    );
  }

  shouldStoreFile(): boolean {
    return true;
  }
}
