import { mkdir, writeFile } from "fs/promises";
import { pipeline } from "stream/promises";
import { create, extract } from "tar";
import { Readable } from "stream";

export const extractFolder = async (stream: NodeJS.ReadableStream, destination: string) => {
  await mkdir(destination, { recursive: true });
  return await pipeline(
    stream,
    extract({
      C: destination,
      strip: 1
    })
  );
};

export const archiveFolder = (cwd: string, folders: string[]): Readable =>
  Readable.from(create({ gzip: true, C: cwd }, folders));

const COMMIT_FILE_EXTENSION = ".commit";
const COMMIT_FILE_CONTENT = "true";
export const writeCommitFile = (destination: string) => {
  const commitFilePath = destination + COMMIT_FILE_EXTENSION;
  return writeFile(commitFilePath, COMMIT_FILE_CONTENT);
};