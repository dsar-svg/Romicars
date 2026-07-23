import { useEffect, useRef, useState, useCallback } from 'react';
import { X, ChevronLeft, ChevronRight, Download, ZoomIn, ZoomOut, RotateCw } from 'lucide-react';

interface GalleryViewProps {
  images: { url: string; nombre?: string }[];
  initialIndex?: number;
  onClose: () => void;
}

export default function GalleryView({ images, initialIndex = 0, onClose }: GalleryViewProps) {
  const [idx, setIdx] = useState(initialIndex);
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isVideo, setIsVideo] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  const current = images[idx];
  const total = images.length;

  useEffect(() => {
    if (current) {
      setIsVideo(/\.(mp4|webm|mov)$/i.test(current.url.split('?')[0]));
    }
  }, [current]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') prev();
      if (e.key === 'ArrowRight') next();
    };
    document.addEventListener('keydown', handler);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handler);
      document.body.style.overflow = '';
    };
  }, [idx, total]);

  const reset = () => { setScale(1); setRotation(0); setPosition({ x: 0, y: 0 }); };

  const prev = useCallback(() => {
    if (idx > 0) { setIdx(idx - 1); reset(); }
  }, [idx]);

  const next = useCallback(() => {
    if (idx < total - 1) { setIdx(idx + 1); reset(); }
  }, [idx, total]);

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    setScale(s => Math.max(0.25, Math.min(10, s - e.deltaY * 0.002)));
  };

  const handleDoubleClick = () => {
    if (scale === 1) setScale(2.5);
    else reset();
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (scale === 1) return;
    setDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!dragging || scale === 1) return;
    setPosition({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
  };

  const handleMouseUp = () => setDragging(false);

  const download = async () => {
    try {
      const resp = await fetch(current.url, { cache: 'no-store' });
      const blob = await resp.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = current.nombre || 'descarga';
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      window.open(current.url, '_blank');
    }
  };

  if (!current) return null;

  return (
    <div ref={overlayRef}
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(0,0,0,0.92)',
        display: 'flex', flexDirection: 'column',
        userSelect: dragging ? 'none' : 'auto',
        cursor: scale > 1 ? (dragging ? 'grabbing' : 'grab') : 'default',
      }}
    >
      {/* Top bar */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '12px 16px',
        background: 'linear-gradient(180deg, rgba(0,0,0,0.5) 0%, transparent 100%)',
      }}>
        <span style={{ color: '#fff', fontSize: 13 }}>
          {current.nombre || ''}
          {total > 1 && <span style={{ opacity: 0.5, marginLeft: 8 }}>{idx + 1} / {total}</span>}
        </span>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <ZoomIn size={18} color="#fff" style={{ cursor: 'pointer', opacity: 0.7 }}
            onClick={() => setScale(s => Math.min(10, s + 0.5))} />
          <ZoomOut size={18} color="#fff" style={{ cursor: 'pointer', opacity: 0.7 }}
            onClick={() => setScale(s => Math.max(0.25, s - 0.5))} />
          <RotateCw size={18} color="#fff" style={{ cursor: 'pointer', opacity: 0.7 }}
            onClick={() => setRotation(r => r + 90)} />
          <Download size={18} color="#fff" style={{ cursor: 'pointer', opacity: 0.7 }} onClick={download} />
          <X size={22} color="#fff" style={{ cursor: 'pointer' }} onClick={onClose} />
        </div>
      </div>

      {/* Navigation arrows */}
      {total > 1 && idx > 0 && (
        <div onClick={prev} style={{
          position: 'absolute', left: 16, top: '50%', zIndex: 10, transform: 'translateY(-50%)',
          width: 40, height: 40, borderRadius: '50%',
          background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer',
        }}>
          <ChevronLeft size={22} color="#fff" />
        </div>
      )}
      {total > 1 && idx < total - 1 && (
        <div onClick={next} style={{
          position: 'absolute', right: 16, top: '50%', zIndex: 10, transform: 'translateY(-50%)',
          width: 40, height: 40, borderRadius: '50%',
          background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer',
        }}>
          <ChevronRight size={22} color="#fff" />
        </div>
      )}

      {/* Content */}
      <div style={{
        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '60px 80px', overflow: 'hidden',
      }}>
        {isVideo ? (
          <video controls autoPlay src={current.url}
            style={{ maxWidth: '100%', maxHeight: '100%', borderRadius: 8 }} />
        ) : (
          <img ref={imgRef} src={current.url} alt=""
            draggable={false}
            onDoubleClick={handleDoubleClick}
            onDragStart={e => e.preventDefault()}
            style={{
              transform: `scale(${scale}) rotate(${rotation}deg) translate(${position.x / scale}px, ${position.y / scale}px)`,
              transition: dragging ? 'none' : 'transform 0.2s',
              maxWidth: '100%', maxHeight: '100%',
              objectFit: 'contain', borderRadius: 4,
            }} />
        )}
      </div>
    </div>
  );
}
