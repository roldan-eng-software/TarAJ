'use client';

import { useState } from 'react';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '@/src/firebase/client';
import Link from 'next/link';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);

    if (!email) {
      setMessage({ type: 'error', text: 'Informe seu email.' });
      return;
    }

    setLoading(true);

    try {
      await sendPasswordResetEmail(auth, email);

      await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email }),
      }).catch(() => {});

      setMessage({
        type: 'success',
        text: 'Se o email estiver cadastrado, você receberá um link para redefinir sua senha.',
      });
    } catch (err: any) {
      const code = err?.code;
      if (code === 'auth/user-not-found') {
        setMessage({
          type: 'success',
          text: 'Se o email estiver cadastrado, você receberá um link para redefinir sua senha.',
        });
      } else if (code === 'auth/too-many-requests') {
        setMessage({ type: 'error', text: 'Muitas tentativas. Tente novamente mais tarde.' });
      } else {
        setMessage({ type: 'error', text: 'Erro ao solicitar redefinição. Tente novamente.' });
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-md bg-white p-8 rounded-lg shadow">
        <h1 className="text-2xl font-bold text-gray-900 mb-2 text-center">
          Redefinir senha
        </h1>
        <p className="text-sm text-gray-500 mb-6 text-center">
          Digite seu email cadastrado para receber um link de redefinição.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 text-gray-900"
              autoComplete="email"
            />
          </div>

          {message && (
            <p
              className={`text-sm px-3 py-2 rounded ${
                message.type === 'success'
                  ? 'bg-green-50 text-green-700'
                  : 'bg-red-50 text-red-600'
              }`}
            >
              {message.text}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 px-4 bg-sky-600 text-white font-medium rounded-md hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 disabled:opacity-50 disabled:cursor-not-allowed transition cursor-pointer"
          >
            {loading ? 'Enviando...' : 'Enviar link de redefinição'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-500">
          <Link href="/login" className="text-sky-600 hover:text-sky-800 font-medium">
            Voltar para o login
          </Link>
        </p>
      </div>
    </div>
  );
}
