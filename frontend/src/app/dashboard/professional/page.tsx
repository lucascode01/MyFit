'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { api, apiAuth, apiFormData } from '@/lib/api';
import type { Video, Category, LinkedStudent, User } from '@/types';
import type { PaginatedResponse } from '@/types';
import { VideoCard } from '@/features/videos/VideoCard';
import { VideoPlayer } from '@/features/videos/VideoPlayer';
import { useAuth } from '@/features/auth/AuthProvider';

export default function ProfessionalDashboardPage() {
  const { user, setUser } = useAuth();
  const searchParams = useSearchParams();
  const hasActiveSubscription = user?.has_active_subscription ?? false;

  useEffect(() => {
    if (searchParams.get('checkout') === 'success') {
      apiAuth<User>('me/').then((res) => {
        if (res.success) setUser(res.data!);
      });
      window.history.replaceState({}, '', '/dashboard/professional');
    }
  }, [searchParams, setUser]);

  const [videos, setVideos] = useState<Video[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadDesc, setUploadDesc] = useState('');
  const [uploadUrl, setUploadUrl] = useState('');
  const [uploadCategory, setUploadCategory] = useState('');
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadError, setUploadError] = useState('');
  const [uploading, setUploading] = useState(false);

  const [students, setStudents] = useState<LinkedStudent[]>([]);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [studentEmail, setStudentEmail] = useState('');
  const [studentError, setStudentError] = useState('');
  const [addingStudent, setAddingStudent] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);

  const loadVideos = async () => {
    const res = await api<PaginatedResponse<Video>>('/videos/me/');
    if (res.success) setVideos(res.data.results ?? []);
  };

  const loadStudents = async () => {
    if (!hasActiveSubscription) return;
    setStudentsLoading(true);
    const res = await apiAuth<LinkedStudent[]>('students/');
    setStudentsLoading(false);
    if (res.success) setStudents(Array.isArray(res.data) ? res.data : []);
  };

  useEffect(() => {
    (async () => {
      const catRes = await api<Category[]>('/categories/');
      if (catRes.success) setCategories(catRes.data);
      if (hasActiveSubscription) {
        const vidRes = await api<PaginatedResponse<Video>>('/videos/me/');
        if (vidRes.success) setVideos(vidRes.data.results ?? []);
      } else {
        setVideos([]);
      }
      setLoading(false);
    })();
  }, [hasActiveSubscription]);

  useEffect(() => {
    loadStudents();
  }, [hasActiveSubscription]);

  async function handleStripeCheckout() {
    setCheckoutLoading(true);
    const res = await apiAuth<{ checkout_url: string }>('stripe/checkout/', { method: 'POST' });
    setCheckoutLoading(false);
    if (res.success && res.data.checkout_url) {
      window.location.href = res.data.checkout_url;
    }
  }

  async function handleStripePortal() {
    setPortalLoading(true);
    const res = await apiAuth<{ portal_url: string }>('stripe/portal/', { method: 'POST' });
    setPortalLoading(false);
    if (res.success && res.data.portal_url) {
      window.location.href = res.data.portal_url;
    }
  }

  async function handleAddStudent(e: React.FormEvent) {
    e.preventDefault();
    setStudentError('');
    const email = studentEmail.trim().toLowerCase();
    if (!email) {
      setStudentError('Informe o e-mail do aluno.');
      return;
    }
    setAddingStudent(true);
    const res = await apiAuth<LinkedStudent>('students/', {
      method: 'POST',
      body: JSON.stringify({ email }),
      headers: { 'Content-Type': 'application/json' },
    });
    setAddingStudent(false);
    if (res.success) {
      setStudents((s) => [res.data!, ...s]);
      setStudentEmail('');
    } else {
      setStudentError(res.error.message);
    }
  }

  async function handleRemoveStudent(id: number) {
    const res = await apiAuth<unknown>(`students/${id}/`, { method: 'DELETE' });
    if (res.success) setStudents((s) => s.filter((x) => x.id !== id));
  }

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    setUploadError('');
    setUploading(true);
    if (uploadFile) {
      const form = new FormData();
      form.append('title', uploadTitle);
      form.append('description', uploadDesc);
      form.append('video_file', uploadFile);
      if (uploadCategory) form.append('category', uploadCategory);
      const res = await apiFormData<Video>('/videos/upload/', form);
      if (res.success) {
        setVideos((v) => [res.data!, ...v]);
        setUploadOpen(false);
        setUploadTitle('');
        setUploadDesc('');
        setUploadCategory('');
        setUploadFile(null);
      } else {
        setUploadError(res.error!.message);
      }
    } else if (uploadUrl.trim()) {
      const res = await api<Video>('/videos/upload/', {
        method: 'POST',
        body: JSON.stringify({
          title: uploadTitle,
          description: uploadDesc,
          video_url: uploadUrl,
          category: uploadCategory ? Number(uploadCategory) : null,
        }),
      });
      if (res.success) {
        setVideos((v) => [res.data!, ...v]);
        setUploadOpen(false);
        setUploadTitle('');
        setUploadDesc('');
        setUploadUrl('');
        setUploadCategory('');
        setUploadError('');
      } else {
        setUploadError(res.error!.message);
      }
    } else {
      setUploadError('Informe a URL do vídeo ou envie um arquivo.');
    }
    setUploading(false);
  }

  return (
    <div>
      {/* Assinatura */}
      <div className="card p-4 sm:p-5 mb-6">
        {hasActiveSubscription ? (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <p className="text-white/90 font-medium">Assinatura ativa — você pode enviar vídeos e gerenciar alunos.</p>
            <button
              type="button"
              onClick={handleStripePortal}
              disabled={portalLoading}
              className="btn-secondary text-sm w-full sm:w-auto"
            >
              {portalLoading ? 'Abrindo...' : 'Gerenciar assinatura'}
            </button>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <p className="text-white/90">
              Assine a mensalidade para enviar vídeos e escolher quais alunos podem assistir ao seu conteúdo.
            </p>
            <button
              type="button"
              onClick={handleStripeCheckout}
              disabled={checkoutLoading}
              className="btn-primary text-sm w-full sm:w-auto"
            >
              {checkoutLoading ? 'Redirecionando...' : 'Assinar agora'}
            </button>
          </div>
        )}
      </div>

      {/* Meus alunos (só com assinatura ativa) */}
      {hasActiveSubscription && (
        <div className="card p-4 sm:p-6 mb-6">
          <h2 className="text-lg font-semibold mb-3">Meus alunos</h2>
          <p className="text-white/60 text-sm mb-4">
            Apenas os alunos listados abaixo podem ver seus vídeos no app.
          </p>
          <form onSubmit={handleAddStudent} className="flex flex-col sm:flex-row gap-2 mb-4">
            <input
              type="email"
              placeholder="E-mail do aluno"
              className="input-field flex-1"
              value={studentEmail}
              onChange={(e) => setStudentEmail(e.target.value)}
            />
            <button type="submit" className="btn-primary shrink-0" disabled={addingStudent}>
              {addingStudent ? 'Adicionando...' : 'Adicionar'}
            </button>
          </form>
          {studentError && <p className="text-red-400 text-sm mb-2">{studentError}</p>}
          {studentsLoading ? (
            <p className="text-white/60 text-sm">Carregando...</p>
          ) : students.length === 0 ? (
            <p className="text-white/60 text-sm">Nenhum aluno vinculado ainda.</p>
          ) : (
            <ul className="space-y-2">
              {students.map((s) => (
                <li
                  key={s.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 py-2 border-b border-white/10 last:border-0"
                >
                  <span className="text-sm">
                    {s.first_name || s.last_name ? `${s.first_name} ${s.last_name}`.trim() : s.email}
                    <span className="text-white/50 ml-1">({s.email})</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRemoveStudent(s.id)}
                    className="text-red-400 hover:text-red-300 text-sm"
                  >
                    Remover
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center justify-between gap-3 sm:gap-4 mb-6">
        <h1 className="text-xl sm:text-2xl font-semibold">Meus vídeos</h1>
        <div className="flex flex-col sm:flex-row gap-2">
          <Link href="/dashboard" className="btn-secondary text-sm text-center sm:text-left">
            Ver todos os treinos
          </Link>
          <button
            type="button"
            onClick={() => setUploadOpen(true)}
            className="btn-primary text-sm"
            disabled={!hasActiveSubscription}
            title={!hasActiveSubscription ? 'Assine para enviar vídeos' : undefined}
          >
            Novo vídeo
          </button>
        </div>
      </div>

      {uploadOpen && (
        <div className="card p-4 sm:p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Enviar vídeo</h2>
          <form onSubmit={handleUpload} className="space-y-4 w-full max-w-md">
            <input
              type="text"
              placeholder="Título *"
              className="input-field"
              value={uploadTitle}
              onChange={(e) => setUploadTitle(e.target.value)}
              required
            />
            <textarea
              placeholder="Descrição"
              className="input-field min-h-[80px]"
              value={uploadDesc}
              onChange={(e) => setUploadDesc(e.target.value)}
            />
            <input
              type="url"
              placeholder="URL do vídeo (ou envie arquivo abaixo)"
              className="input-field"
              value={uploadUrl}
              onChange={(e) => setUploadUrl(e.target.value)}
            />
            <div>
              <label className="block text-sm text-white/70 mb-1">Arquivo de vídeo (opcional)</label>
              <input
                type="file"
                accept="video/*"
                className="input-field"
                onChange={(e) => setUploadFile(e.target.files?.[0] ?? null)}
              />
            </div>
            <select
              className="input-field w-full"
              value={uploadCategory}
              onChange={(e) => setUploadCategory(e.target.value)}
            >
              <option value="">Sem categoria</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            {uploadError && <p className="text-red-400 text-sm">{uploadError}</p>}
            <div className="flex flex-col sm:flex-row gap-2">
              <button type="submit" className="btn-primary w-full sm:w-auto" disabled={uploading}>
                {uploading ? 'Enviando...' : 'Enviar'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setUploadOpen(false);
                  setUploadError('');
                }}
                className="btn-secondary w-full sm:w-auto"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {selectedVideo ? (
        <div className="mb-6">
          <VideoPlayer video={selectedVideo} onClose={() => setSelectedVideo(null)} />
        </div>
      ) : null}

      {loading ? (
        <p className="text-white/60 py-4">Carregando...</p>
      ) : !hasActiveSubscription ? (
        <p className="text-white/60 py-4">Assine para enviar e gerenciar seus vídeos.</p>
      ) : videos.length === 0 ? (
        <p className="text-white/60 py-4">Você ainda não enviou nenhum vídeo.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {videos.map((v) => (
            <VideoCard key={v.id} video={v} onClick={() => setSelectedVideo(v)} />
          ))}
        </div>
      )}
    </div>
  );
}
