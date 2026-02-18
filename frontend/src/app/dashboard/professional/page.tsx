'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api, apiFormData } from '@/lib/api';
import type { Video, Category } from '@/types';
import type { PaginatedResponse } from '@/types';
import { VideoCard } from '@/features/videos/VideoCard';
import { VideoPlayer } from '@/features/videos/VideoPlayer';

export default function ProfessionalDashboardPage() {
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

  const loadVideos = async () => {
    const res = await api<PaginatedResponse<Video>>('/videos/me/');
    if (res.success) setVideos(res.data.results ?? []);
  };

  useEffect(() => {
    (async () => {
      const [catRes, vidRes] = await Promise.all([
        api<Category[]>('/categories/'),
        api<PaginatedResponse<Video>>('/videos/me/'),
      ]);
      if (catRes.success) setCategories(catRes.data);
      if (vidRes.success) setVideos(vidRes.data.results ?? []);
      setLoading(false);
    })();
  }, []);

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
        setVideos((v) => [res.data, ...v]);
        setUploadOpen(false);
        setUploadTitle('');
        setUploadDesc('');
        setUploadCategory('');
        setUploadFile(null);
      } else {
        setUploadError(res.error.message);
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
        setVideos((v) => [res.data, ...v]);
        setUploadOpen(false);
        setUploadTitle('');
        setUploadDesc('');
        setUploadUrl('');
        setUploadCategory('');
        setUploadError('');
      } else {
        setUploadError(res.error.message);
      }
    } else {
      setUploadError('Informe a URL do vídeo ou envie um arquivo.');
    }
    setUploading(false);
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <h1 className="text-xl font-semibold">Meus vídeos</h1>
        <div className="flex gap-2">
          <Link href="/dashboard" className="btn-secondary text-sm">
            Ver todos os treinos
          </Link>
          <button
            type="button"
            onClick={() => setUploadOpen(true)}
            className="btn-primary text-sm"
          >
            Novo vídeo
          </button>
        </div>
      </div>

      {uploadOpen && (
        <div className="card p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Enviar vídeo</h2>
          <form onSubmit={handleUpload} className="space-y-4 max-w-md">
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
            <div className="flex gap-2">
              <button type="submit" className="btn-primary" disabled={uploading}>
                {uploading ? 'Enviando...' : 'Enviar'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setUploadOpen(false);
                  setUploadError('');
                }}
                className="btn-secondary"
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
        <p className="text-white/60">Carregando...</p>
      ) : videos.length === 0 ? (
        <p className="text-white/60">Você ainda não enviou nenhum vídeo.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {videos.map((v) => (
            <VideoCard key={v.id} video={v} onClick={() => setSelectedVideo(v)} />
          ))}
        </div>
      )}
    </div>
  );
}
