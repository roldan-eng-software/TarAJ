'use client';

import { useState, useRef } from 'react';
import type { TaskAttachment } from '@/src/domain/attachments/attachment-service';

interface TaskAttachmentsProps {
  taskId: string;
  attachments?: TaskAttachment[];
}

export default function TaskAttachments({
  taskId,
  attachments = [],
}: TaskAttachmentsProps) {
  const [uploading, setUploading] = useState(false);
  const [attachmentList, setAttachmentList] = useState<TaskAttachment[]>(attachments);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    try {
      setUploading(true);
      setError(null);
      const file = files[0];

      const token = document.cookie
        .split('; ')
        .find((row) => row.startsWith('token='))
        ?.split('=')[1];

      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch(`/api/tasks/${taskId}/attachments`, {
        method: 'POST',
        headers: token ? { authorization: `Bearer ${token}` } : {},
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to upload attachment');
      }

      const newAttachment: TaskAttachment = await res.json();
      setAttachmentList((prev) => [newAttachment, ...prev]);

      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload attachment');
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        {attachmentList.length === 0 ? (
          <p className="text-gray-500 text-sm">Nenhum anexo ainda.</p>
        ) : (
          attachmentList.map((attachment) => (
            <div
              key={attachment.id}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
            >
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{attachment.fileName}</p>
                <p className="text-xs text-gray-600">
                  {formatFileSize(attachment.fileSize)} •{' '}
                  {attachment.uploadedByName} •{' '}
                  {attachment.createdAt?.toLocaleString('pt-BR')}
                </p>
              </div>
              {attachment.downloadUrl && (
                <a
                  href={attachment.downloadUrl}
                  download={attachment.fileName}
                  className="ml-4 px-3 py-1 text-sm text-sky-600 hover:text-sky-700 shrink-0"
                >
                  Download
                </a>
              )}
            </div>
          ))
        )}
      </div>

      {error && <p className="text-red-500 text-xs">{error}</p>}

      <div className="border-t pt-4">
        <input
          ref={fileInputRef}
          type="file"
          onChange={(e) => handleFileSelect(e.target.files)}
          disabled={uploading}
          className="hidden"
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="w-full px-4 py-2 text-sm font-medium text-gray-700 border border-dashed border-gray-300 rounded-lg hover:border-gray-400 hover:bg-gray-50 disabled:opacity-50 transition"
        >
          {uploading ? 'Enviando...' : '+ Adicionar anexo'}
        </button>
      </div>
    </div>
  );
}
