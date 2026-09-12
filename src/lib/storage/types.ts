export interface UploadResult {
  url: string;
  key: string;
}

export interface UploadParams {
  buffer: Buffer;
  filename: string;
  contentType: string;
  folder: string;
}

export interface StorageProvider {
  upload(params: UploadParams): Promise<UploadResult>;
  delete(key: string): Promise<void>;
}
