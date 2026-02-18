'use client';

import Image from 'next/image';
import type { Video } from '@/types';
import { getMediaUrl } from '@/lib/api';

interface VideoCardProps {
  video: Video;
  onClick: () => void;
}

export function VideoCard({ video, onClick }: VideoCardProps) {
  const thumbUrl = video.thumbnail ? getMediaUrl(video.thumbnail) : null;

  return (
    <button
      type="button"
      onClick={onClick}
      className="card text-left w-full overflow-hidden hover:border-brand-orange/50 transition-colors"
    >
      <div className="aspect-video bg-white/5 relative">
        {thumbUrl ? (
          <Image
            src={thumbUrl}
            alt=""
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 33vw"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-white/30 text-4xl">▶</div>
        )}
      </div>
      <div className="p-3">
        <h3 className="font-medium truncate">{video.title}</h3>
        <p className="text-white/60 text-sm truncate">{video.professional_name}</p>
        {video.category && (
          <span className="text-xs text-brand-orange mt-1 inline-block">{video.category.name}</span>
        )}
      </div>
    </button>
  );
}
