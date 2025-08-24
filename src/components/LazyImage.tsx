import { useEffect, useRef, useState } from 'react';

interface LazyImageProps {
  src: string;
  alt: string;
  className?: string;
  fallback?: string;
  loading?: 'lazy' | 'eager';
  onLoad?: () => void;
  onError?: () => void;
}

/**
 * LazyImage component with intersection observer for performance
 * Supports fallback images and loading states
 */
export default function LazyImage({
  src,
  alt,
  className = '',
  fallback = '/images/placeholder.svg',
  loading = 'lazy',
  onLoad,
  onError,
}: LazyImageProps) {
  const [currentSrc, setCurrentSrc] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Set up intersection observer for lazy loading
  useEffect(() => {
    if (loading === 'eager') {
      setIsInView(true);
      return;
    }

    const currentImgRef = imgRef.current;
    if (!currentImgRef) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting) {
          setIsInView(true);
          observerRef.current?.disconnect();
        }
      },
      {
        rootMargin: '50px',
        threshold: 0.1,
      },
    );

    observerRef.current.observe(currentImgRef);

    return () => {
      observerRef.current?.disconnect();
    };
  }, [loading]);

  // Handle image loading when in view
  useEffect(() => {
    if (!isInView) return;

    setIsLoading(true);
    setHasError(false);

    const img = new Image();

    img.onload = () => {
      setCurrentSrc(src);
      setIsLoading(false);
      onLoad?.();
    };

    img.onerror = () => {
      setHasError(true);
      setCurrentSrc(fallback);
      setIsLoading(false);
      onError?.();
    };

    img.src = src;
  }, [src, fallback, isInView, onLoad, onError]);

  return (
    <div className={`relative ${className}`}>
      <img
        ref={imgRef}
        src={currentSrc || fallback}
        alt={alt}
        className={`${className} transition-opacity duration-300 ${
          isLoading ? 'opacity-50' : 'opacity-100'
        }`}
        loading={loading}
      />

      {isLoading && isInView && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-200/20 rounded">
          <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {hasError && (
        <div className="absolute top-1 right-1 w-3 h-3 bg-red-500 rounded-full opacity-50" />
      )}
    </div>
  );
}
