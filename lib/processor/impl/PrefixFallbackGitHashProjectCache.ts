import { getFileByKey, isFileExisted } from '../../utils';
import { ShouldRetrieveCacheImplementation } from '../type';
import { CacheContextAwareImpl } from '../CacheContext';

export class PrefixFallbackGitHashProjectCache
  extends CacheContextAwareImpl
  implements ShouldRetrieveCacheImplementation
{
  private _name = 'PrefixFallbackGitHashProjectCache';

  get name(): string {
    return this._name;
  }

  async fileExists(): Promise<boolean> {
    return (
      !!this.getCacheContext().fallbackGitHash &&
      isFileExisted(this.getCacheContext().client, this.getCacheContext().bucket, this.getKey())
    );
  }

  retrieveFile(): Promise<NodeJS.ReadableStream> {
    return getFileByKey(
      this.getCacheContext().client,
      this.getCacheContext().bucket,
      this.getKey()
    );
  }

  getKey(): string {
    return `${this.getCacheContext().prefix}/git/${this.getCacheContext().branchName}/${
      this.getCacheContext().project
    }/${this.getCacheContext().fallbackGitHash}.tar.gz`;
  }
}
