import {
  S3Client,
  GetObjectCommand,
  PutObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const S3 = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.CLOUDFLARE_ACCESS_KEY!,
    secretAccessKey: process.env.CLOUDFLARE_SECRET_ACCESS_KEY!,
  },
});

const getPresignedUrl = async (key: string) => {
  // Generate presigned URL for reading (GET)
  const getUrl = await getSignedUrl(
    S3,
    new GetObjectCommand({
      Bucket: process.env.CLOUDFLARE_BUCKET_NAME,
      Key: key,
    }),
    { expiresIn: 3600 }, // Valid for 1 hour
  );

  return getUrl;
};

const putPresignedUrl = async (key: string, contentType: string) => {
  // Generate presigned URL for writing (PUT)
  // Specify ContentType to restrict uploads to a specific file type
  const putUrl = await getSignedUrl(
    S3,
    new PutObjectCommand({
      Bucket: process.env.CLOUDFLARE_BUCKET_NAME,
      Key: key,
      ContentType: contentType,
    }),
    { expiresIn: 3600 },
  );

  return putUrl;
};

export const awsService = {
  getPresignedUrl,
  putPresignedUrl,
};
