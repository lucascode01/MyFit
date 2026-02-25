'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import type { Video, Category } from '@/types';
import type { PaginatedResponse } from '@/types';
import { VideoCard } from '@/features/videos/VideoCard';
import { VideoPlayer } from '@/features/videos/VideoPlayer';
import { useAuth } from '@/features/auth/AuthProvider';

export default function DashboardPage() {
  const { user } = useAuth();
  const [videos, setVideos] = useState<Video[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [categorySlug, setCategorySlug] = useState<string>('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);

  /** Mostrar Editar/Excluir: API envia can_edit ou, como fallback, usuário é profissional/admin. */
  const canShowActions = (v: Video) =>
    v.can_edit === true || user?.role === 'professional' || user?.role === 'admin';

  const [editingVideo, setEditingVideo] = useState<Video | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editCategories, setEditCategories] = useState<number[]>([]);
  const [editError, setEditError] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);

  const [videoToDelete, setVideoToDelete] = useState<Video | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  useEffect(() => {
    (async () => {
      const params = new URLSearchParams();
      if (categorySlug) params.set('category_slug', categorySlug);
      if (search) params.set('search', search);
      const q = params.toString();
      const [catRes, vidRes] = await Promise.all([
        api<Category[]>('/categories/'),
        api<PaginatedResponse<Video>>(`/videos/${q ? `?${q}` : ''}`),
      ]);
      if (catRes.success && Array.isArray(catRes.data)) setCategories(catRes.data);
      if (vidRes.success) setVideos(vidRes.data.results ?? []);
      setLoading(false);
    })();
  }, [categorySlug, search]);

  function openEditModal(video: Video) {
    setEditingVideo(video);
    setEditTitle(video.title);
    setEditDesc(video.description ?? '');
    setEditCategories(video.categories?.map((c) => c.id) ?? []);
    setEditError('');
  }

  async function handleSaveEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editingVideo) return;
    setEditError('');
    setSavingEdit(true);
    const res = await api<Video>(`/videos/${editingVideo.id}/edit/`, {
      method: 'PATCH',
      body: JSON.stringify({
        title: editTitle.trim(),
        description: editDesc.trim(),
        categories: editCategories,
      }),
    });
    setSavingEdit(false);
    if (res.success && res.data) {
      setVideos((prev) => prev.map((v) => (v.id === editingVideo.id ? res.data! : v)));
      setEditingVideo(null);
    } else {
      setEditError(res.error?.message ?? 'Erro ao salvar.');
    }
  }

  async function handleConfirmDelete() {
    if (!videoToDelete) return;
    setDeleteError('');
    setDeleting(true);
    const res = await api<null>(`/videos/${videoToDelete.id}/edit/`, { method: 'DELETE' });
    setDeleting(false);
    if (res.success) {
      setVideos((prev) => prev.filter((v) => v.id !== videoToDelete.id));
      if (selectedVideo?.id === videoToDelete.id) setSelectedVideo(null);
      setVideoToDelete(null);
    } else {
      setDeleteError(res.error?.message ?? 'Não foi possível excluir.');
    }
  }

  return (
    <div>
      <h1 className="text-xl sm:text-2xl font-semibold mb-4">Treinos</h1>
      <div className="flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-2 mb-4">
        <select
          className="input-field w-full sm:w-auto sm:min-w-[180px]"
          value={categorySlug}
          onChange={(e) => setCategorySlug(e.target.value)}
        >
          <option value="">Todas as categorias</option>
          {categories.map((c) => (
            <option key={c.id} value={c.slug}>
              {c.display_name || c.name}
            </option>
          ))}
        </select>
        <input
          type="search"
          placeholder="Buscar..."
          className="input-field w-full sm:flex-1 sm:min-w-[120px] sm:max-w-xs"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>
      {selectedVideo ? (
        <div className="mb-6 -mx-4 sm:mx-0">
          <VideoPlayer
            video={selectedVideo}
            onClose={() => setSelectedVideo(null)}
          />
        </div>
      ) : null}
      {loading ? (
        <p className="text-white/60 py-4">Carregando vídeos...</p>
      ) : videos.length === 0 ? (
        <p className="text-white/60 py-4">Nenhum vídeo encontrado.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {videos.map((v) => (
            <VideoCard
              key={v.id}
              video={v}
              onClick={() => setSelectedVideo(v)}
              onEdit={canShowActions(v) ? () => openEditModal(v) : undefined}
              onDelete={canShowActions(v) ? () => setVideoToDelete(v) : undefined}
            />
          ))}
        </div>
      )}

      {editingVideo && (
        <div className="fixed inset-0 z-20 flex items-center justify-center p-4 bg-black/70">
          <div className="card max-w-lg w-full p-4 sm:p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-semibold mb-4">Editar vídeo</h2>
            <form onSubmit={handleSaveEdit} className="flex flex-col gap-3">
              <label className="text-sm text-white/80">Título</label>
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="input-field"
                required
              />
              <label className="text-sm text-white/80">Descrição</label>
              <textarea
                value={editDesc}
                onChange={(e) => setEditDesc(e.target.value)}
                className="input-field min-h-[80px]"
                rows={3}
              />
              <label className="text-sm text-white/80">Categorias (pode escolher várias)</label>
              <select
                multiple
                className="input-field min-h-[100px]"
                value={editCategories.map(String)}
                onChange={(e) => {
                  const sel = e.target;
                  setEditCategories(Array.from(sel.selectedOptions).map((o) => Number(o.value)));
                }}
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.display_name || c.name}
                  </option>
                ))}
              </select>
              <p className="text-white/50 text-xs mt-1">Segure Ctrl (ou Cmd) para múltipla seleção.</p>
              {editError && <p className="text-red-400 text-sm">{editError}</p>}
              <div className="flex flex-col sm:flex-row gap-2 mt-2">
                <button type="submit" className="btn-primary w-full sm:w-auto" disabled={savingEdit}>
                  {savingEdit ? 'Salvando...' : 'Salvar'}
                </button>
                <button type="button" onClick={() => setEditingVideo(null)} className="btn-secondary w-full sm:w-auto">
                  Cancelar
                </button>
              </div>
              <div className="mt-4 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => {
                    setVideoToDelete(editingVideo);
                    setEditingVideo(null);
                  }}
                  className="text-red-400 hover:text-red-300 text-sm font-medium"
                >
                  Excluir vídeo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {videoToDelete && (
        <div className="fixed inset-0 z-20 flex items-center justify-center p-4 bg-black/70">
          <div className="card max-w-sm w-full p-4 sm:p-6">
            <h2 className="text-lg font-semibold mb-2">Excluir vídeo</h2>
            <p className="text-white/80 text-sm mb-4">
              Tem certeza que deseja excluir &quot;{videoToDelete.title}&quot;? Esta ação não pode ser desfeita.
            </p>
            {deleteError && <p className="text-red-400 text-sm mb-2">{deleteError}</p>}
            <div className="flex flex-col sm:flex-row gap-2">
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={deleting}
                className="btn-primary bg-red-600 hover:bg-red-700 w-full sm:w-auto"
              >
                {deleting ? 'Excluindo...' : 'Excluir'}
              </button>
              <button
                type="button"
                onClick={() => { setVideoToDelete(null); setDeleteError(''); }}
                disabled={deleting}
                className="btn-secondary w-full sm:w-auto"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
