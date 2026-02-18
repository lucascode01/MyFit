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
    <div className="card p-3 sm:p-4">
      <div className="flex justify-between items-start gap-3 mb-3">
        <h2 className="text-base sm:text-lg font-semibold break-words flex-1 min-w-0">{video.title}</h2>
        <button
          type="button"
          onClick={onClose}
          className="shrink-0 py-2 px-3 -my-1 -mr-1 text-white/60 hover:text-white text-sm rounded-lg hover:bg-white/10 touch-manipulation min-h-[44px] sm:min-h-0 flex items-center"
          aria-label="Fechar vídeo"
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
        <p className="text-white/70 text-sm mt-3 break-words">{video.description}</p>
      )}
      <p className="text-white/50 text-xs mt-2">{video.professional_name}</p>
    </div>
  );
}
