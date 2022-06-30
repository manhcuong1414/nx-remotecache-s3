import { getLatestFileInAFolder, hasLatestFileInAFolder } from '../../utils';
import { CacheContextAwareImpl } from '../CacheContext';
import { ShouldRetrieveCacheImplementation } from '../type';

export class PrefixBranchProjectLastCache
  extends CacheContextAwareImpl
  implements ShouldRetrieveCacheImplementation
{
  private _name = 'PrefixBranchProjectLastCache';

  get name(): string {
    return this._name;
  }

  async fileExists(): Promise<boolean> {
    return hasLatestFileInAFolder(
      this.getCacheContext().client,
      this.getCacheContext().bucket,
      this.getKey()
    );
  }

  retrieveFile(): Promise<NodeJS.ReadableStream> {
    return getLatestFileInAFolder(
      this.getCacheContext().client,
      this.getCacheContext().bucket,
      this.getKey()
    );
  }

  getKey(): string {
    return `${this.getCacheContext().prefix}/${this.getCacheContext().branchName}/${
      this.getCacheContext().project
    }`;
  }
}
