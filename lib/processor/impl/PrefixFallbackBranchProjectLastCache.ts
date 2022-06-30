import { getLatestFileInAFolder, hasLatestFileInAFolder } from '../../utils';
import { CacheContextAwareImpl } from '../CacheContext';
import { ShouldRetrieveCacheImplementation } from '../type';

export class PrefixFallbackBranchProjectLastCache
  extends CacheContextAwareImpl
  implements ShouldRetrieveCacheImplementation
{
  private _name = 'PrefixFallbackBranchProjectLastCache';

  get name(): string {
    return this._name;
  }

  async fileExists(): Promise<boolean> {
    return (
      !!this.getCacheContext().fallbackBranch &&
      hasLatestFileInAFolder(
        this.getCacheContext().client,
        this.getCacheContext().bucket,
        this.getKey()
      )
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
    return `${this.getCacheContext().prefix}/${this.getCacheContext().fallbackBranch}/${
      this.getCacheContext().project
    }`;
  }
}
