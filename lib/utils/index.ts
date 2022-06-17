import { GetObjectCommand, ListObjectsCommand, S3Client } from "@aws-sdk/client-s3";
import { PassThrough, Readable } from "stream";
import { Upload } from "@aws-sdk/lib-storage";
import mime from "mime-types";

export const hasLatestFileInAFolder = async (s3Client: S3Client, bucket: string, folder: string): Promise<boolean> => {
  const objects = await s3Client.send(new ListObjectsCommand({
    Bucket: bucket,
    Prefix: folder,
    MaxKeys: 1
  }));
  return !!objects.Contents?.[0]?.Key;
};

export const getLatestFileInAFolder = async (s3Client: S3Client, bucket: string, folder: string): Promise<NodeJS.ReadableStream> => {
  // By default, S3 already sorted by last modified date
  const objects = await s3Client.send(new ListObjectsCommand({
    Bucket: bucket,
    Prefix: folder,
    MaxKeys: 1
  }));
  const objectKey = objects.Contents?.[0]?.Key;
  if (objectKey) {
    return (await s3Client.send(new GetObjectCommand({
      Bucket: bucket,
      Key: objectKey
    }))).Body as NodeJS.ReadableStream;
  }

  return undefined as any;
};

export const isFileExisted = async (s3Client: S3Client, bucket: string, key: string) => {
  const objects = await s3Client.send(new ListObjectsCommand({
    Bucket: bucket,
    Prefix: key,
    MaxKeys: 1
  }));
  return !!objects.Contents?.length;
};

export const getFileByKey = async (s3Client: S3Client, bucket: string, key: string): Promise<NodeJS.ReadableStream> => {
  console.info(`Downloading ${bucket}/${key}`);
  const getFileResponse = await s3Client.send(new GetObjectCommand({
    Bucket: bucket,
    Key: key
  }));
  return getFileResponse?.Body as NodeJS.ReadableStream;
};

export const uploadFile = async (client: S3Client, bucket: string, key: string, stream: Readable) => {
  // client.send(new PutObjectCommand({
  //   Bucket: bucket,
  //   Key: key,
  //   Body: stream
  // }));

  console.info("Uploading file to:", `s3://${bucket}/${key}`);
  try {
    const multipartUpload = new Upload({
      client: client,
      params: {
        Bucket: bucket,
        Key: key,
        Body: stream.pipe(new PassThrough()),
        ContentType: mime.lookup(key) || undefined
      }
    });

    await multipartUpload.done();
    console.info("Uploaded file to:", `s3://${bucket}/${key}`);
  } catch (err) {
    console.error(err);
  }
};