/**
 * LazyImage - 带骨架屏和加载状态的图片组件
 * 
 * 特性：
 * - 骨架屏加载动画
 * - 错误状态处理
 * - 原生懒加载支持
 * - 加载完成淡入动画
 */

import React, { useState, useEffect, useRef } from "react";

interface LazyImageProps {
  src: string;
  alt?: string;
  className?: string;
  containerClassName?: string;
  objectFit?: "cover" | "contain" | "fill" | "none";
  fallbackSrc?: string;
  onLoad?: () => void;
  onError?: () => void;
}

export const LazyImage: React.FC<LazyImageProps> = ({
  src,
  alt = "",
  className = "",
  containerClassName = "",
  objectFit = "cover",
  fallbackSrc,
  onLoad,
  onError,
}) => {
  const [status, setStatus] = useState<"loading" | "loaded" | "error">("loading");
  const imgRef = useRef<HTMLImageElement>(null);

  // 当 src 变化时重置状态
  useEffect(() => {
    setStatus("loading");
  }, [src]);

  const handleLoad = () => {
    setStatus("loaded");
    onLoad?.();
  };

  const handleError = () => {
    if (fallbackSrc && imgRef.current) {
      imgRef.current.src = fallbackSrc;
    } else {
      setStatus("error");
      onError?.();
    }
  };

  const objectFitClass = {
    cover: "object-cover",
    contain: "object-contain",
    fill: "object-fill",
    none: "object-none",
  }[objectFit];

  return (
    <div className={`relative overflow-hidden ${containerClassName}`}>
      {/* 骨架屏 */}
      {status === "loading" && (
        <div className="absolute inset-0 bg-muted">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-card/50 to-transparent animate-shimmer" />
        </div>
      )}

      {/* 图片 */}
      <img
        ref={imgRef}
        src={src}
        alt={alt}
        loading="lazy"
        onLoad={handleLoad}
        onError={handleError}
        className={`w-full h-full ${objectFitClass} transition-opacity duration-300 ${
          status === "loaded" ? "opacity-100" : "opacity-0"
        } ${className}`}
      />

      {/* 错误状态 */}
      {status === "error" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-muted gap-2">
          <svg
            className="w-8 h-8 text-muted-foreground/50"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          <span className="text-xs text-muted-foreground">加载失败</span>
        </div>
      )}
    </div>
  );
};

/**
 * 图片预加载工具函数（带并发限制）
 * 
 * @param urls 需要预加载的图片 URL 列表
 * @param concurrency 最大并发数，默认 3
 * @returns Promise，所有图片加载完成后 resolve
 */
export async function preloadImages(urls: string[], concurrency = 3): Promise<void> {
  const validUrls = urls.filter(Boolean);
  if (validUrls.length === 0) return;
  
  // 分批预加载
  for (let i = 0; i < validUrls.length; i += concurrency) {
    const batch = validUrls.slice(i, i + concurrency);
    await Promise.all(
      batch.map(
        (url) =>
          new Promise<void>((resolve) => {
            const img = new Image();
            img.onload = () => resolve();
            img.onerror = () => resolve(); // 即使失败也 resolve
            img.src = url;
          })
      )
    );
  }
}

// 已预加载的图片 URL 缓存
const preloadedUrls = new Set<string>();

/**
 * 预加载单张图片（静默，不阻塞，带去重）
 */
export function preloadImage(url: string): void {
  if (!url || preloadedUrls.has(url)) return;
  
  preloadedUrls.add(url);
  const img = new Image();
  img.src = url;
}

export default LazyImage;

