# Feature 05: Production AWS S3 Migration Guide

## Overview
When moving from your local **MinIO** environment to **AWS S3** in production, you do not need to modify any application code, rebuild the Docker container, or change route handlers.

You only update the environment variables.

---

## Step-by-Step Migration Checklist

### 1. Create your AWS S3 Bucket
* In AWS S3 Console (or via Terraform/CloudFormation), create a bucket: e.g. `production-app-media-bucket`.
* Set your preferred region (e.g., `us-east-1` or `ap-south-1`).
* If using Presigned Direct Uploads from web browsers, configure CORS on the bucket:
  ```json
  [
    {
      "AllowedHeaders": ["*"],
      "AllowedMethods": ["PUT", "GET", "HEAD"],
      "AllowedOrigins": ["https://yourdomain.com"],
      "ExposeHeaders": ["ETag"]
    }
  ]
  ```

### 2. Create IAM User / Role
Ensure your IAM user or EC2/ECS Task Role has policy permissions:
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:DeleteObject",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::production-app-media-bucket",
        "arn:aws:s3:::production-app-media-bucket/*"
      ]
    }
  ]
}
```

### 3. Update Environment Variables

#### Previous Configuration (MinIO):
```env
STORAGE_PROVIDER=s3
STORAGE_BUCKET=videos
STORAGE_ENDPOINT=http://127.0.0.1:9000
STORAGE_REGION=us-east-1
STORAGE_ACCESS_KEY=minioadmin
STORAGE_SECRET_KEY=minioadmin
STORAGE_FORCE_PATH_STYLE=true
```

#### New Configuration (AWS S3):
```env
STORAGE_PROVIDER=s3
STORAGE_BUCKET=production-app-media-bucket
STORAGE_ENDPOINT=
STORAGE_REGION=us-east-1
STORAGE_ACCESS_KEY=AKIAIOSFODNN7EXAMPLE
STORAGE_SECRET_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
STORAGE_FORCE_PATH_STYLE=false
```

### 4. Restart Server
```bash
npm start
```
The server will automatically connect to AWS S3, verify the bucket, and continue servicing all upload, stream, and download requests seamlessly.
