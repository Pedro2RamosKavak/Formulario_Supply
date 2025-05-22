'use client';

import React, { useState } from 'react';

interface VideoPlayerProps {
  src: string | null;
  poster?: string;
}

export default function VideoPlayer({ src, poster = '/video-poster.png' }: VideoPlayerProps) {
  const [isError, setIsError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  if (!src) {
    return (
      <div className="relative aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
        <p className="text-gray-500">No hay video disponible</p>
      </div>
    );
  }

  return (
    <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
        </div>
      )}
      
      {isError ? (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <div className="text-center p-4">
            <p className="text-red-500 mb-2">Error al cargar el video</p>
            <a 
              href={src} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-500 hover:underline"
            >
              Abrir video en nueva pestaña
            </a>
          </div>
        </div>
      ) : (
        <video
          src={src}
          poster={poster}
          controls
          className="w-full h-full"
          onLoadStart={() => setIsLoading(true)}
          onLoadedData={() => setIsLoading(false)}
          onError={() => {
            setIsError(true);
            setIsLoading(false);
          }}
        />
      )}
    </div>
  );
} 