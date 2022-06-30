import { getFileByKey, isFileExisted, uploadFile } from '../../utils';
import { CacheContextAwareImpl } from '../CacheContext';
import { ShouldRetrieveCacheImplementation, ShouldStoreCacheImplementation } from '../type';
import { Readable } from 'stream';

export class PrefixBranchProjectCache
  extends CacheContextAwareImpl
  implements ShouldRetrieveCacheImplementation, ShouldStoreCacheImplementation
{
  private _name = 'PrefixBranchProjectCache';

  get name(): string {
    return this._name;
  }

  async fileExists(filename: string | undefined): Promise<boolean> {
    return isFileExisted(
      this.getCacheContext().client,
      this.getCacheContext().bucket,
      this.getKey(filename)
    );
  }

  retrieveFile(filename: string | undefined): Promise<NodeJS.ReadableStream> {
    return getFileByKey(
      this.getCacheContext().client,
      this.getCacheContext().bucket,
      this.getKey(filename)
    );
  }

  getKey(filename: string | undefined): string {
    return `${this.getCacheContext().prefix}/${this.getCacheContext().branchName}/${
      this.getCacheContext().project
    }/${filename}`;
  }

  storeFile(filename: string, stream: Readable): Promise<unknown> {
    return uploadFile(
      this.getCacheContext().client,
      this.getCacheContext().bucket,
      this.getKey(filename),
      stream
    );
  }

  shouldStoreFile(): boolean {
    return true;
  }
}
