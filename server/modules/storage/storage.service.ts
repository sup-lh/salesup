import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Client } from 'minio';

export interface StoredObject {
  key: string;
  contentType?: string;
  size?: number;
}

@Injectable()
export class StorageService implements OnModuleInit {
  private readonly logger = new Logger(StorageService.name);
  private readonly bucket: string;
  private readonly client: Client;

  constructor(private readonly config: ConfigService) {
    const endpoint = new URL(config.get<string>('STORAGE_ENDPOINT', 'http://localhost:9000'));
    this.bucket = config.get<string>('STORAGE_BUCKET', 'newcomer');
    this.client = new Client({
      endPoint: endpoint.hostname,
      port: endpoint.port ? Number(endpoint.port) : endpoint.protocol === 'https:' ? 443 : 80,
      useSSL: endpoint.protocol === 'https:',
      accessKey: config.get<string>('STORAGE_ACCESS_KEY', 'minioadmin'),
      secretKey: config.get<string>('STORAGE_SECRET_KEY', 'change-me-in-local-env'),
    });
  }

  async onModuleInit() {
    try {
      const exists = await this.client.bucketExists(this.bucket);
      if (!exists) await this.client.makeBucket(this.bucket);
    } catch (error) {
      this.logger.warn(`MinIO bucket initialization deferred: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async upload(object: StoredObject, body: Buffer) {
    await this.client.putObject(this.bucket, object.key, body, object.size ?? body.length, {
      'Content-Type': object.contentType ?? 'application/octet-stream',
    });
    return { key: object.key, url: await this.getDownloadUrl(object.key) };
  }

  async delete(key: string) {
    await this.client.removeObject(this.bucket, key);
    return { ok: true };
  }

  getDownloadUrl(key: string, expirySeconds = 60 * 60) {
    return this.client.presignedGetObject(this.bucket, key, expirySeconds);
  }

  async isReady(): Promise<boolean> {
    return this.client.bucketExists(this.bucket);
  }
}
