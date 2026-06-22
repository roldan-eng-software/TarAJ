'use client';

import { useState, useRef } from 'react';
import type { TaskComment } from '@/src/domain/comments/comment-service';

interface TaskCommentsProps {
  taskId: string;
  comments?: TaskComment[];
}

export default function TaskComments({ taskId, comments = [] }: TaskCommentsProps) {
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = async () => {
    if (!newComment.trim()) return;

    try {
      setIsSubmitting(true);
      setError(null);

      const res = await fetch(`/api/tasks/${taskId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ content: newComment }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to submit comment');
      }

      setNewComment('');
      if (textareaRef.current) {
        textareaRef.current.focus();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit comment');
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      handleSubmit();
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-3" role="list">
        {comments.length === 0 ? (
          <p className="text-gray-500 text-sm">Nenhum comentário ainda.</p>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} role="listitem" className="bg-gray-50 p-3 rounded-lg">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-medium text-sm">{comment.authorName}</p>
                  <p className="text-xs text-gray-600">
                    {comment.createdAt?.toLocaleString('pt-BR')}
                  </p>
                </div>
              </div>
              <p className="text-sm mt-2 text-gray-900 whitespace-pre-wrap">{comment.content}</p>
              {comment.mentions.length > 0 && (
                <p className="text-xs text-sky-600 mt-2">
                  Mencionou: {comment.mentions.join(', ')}
                </p>
              )}
            </div>
          ))
        )}
      </div>

      <div className="border-t pt-4">
        <label htmlFor="comment-textarea" className="block text-sm font-medium text-gray-900 mb-2">
          Adicionar comentário
        </label>
        <textarea
          ref={textareaRef}
          id="comment-textarea"
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Digite seu comentário (use @nome para mencionar, Ctrl+Enter para enviar)"
          className="w-full p-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
          rows={3}
          disabled={isSubmitting}
        />
        {error && <p className="text-red-500 text-xs mt-1" role="alert">{error}</p>}
        <button
          onClick={handleSubmit}
          disabled={!newComment.trim() || isSubmitting}
          className="mt-2 px-4 py-2 bg-sky-500 text-white text-sm font-medium rounded-lg hover:bg-sky-600 disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          {isSubmitting ? 'Enviando...' : 'Enviar'}
        </button>
      </div>
    </div>
  );
}
