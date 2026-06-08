import { useEffect } from "react";
import { X } from "lucide-react";

/**
 * 풀스크린 이미지 라이트박스
 * - ESC / 배경 클릭으로 닫힘
 * - 이미지 자체 클릭은 전파 차단
 */
export function Lightbox({
  src, alt, caption, onClose,
}: {
  src: string;
  alt: string;
  caption?: string;
  onClose: () => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={alt}
      onClick={onClose}
      className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex flex-col items-center justify-center p-4 md:p-10 cursor-zoom-out"
    >
      <button
        onClick={(e) => { e.stopPropagation(); onClose(); }}
        aria-label="닫기"
        className="absolute top-4 right-4 md:top-6 md:right-6 h-11 w-11 bg-vuno-bg/80 border border-vuno-border text-white hover:bg-vuno-cyan hover:text-vuno-bg transition-colors grid place-items-center"
      >
        <X className="h-5 w-5" />
      </button>

      <img
        src={src}
        alt={alt}
        onClick={(e) => e.stopPropagation()}
        className="max-w-full max-h-[85vh] object-contain shadow-2xl cursor-default"
      />

      {caption && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="mt-4 max-w-3xl text-center text-base md:text-lg text-white/90 leading-relaxed break-keep px-4"
        >
          {caption}
        </div>
      )}

      <div className="absolute bottom-4 text-xs md:text-sm text-white/50 tracking-wider">
        클릭 · ESC 닫기
      </div>
    </div>
  );
}
