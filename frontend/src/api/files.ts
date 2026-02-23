import axios from "axios";
import { api } from "./client";

export type InitUploadIn = {
  chat_id: number;
  original_name: string;
  mime_type: string;
  size_bytes: number;
};

export type InitUploadOut = {
  file_id: number;
  upload_url: string;
  object_key: string;
};

export type FileOut = {
  id: number;
  original_name: string;
  mime_type: string;
  size_bytes: number;
  is_ready: boolean;
};

export type DownloadUrlOut = {
  download_url: string;
};

export async function initUpload(payload: InitUploadIn): Promise<InitUploadOut> {
  const res = await api.post("/files/init-upload", payload);
  return res.data;
}

export async function completeUpload(file_id: number, body?: any): Promise<FileOut> {
  const res = await api.post(`/files/${file_id}/complete`, body ?? {});
  return res.data;
}

export async function listFilesByChat(chat_id: number): Promise<FileOut[]> {
  const res = await api.get(`/files/by-chat/${chat_id}`);
  return res.data;
}

export async function getDownloadUrl(file_id: number): Promise<DownloadUrlOut> {
  const res = await api.get(`/files/${file_id}/download-url`);
  return res.data;
}

export async function deleteFile(file_id: number): Promise<{ ok: boolean }> {
  const res = await api.delete(`/files/${file_id}`);
  return res.data;
}

export async function putToPresignedUrl(upload_url: string, file: File, mimeType: string) {
  await axios.put(upload_url, file, {
    headers: {
      "Content-Type": mimeType,
    },
  });
}