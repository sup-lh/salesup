'use client';
import { axiosForBackend } from '@/lib/http';

export interface UploadFileData {
  id: string;
  filePath: string;
  bucketId: string;
  url: string;
}

export async function uploadFile(file: File): Promise<UploadFileData> {
  const formData = new FormData();
  formData.append('file', file);
  const { data } = await axiosForBackend.post<{ key: string; url: string }>('/api/storage/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return {
    id: data.key,
    filePath: data.key,
    bucketId: 'newcomer',
    url: data.url,
  };
}
