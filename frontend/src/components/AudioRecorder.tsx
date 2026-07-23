import { useRef, useState } from 'react';
import { Mic, Square, Trash2 } from 'lucide-react';
import { mensajesApi } from '../services/api';
import { toast } from './Toast';

interface AudioRecorderProps {
  clienteId: number;
  onStart?: () => void;
  onEnd?: () => void;
}

export default function AudioRecorder({ clienteId, onStart, onEnd }: AudioRecorderProps) {
  const [state, setState] = useState<'idle' | 'recording' | 'uploading'>('idle');
  const [timer, setTimer] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const cancelledRef = useRef(false);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm;codecs=opus' });
      chunksRef.current = [];
      cancelledRef.current = false;
      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      recorder.onstop = async () => {
        stream.getTracks().forEach(t => t.stop());
        if (timerRef.current) clearInterval(timerRef.current);
        timerRef.current = null;
        setTimer(0);
        if (cancelledRef.current) { chunksRef.current = []; setState('idle'); return; }
        if (chunksRef.current.length === 0) { setState('idle'); return; }
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        if (blob.size < 100) { setState('idle'); return; }
        setState('uploading');
        onStart?.();
        try {
          const file = new File([blob], `nota-voz-${Date.now()}.webm`, { type: 'audio/webm' });
          const { url } = await mensajesApi.upload(file);
          await mensajesApi.enviar({
            cliente_id: clienteId, remitente: 'agente',
            contenido: '🎤 Nota de voz', tipo: 'audio', url_multimedia: url,
          });
        } catch {
          toast('error', 'Error al enviar nota de voz');
        }
        setState('idle');
        onEnd?.();
      };
      recorder.start(250);
      setState('recording');
      const startTime = Date.now();
      timerRef.current = setInterval(() => setTimer(Math.floor((Date.now() - startTime) / 1000)), 200);
      mediaRecorderRef.current = recorder;
    } catch {
      toast('error', 'No se pudo acceder al micrófono');
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
  };

  const cancelRecording = () => {
    cancelledRef.current = true;
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
    setTimer(0);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stream.getTracks().forEach(t => t.stop());
    }
    mediaRecorderRef.current = null;
    chunksRef.current = [];
    setState('idle');
  };

  const fmt = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  if (state === 'recording') {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8, padding: '4px 8px',
        background: '#fde8e8', borderRadius: 20,
      }}>
        <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#e74c3c', animation: 'pulse 1s infinite' }} />
        <span style={{ fontSize: 13, fontWeight: 600, color: '#e74c3c', fontVariantNumeric: 'tabular-nums', minWidth: 30 }}>
          {fmt(timer)}
        </span>
        <div onClick={stopRecording} style={{
          width: 28, height: 28, borderRadius: '50%', cursor: 'pointer',
          background: '#e74c3c', display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Square size={10} fill="#fff" color="#fff" />
        </div>
        <div onClick={cancelRecording} style={{ cursor: 'pointer', display: 'flex' }}>
          <Trash2 size={14} color="#8896ab" />
        </div>
      </div>
    );
  }

  return (
    <div onClick={startRecording} style={{
      width: 36, height: 36, borderRadius: '50%',
      border: '1px solid #e0e8f0', background: state === 'uploading' ? '#f0f2f5' : '#fff',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      cursor: state === 'uploading' ? 'not-allowed' : 'pointer', flexShrink: 0,
      opacity: state === 'uploading' ? 0.5 : 1,
    }} title="Nota de voz">
      <Mic size={14} style={{ color: '#b51822' }} />
    </div>
  );
}
