import {
  _Object,
  GetObjectCommand,
  ListObjectsCommand,
  ListObjectsV2Command,
  S3Client,
} from '@aws-sdk/client-s3';
import { PassThrough, Readable } from 'stream';
import { Upload } from '@aws-sdk/lib-storage';
import * as mime from 'mime-types';

export const hasLatestFileInAFolder = async (
  s3Client: S3Client,
  bucket: string,
  folder: string
): Promise<boolean> => {
  const objects = await s3Client.send(
    new ListObjectsCommand({
      Bucket: bucket,
      Prefix: folder,
      MaxKeys: 1,
    })
  );
  return !!objects.Contents?.[0]?.Key;
};

const getDefaultValue = (value: number | undefined, defaultValue: number): number => {
  return value || defaultValue;
};

export const getLatestObjectInAFolder = async (
  s3Client: S3Client,
  bucket: string,
  folder: string,
  fromKey?: string
): Promise<_Object | undefined> => {
  const data = await s3Client.send(
    new ListObjectsV2Command({
      Bucket: bucket,
      Prefix: folder,
      StartAfter: fromKey,
    })
  );

  if (data.Contents) {
    const reversed = data.Contents.map((it) => it) // clone arr
      .sort(
        (it1, it2) =>
          getDefaultValue(it1.LastModified?.getMilliseconds(), 0) -
          getDefaultValue(it2.LastModified?.getMilliseconds(), 0)
      )
      .reverse();
    const latestItem = reversed[0];

    if (data.Contents.length === 1000) {
      // should run more
      const nextLastItem = await getLatestObjectInAFolder(
        s3Client,
        bucket,
        folder,
        data.Contents[data.Contents.length - 1].Key
      );
      if (
        nextLastItem &&
        getDefaultValue(latestItem.LastModified?.getMilliseconds(), 0) <
          getDefaultValue(nextLastItem.LastModified?.getMilliseconds(), 0)
      ) {
        return nextLastItem;
      }

      return latestItem;
    }

    return latestItem;
  }

  return undefined;
};

export const getLatestFileInAFolder = async (
  s3Client: S3Client,
  bucket: string,
  folder: string
): Promise<NodeJS.ReadableStream> => {
  // By default, S3 already sorted by last modified date
  const latestObject = await getLatestObjectInAFolder(s3Client, bucket, folder);

  const objectKey = latestObject?.Key;
  if (objectKey) {
    console.info(`Found latest key ${objectKey}`);
    return (
      await s3Client.send(
        new GetObjectCommand({
          Bucket: bucket,
          Key: objectKey,
        })
      )
    ).Body as NodeJS.ReadableStream;
  }

  return undefined as any;
};

export const isFileExisted = async (s3Client: S3Client, bucket: string, key: string) => {
  console.info(`Checking S3 file object exists at path ${key}`);
  const objects = await s3Client.send(
    new ListObjectsCommand({
      Bucket: bucket,
      Prefix: key,
      MaxKeys: 1,
    })
  );
  return !!objects.Contents?.length;
};

export const getFileByKey = async (
  s3Client: S3Client,
  bucket: string,
  key: string
): Promise<NodeJS.ReadableStream> => {
  console.info(`Downloading ${bucket}/${key}`);
  const getFileResponse = await s3Client.send(
    new GetObjectCommand({
      Bucket: bucket,
      Key: key,
    })
  );
  return getFileResponse?.Body as NodeJS.ReadableStream;
};

export const uploadFile = async (
  client: S3Client,
  bucket: string,
  key: string,
  stream: Readable
) => {
  // client.send(new PutObjectCommand({
  //   Bucket: bucket,
  //   Key: key,
  //   Body: stream
  // }));

  console.info('Uploading file to:', `s3://${bucket}/${key}`);
  try {
    const multipartUpload = new Upload({
      client: client,
      params: {
        Bucket: bucket,
        Key: key,
        Body: stream.pipe(new PassThrough()),
        ContentType: mime.lookup(key) || undefined,
      },
    });

    await multipartUpload.done();
    console.info('Uploaded file to:', `s3://${bucket}/${key}`);
  } catch (err) {
    console.error(err);
  }
};
