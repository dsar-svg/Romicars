import { useRef, useCallback } from 'react';
import type { Mensaje } from '../types';

let faviconCanvas: HTMLCanvasElement | null = null;
let hasUnread = false;
let globalUnreadCount = 0;
const originalFavicon = '/loguito.png';

function setFavicon(href: string) {
  const link = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
  if (link) link.href = href;
}

function setFaviconBadge(show: boolean) {
  if (!show) {
    setFavicon(originalFavicon);
    return;
  }
  if (!faviconCanvas) {
    faviconCanvas = document.createElement('canvas');
    faviconCanvas.width = 64;
    faviconCanvas.height = 64;
  }
  const ctx = faviconCanvas.getContext('2d')!;
  const img = new Image();
  img.crossOrigin = 'anonymous';
  img.src = originalFavicon;
  img.onload = () => {
    ctx.clearRect(0, 0, 64, 64);
    ctx.drawImage(img, 0, 0, 64, 64);
    ctx.beginPath();
    ctx.arc(52, 12, 10, 0, Math.PI * 2);
    ctx.fillStyle = '#DC2626';
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2.5;
    ctx.stroke();
    setFavicon(faviconCanvas!.toDataURL());
  };
  img.onerror = () => setFavicon(originalFavicon);
}

// Ensure favicon is set to logo on load
if (typeof document !== 'undefined') {
  setFavicon(originalFavicon);
}

export function playNotificationSound() {
  try {
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1200, audioCtx.currentTime + 0.1);
    osc.frequency.exponentialRampToValueAtTime(900, audioCtx.currentTime + 0.2);
    gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.25);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.25);
  } catch {}
}

export function playChatSound() {
  try {
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, audioCtx.currentTime);
    osc.frequency.setValueAtTime(680, audioCtx.currentTime + 0.08);
    gain.gain.setValueAtTime(0.12, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.15);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.15);
  } catch {}
}

function dispatchCountChange() {
  window.dispatchEvent(new CustomEvent('unread-changed', { detail: globalUnreadCount }));
}

export function useNotifications() {
  const unreadCount = useRef(0);

  const notify = useCallback((mensaje: Mensaje, isCurrentChat: boolean) => {
    const isClient = mensaje.remitente === 'cliente';
    if (!isClient) return;

    if (isCurrentChat && !document.hidden) {
      playChatSound();
      return;
    }

    unreadCount.current += 1;
    globalUnreadCount += 1;
    if (!hasUnread) {
      hasUnread = true;
      setFaviconBadge(true);
    }
    if (document.hidden) {
      playNotificationSound();
    }
    dispatchCountChange();
  }, []);

  const clearNotifications = useCallback(() => {
    unreadCount.current = 0;
    globalUnreadCount = 0;
    if (hasUnread) {
      hasUnread = false;
    }
    setFaviconBadge(false);
    dispatchCountChange();
  }, []);

  return { notify, clearNotifications, unreadCount };
}

export function getUnreadCount(): number {
  return globalUnreadCount;
}
