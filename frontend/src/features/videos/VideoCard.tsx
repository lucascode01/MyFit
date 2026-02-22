'use client';

import Image from 'next/image';
import type { Video } from '@/types';
import { getMediaUrl } from '@/lib/api';

interface VideoCardProps {
  video: Video;
  onClick: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

export function VideoCard({ video, onClick, onEdit, onDelete }: VideoCardProps) {
  const thumbUrl = video.thumbnail ? getMediaUrl(video.thumbnail) : null;
  const showActions = Boolean(onEdit || onDelete);

  return (
    <div className="card text-left w-full rounded-xl relative group">
      <button
        type="button"
        onClick={onClick}
        className="w-full text-left hover:border-brand-orange/50 active:border-brand-orange/50 transition-colors touch-manipulation rounded-t-xl overflow-hidden"
      >
        <div className="aspect-video bg-white/5 relative">
          {thumbUrl ? (
            <Image
              src={thumbUrl}
              alt=""
              fill
              className="object-cover"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-white/30 text-4xl">▶</div>
          )}
        </div>
        <div className="p-3 sm:p-4">
          <h3 className="font-medium truncate text-sm sm:text-base">{video.title}</h3>
          <p className="text-white/60 text-xs sm:text-sm truncate mt-0.5">{video.professional_name}</p>
          {video.category && (
            <span className="text-xs text-brand-orange mt-1 inline-block">{video.category.name}</span>
          )}
        </div>
      </button>
      {showActions && (
        <>
          <div className="absolute top-2 right-2 flex gap-1.5 z-10" onClick={(e) => e.stopPropagation()}>
            {onEdit && (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onEdit(); }}
                className="min-h-[36px] min-w-[36px] rounded-lg bg-black/70 hover:bg-black/90 text-white p-2 shadow-lg"
                title="Editar"
                aria-label="Editar vídeo"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
              </button>
            )}
            {onDelete && (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onDelete(); }}
                className="min-h-[36px] rounded-lg bg-red-700/90 hover:bg-red-600 text-white px-2.5 py-2 flex items-center gap-1.5 text-sm font-medium shadow-lg"
                title="Excluir vídeo"
                aria-label="Excluir vídeo"
              >
                <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                <span className="hidden sm:inline">Excluir</span>
              </button>
            )}
          </div>
          <div className="flex gap-3 px-3 pb-3 pt-0 sm:px-4 sm:pb-4 sm:pt-0 border-t border-white/10 mt-0" onClick={(e) => e.stopPropagation()}>
            {onEdit && (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onEdit(); }}
                className="text-sm font-medium text-white/80 hover:text-white"
              >
                Editar
              </button>
            )}
            {onDelete && (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onDelete(); }}
                className="text-sm font-medium text-red-400 hover:text-red-300"
              >
                Excluir
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
