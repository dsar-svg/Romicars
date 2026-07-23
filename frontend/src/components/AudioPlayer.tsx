import { useRef, useState, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX } from 'lucide-react';

const speeds = [0.5, 1, 1.5, 2];

export default function AudioPlayer({ src, isAgent }: { src: string; isAgent: boolean }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [speed, setSpeed] = useState(1);
  const [muted, setMuted] = useState(false);

  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;
    const onTime = () => setProgress(el.currentTime / (el.duration || 1));
    const onMeta = () => setDuration(el.duration);
    const onEnd = () => { setPlaying(false); setProgress(0); };
    el.addEventListener('timeupdate', onTime);
    el.addEventListener('loadedmetadata', onMeta);
    el.addEventListener('ended', onEnd);
    return () => { el.removeEventListener('timeupdate', onTime); el.removeEventListener('loadedmetadata', onMeta); el.removeEventListener('ended', onEnd); };
  }, []);

  const toggle = () => {
    const el = audioRef.current;
    if (!el) return;
    if (playing) { el.pause(); setPlaying(false); }
    else { el.play().then(() => setPlaying(true)).catch(() => {}); }
  };

  const changeSpeed = () => {
    const el = audioRef.current;
    if (!el) return;
    const idx = speeds.indexOf(speed);
    const next = speeds[(idx + 1) % speeds.length];
    el.playbackRate = next;
    setSpeed(next);
  };

  const toggleMute = () => {
    const el = audioRef.current;
    if (!el) return;
    el.muted = !muted;
    setMuted(!muted);
  };

  const seek = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = audioRef.current;
    if (!el || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = (e.clientX - rect.left) / rect.width;
    el.currentTime = pct * duration;
  };

  const fmt = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 6, padding: '6px 8px',
      maxWidth: 300, borderRadius: 8,
      background: isAgent ? 'rgba(255,255,255,0.08)' : 'rgba(0,32,69,0.04)',
    }}>
      <audio ref={audioRef} src={src} preload="metadata" />

      {/* Play/Pause */}
      <div onClick={toggle} style={{
        width: 30, height: 30, borderRadius: '50%', flexShrink: 0, cursor: 'pointer',
        background: isAgent ? '#fff' : '#b51822',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {playing
          ? <Pause size={12} fill={isAgent ? '#002045' : '#fff'} color={isAgent ? '#002045' : '#fff'} />
          : <Play size={12} fill={isAgent ? '#002045' : '#fff'} color={isAgent ? '#002045' : '#fff'} style={{ marginLeft: 1 }} />
        }
      </div>

      {/* Timeline + time */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
        <div onClick={seek} style={{
          height: 4, borderRadius: 2, cursor: 'pointer',
          background: isAgent ? 'rgba(255,255,255,0.2)' : 'rgba(0,32,69,0.1)',
          position: 'relative', overflow: 'hidden',
        }}>
          <div style={{
            width: `${progress * 100}%`, height: '100%', borderRadius: 2,
            background: isAgent ? '#fff' : '#b51822',
            transition: 'width 0.15s linear',
          }} />
        </div>
        <span style={{
          fontSize: 10, color: isAgent ? 'rgba(255,255,255,0.5)' : '#8896ab',
          fontVariantNumeric: 'tabular-nums', textAlign: 'right',
        }}>
          {duration ? fmt(progress * duration) : fmt(0)} / {duration ? fmt(duration) : '...'}
        </span>
      </div>

      {/* Speed */}
      <div onClick={changeSpeed} style={{
        fontSize: 10, fontWeight: 700, cursor: 'pointer', flexShrink: 0,
        color: isAgent ? 'rgba(255,255,255,0.6)' : '#8896ab',
        padding: '2px 4px', borderRadius: 4,
        background: isAgent ? 'rgba(255,255,255,0.1)' : 'rgba(0,32,69,0.04)',
        minWidth: 28, textAlign: 'center',
      }}>
        {speed}x
      </div>

      {/* Mute */}
      <div onClick={toggleMute} style={{ cursor: 'pointer', flexShrink: 0, display: 'flex' }}>
        {muted
          ? <VolumeX size={14} color={isAgent ? 'rgba(255,255,255,0.5)' : '#8896ab'} />
          : <Volume2 size={14} color={isAgent ? 'rgba(255,255,255,0.5)' : '#8896ab'} />
        }
      </div>
    </div>
  );
}
