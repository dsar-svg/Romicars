import { FileText, FileSpreadsheet, Image as ImageIcon, Music, Video, File as FileIcon, Download } from 'lucide-react';
import { useState } from 'react';

const extMap: Record<string, { icon: any; color: string; bg: string; label: string }> = {
  pdf: { icon: FileText, color: '#e74c3c', bg: '#fce8e6', label: 'PDF' },
  doc: { icon: FileText, color: '#2b5797', bg: '#e8eff8', label: 'DOC' },
  docx: { icon: FileText, color: '#2b5797', bg: '#e8eff8', label: 'DOCX' },
  xls: { icon: FileSpreadsheet, color: '#217346', bg: '#e6f4ea', label: 'XLS' },
  xlsx: { icon: FileSpreadsheet, color: '#217346', bg: '#e6f4ea', label: 'XLSX' },
  csv: { icon: FileSpreadsheet, color: '#217346', bg: '#e6f4ea', label: 'CSV' },
  jpg: { icon: ImageIcon, color: '#e67e22', bg: '#fef5e7', label: 'JPG' },
  jpeg: { icon: ImageIcon, color: '#e67e22', bg: '#fef5e7', label: 'JPEG' },
  png: { icon: ImageIcon, color: '#e67e22', bg: '#fef5e7', label: 'PNG' },
  gif: { icon: ImageIcon, color: '#e67e22', bg: '#fef5e7', label: 'GIF' },
  webp: { icon: ImageIcon, color: '#e67e22', bg: '#fef5e7', label: 'WEBP' },
  mp3: { icon: Music, color: '#8e44ad', bg: '#f4ecf7', label: 'MP3' },
  wav: { icon: Music, color: '#8e44ad', bg: '#f4ecf7', label: 'WAV' },
  ogg: { icon: Music, color: '#8e44ad', bg: '#f4ecf7', label: 'OGG' },
  mp4: { icon: Video, color: '#2980b9', bg: '#e8f0fe', label: 'MP4' },
  mov: { icon: Video, color: '#2980b9', bg: '#e8f0fe', label: 'MOV' },
  webm: { icon: Video, color: '#2980b9', bg: '#e8f0fe', label: 'WEBM' },
  zip: { icon: FileIcon, color: '#6c5ce7', bg: '#eeeaff', label: 'ZIP' },
  rar: { icon: FileIcon, color: '#6c5ce7', bg: '#eeeaff', label: 'RAR' },
  '7z': { icon: FileIcon, color: '#6c5ce7', bg: '#eeeaff', label: '7Z' },
  tar: { icon: FileIcon, color: '#6c5ce7', bg: '#eeeaff', label: 'TAR' },
  txt: { icon: FileText, color: '#636e72', bg: '#f0f2f5', label: 'TXT' },
};

function getExtInfo(url: string) {
  const cleanUrl = url.split('?')[0];
  const ext = (cleanUrl.split('.').pop() || '').toLowerCase();
  return extMap[ext] || { icon: FileIcon, color: '#8896ab', bg: '#f0f2f5', label: ext.toUpperCase() || 'FILE' };
}

function getFileName(url: string) {
  const cleanUrl = url.split('?')[0];
  return decodeURIComponent(cleanUrl.split('/').pop() || 'Archivo');
}

export default function FileCard({ url, isAgent }: { url: string; isAgent: boolean }) {
  const [downloading, setDownloading] = useState(false);
  const info = getExtInfo(url);
  const Icon = info.icon;
  const fileName = getFileName(url);

  const handleDownload = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDownloading(true);
    try {
      const resp = await fetch(url, { cache: 'no-store' });
      const blob = await resp.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = fileName;
      a.click();
      URL.revokeObjectURL(blobUrl);
    } catch {
      window.open(url, '_blank');
    }
    setDownloading(false);
  };

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', marginBottom: 4,
      borderRadius: 8, textDecoration: 'none',
      background: isAgent ? 'rgba(255,255,255,0.1)' : 'rgba(0,32,69,0.04)',
      border: `1px solid ${isAgent ? 'rgba(255,255,255,0.15)' : 'rgba(0,32,69,0.1)'}`,
    }}>
      <div style={{
        width: 38, height: 38, borderRadius: 8, flexShrink: 0,
        background: isAgent ? info.color : info.bg,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Icon size={18} color={isAgent ? '#fff' : info.color} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: 13, fontWeight: 600,
          color: isAgent ? '#fff' : '#002045',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {fileName}
        </div>
        <div style={{ fontSize: 11, color: isAgent ? 'rgba(255,255,255,0.6)' : '#8896ab', marginTop: 2 }}>
          {info.label}
        </div>
      </div>
      <div onClick={handleDownload} style={{
        width: 32, height: 32, borderRadius: 8, flexShrink: 0, cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: isAgent ? 'rgba(255,255,255,0.1)' : 'rgba(0,32,69,0.04)',
        opacity: downloading ? 0.5 : 1,
      }}>
        <Download size={15} color={isAgent ? '#fff' : info.color} />
      </div>
    </div>
  );
}
