import { useState, useEffect } from 'react';
import type { VideoHTMLAttributes } from 'react';
import { apiClient } from '../../api/apiClient';
import { isInternalApiUrl, toApiRequestUrl } from '../../utils/url';

interface SecureVideoProps extends Omit<VideoHTMLAttributes<HTMLVideoElement>, 'src'> {
  src?: string | null;
}

export const SecureVideo = ({
  src,
  className,
  style,
  controls = true,
  ...props
}: SecureVideoProps) => {
  const [videoSrc, setVideoSrc] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(!!src);

  useEffect(() => {
    let objectUrl: string | null = null;
    let isMounted = true;

    const fetchVideo = async () => {
      if (!src) {
        if (isMounted) {
          setVideoSrc('');
          setIsLoading(false);
        }
        return;
      }

      if (!isInternalApiUrl(src)) {
        if (isMounted) {
          setVideoSrc('');
          setIsLoading(false);
        }
        return;
      }

      setIsLoading(true);
      try {
        const response = await apiClient.get(toApiRequestUrl(src), {
          responseType: 'blob',
        });

        objectUrl = URL.createObjectURL(response.data);

        if (isMounted) {
          setVideoSrc(objectUrl);
        }
      } catch (error) {
        console.error('Помилка завантаження відео:', error);
        if (isMounted) setVideoSrc('');
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchVideo();

    return () => {
      isMounted = false;
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [src]);

  if (!videoSrc) {
    return (
      <div
        className={className}
        style={{
          minHeight: 120,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#64748b',
          ...style,
        }}
      >
        {isLoading ? 'Завантаження відео…' : 'Відео недоступне'}
      </div>
    );
  }

  return (
    <video
      src={videoSrc}
      controls={controls}
      className={className}
      style={{
        opacity: isLoading ? 0.7 : 1,
        transition: 'opacity 0.3s ease',
        ...style,
      }}
      {...props}
    />
  );
};
