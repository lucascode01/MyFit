'use client';

import type { Video } from '@/types';
import { getMediaUrl } from '@/lib/api';

interface VideoPlayerProps {
  video: Video;
  onClose: () => void;
}

export function VideoPlayer({ video, onClose }: VideoPlayerProps) {
  const url = video.url ? getMediaUrl(video.url) : video.url;

  return (
    <div className="card p-4">
      <div className="flex justify-between items-start mb-3">
        <h2 className="text-lg font-semibold">{video.title}</h2>
        <button
          type="button"
          onClick={onClose}
          className="text-white/60 hover:text-white text-sm"
        >
          Fechar
        </button>
      </div>
      {url ? (
        <div className="aspect-video w-full max-w-4xl mx-auto bg-black rounded-lg overflow-hidden">
          <video
            src={url}
            controls
            className="w-full h-full"
            playsInline
          >
            Seu navegador não suporta vídeo.
          </video>
        </div>
      ) : (
        <p className="text-white/60 py-8 text-center">Vídeo indisponível.</p>
      )}
      {video.description && (
        <p className="text-white/70 text-sm mt-3">{video.description}</p>
      )}
      <p className="text-white/50 text-xs mt-2">{video.professional_name}</p>
    </div>
  );
}
