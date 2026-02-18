'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { getMediaUrl } from '@/lib/api';
import type { Video, Category } from '@/types';
import type { PaginatedResponse } from '@/types';
import { VideoCard } from '@/features/videos/VideoCard';
import { VideoPlayer } from '@/features/videos/VideoPlayer';

export default function DashboardPage() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [categorySlug, setCategorySlug] = useState<string>('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);

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
      if (catRes.success) setCategories(catRes.data);
      if (vidRes.success) setVideos(vidRes.data.results ?? []);
      setLoading(false);
    })();
  }, [categorySlug, search]);

  return (
    <div>
      <h1 className="text-xl font-semibold mb-4">Treinos</h1>
      <div className="flex flex-wrap gap-2 mb-4">
        <select
          className="input-field w-auto min-w-[160px]"
          value={categorySlug}
          onChange={(e) => setCategorySlug(e.target.value)}
        >
          <option value="">Todas as categorias</option>
          {categories.map((c) => (
            <option key={c.id} value={c.slug}>
              {c.name}
            </option>
          ))}
        </select>
        <input
          type="search"
          placeholder="Buscar..."
          className="input-field flex-1 min-w-[120px] max-w-xs"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>
      {selectedVideo ? (
        <div className="mb-6">
          <VideoPlayer
            video={selectedVideo}
            onClose={() => setSelectedVideo(null)}
          />
        </div>
      ) : null}
      {loading ? (
        <p className="text-white/60">Carregando vídeos...</p>
      ) : videos.length === 0 ? (
        <p className="text-white/60">Nenhum vídeo encontrado.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {videos.map((v) => (
            <VideoCard
              key={v.id}
              video={v}
              onClick={() => setSelectedVideo(v)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
