"use client";

import { useState } from 'react';

interface ImageWithFallbackProps {
  src: string;
  alt: string;
  className?: string;
  onClick?: () => void;
  fallbackText?: string;
}

export default function ImageWithFallback({ 
  src, 
  alt, 
  className = "h-full w-full object-cover", 
  onClick,
  fallbackText = "Imagem não disponível"
}: ImageWithFallbackProps) {
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);

  const handleImageError = () => {
    console.error(`[IMAGE-ERROR] Failed to load image: ${src}`);
    setImageError(true);
    setImageLoading(false);
  };

  const handleImageLoad = () => {
    console.log(`[IMAGE-SUCCESS] Successfully loaded image: ${src.substring(0, 100)}...`);
    setImageLoading(false);
  };

  // If there's no src, show fallback immediately
  if (!src || src.trim() === '') {
    return (
      <div className={`${className} flex items-center justify-center bg-gray-100 text-gray-500 text-sm`}>
        <div className="text-center">
          <svg 
            className="mx-auto h-12 w-12 text-gray-400 mb-2" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" 
            />
          </svg>
          <p>{fallbackText}</p>
        </div>
      </div>
    );
  }

  // If image failed to load, show error state
  if (imageError) {
    return (
      <div className={`${className} flex items-center justify-center bg-red-50 text-red-500 text-sm`}>
        <div className="text-center">
          <svg 
            className="mx-auto h-12 w-12 text-red-400 mb-2" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" 
            />
          </svg>
          <p>Erro ao carregar</p>
          <button 
            className="mt-2 text-xs underline hover:no-underline"
            onClick={() => {
              setImageError(false);
              setImageLoading(true);
            }}
          >
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${onClick ? 'cursor-pointer' : ''}`} onClick={onClick}>
      {imageLoading && (
        <div className={`${className} flex items-center justify-center bg-gray-100 text-gray-500 text-sm absolute inset-0 z-10`}>
          <div className="text-center">
            <svg 
              className="animate-spin mx-auto h-8 w-8 text-gray-400 mb-2" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" 
              />
            </svg>
            <p>Carregando...</p>
          </div>
        </div>
      )}
      <img 
        src={src}
        alt={alt}
        className={className}
        onError={handleImageError}
        onLoad={handleImageLoad}
        style={{ 
          display: imageLoading ? 'none' : 'block' 
        }}
      />
    </div>
  );
} 