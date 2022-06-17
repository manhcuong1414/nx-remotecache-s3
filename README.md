# nx-remotecache-s3

A task runner for [@nrwl/nx](https://nx.dev/react) that uses an Minio Storage as a remote cache. This enables all team members and CI servers to share a single cache. The concept and benefits of [computation caching](https://nx.dev/angular/guides/computation-caching) are explained in the NX documentation.

This package was built with [nx-remotecache-custom](https://www.npmjs.com/package/nx-remotecache-custom) 🙌

## Setup

```
npm install --save-dev nx-remotecache-minio
```

| Parameter         | Description                                                           | Environment Variable / .env     | `nx.json`   |
|-------------------|-----------------------------------------------------------------------|---------------------------------|-------------|
| Access Key        | S3 Access Key                                                         | `NX_CACHE_S3_ACCESS_KEY`        | `accessKey` |
| Secret Key        | S3 Secret Key                                                         | `NX_CACHE_S3_SECRET_KEY`        | `secretKey` |
| URL               | Connect to a S3 Storage blob via a single URL.                        | `NX_CACHE_S3_URL`               | `url`       |
| Bucket            | Required. Specify S3 bucket                                           | `NX_CACHE_S3_BUCKET`            | `bucket`    |
| Region            | Required. Specify the location of the storage e.g. "us-west-1".       | `NX_CACHE_S3_REGION`            | `region`    |
| Fallback branch   | Optional. In case nx hash not match, fallback to another git branch.  | `NX_CACHE_S3_FALLBACK_BRANCH`   |             |
| Fallback git hash | Optional. In case nx hash not match, fallback to a specific git hash. | `NX_CACHE_S3_FALLBACK_GIT_HASH` |             |

```json
{
  "tasksRunnerOptions": {
    "default": {
      "runner": "@manhcuong1414/nx-remotecache-s3",
      "options": {
        "accessKey": "",
        "secretKey": "",
        "url": "",
        "bucket": "nx-cache",
        "region": "us-west-1",
        "cacheableOperations": ["build", "test", "lint", "e2e"]
      }
    }
  }
}
```

## Run it 🚀

Running tasks should now show the storage or retrieval from the remote cache:

```
Not Found file when use cache PrefixBranchProjectCache
Found file when use cache PrefixBranchProjectLastCache
Downloading file when use cache PrefixBranchProjectLastCache
------------------------------------------------------------------------------
Remote cache hit: S3 Storage
File: a6a64ca4849cee736dda8839bf2576adc889ae2e22c3a8d7e22879b752a9b20d.tar.gz
------------------------------------------------------------------------------
```

## Advanced Configuration

| Option       | Environment Variable / .env | Description                                                                                           |
| ------------ | --------------------------- | ----------------------------------------------------------------------------------------------------- |
| `name`       | `NX_CACHE_NAME`             | Set to provide task runner name for logging. Overrides name provided in implementation.               |
| `verbose`    |                             | Set to receive full stack traces whenever errors occur. Best used for debugging. **Default:** `false` |
| `silent`     |                             | Set to mute success and info logs. **Default:** `false`                                               |
| `dotenv`     |                             | Set to `false` to disable reading `.env` into `process.env`. **Default:** `true`                      |
| `dotenvPath` |                             | Set to read `.env` files from a different folder.                                                     |

```json
"tasksRunnerOptions": {
  "default": {
    "options": {
      "name": "My Storage",
      "verbose": true,
      "silent": true
    }
  }
}
```

## Others Custom Runners

| Runner                                                                     | Storage            |
| -------------------------------------------------------------------------- | ------------------ |
| [nx-remotecache-azure](https://www.npmjs.com/package/nx-remotecache-azure) | Azure Blob Storage |
| [nx-remotecache-minio](https://www.npmjs.com/package/nx-remotecache-minio) | MinIO Storage     |
