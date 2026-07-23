import { useState, useRef, useEffect } from 'react';
import { Smile } from 'lucide-react';

const categories = [
  {
    name: 'Frecuentes',
    emojis: ['😀','😂','❤️','🔥','👍','🎉','🙏','💪','😍','✨','💯','🤣','🥺','😎','💀','😭'],
  },
  {
    name: 'Caras',
    emojis: ['😀','😃','😄','😁','😆','😅','🤣','😂','🙂','😉','😊','😇','🥰','😍','🤩','😘','😗','😚','😋','😛','😜','🤪','😝','🤑','🤗','🤭','🤫','🤔','🤐','🤨','😐','😑','😶','😏','😒','🙄','😬','😮','😯','😲','😳','🥺','😢','😭','😤','😡','🤬','💀','☠️'],
  },
  {
    name: 'Gestos',
    emojis: ['👋','🤚','🖐','✋','🖖','👌','🤌','🤏','✌️','🤞','🤟','🤘','🤙','👈','👉','👆','🖕','👇','☝️','👍','👎','✊','👊','🤛','🤜','👏','🙌','👐','🤲','🤝','🙏','✍️','💅','🤳','💪','🦵','🦶','👂','🦻','👃','🧠','🫀','🫁','🦷','🦴','👀','👁','👅','👄'],
  },
  {
    name: 'Corazones',
    emojis: ['❤️','🧡','💛','💚','💙','💜','🖤','🤍','🤎','💕','💞','💓','💗','💖','💘','💝','💟','❣️','♥️'],
  },
  {
    name: 'Objetos',
    emojis: ['📱','💻','⌚️','📷','🎥','📸','🔊','🔔','📢','💡','🔑','🔒','🔓','📎','📌','✂️','🗑','🖨','📃','📄','📑','📊','📈','📉','🗓','📅','📁','📂','🗂'],
  },
  {
    name: 'Símbolos',
    emojis: ['✅','❌','❓','❗️','‼️','⁉️','➕','➖','➗','✖️','💲','🔴','🟠','🟡','🟢','🔵','🟣','🟤','⚫️','⚪️','🔺','🔻','🔸','🔹','🔶','🔷','🔳','🔲','▪️','▫️'],
  },
];

interface EmojiPickerProps {
  onSelect: (emoji: string) => void;
}

export default function EmojiPicker({ onSelect }: EmojiPickerProps) {
  const [open, setOpen] = useState(false);
  const [cat, setCat] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    if (open) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const pick = (emoji: string) => {
    onSelect(emoji);
    setOpen(false);
  };

  return (
    <div ref={ref} style={{ position: 'relative', flexShrink: 0 }}>
      <button onClick={() => setOpen(!open)} style={{
        width: 36, height: 36, borderRadius: '50%',
        border: open ? '2px solid #b51822' : '1px solid #e0e8f0',
        background: open ? 'rgba(181,24,34,0.08)' : '#fff',
        display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
        flexShrink: 0,
      }}>
        <Smile size={14} style={{ color: '#8896ab' }} />
      </button>
      {open && (
        <div style={{
          position: 'absolute', bottom: 44, right: 0, zIndex: 100,
          width: 280, maxHeight: 300,
          background: '#fff', borderRadius: 12,
          boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
          border: '1px solid #e0e8f0',
          display: 'flex', flexDirection: 'column', overflow: 'hidden',
        }}>
          {/* Categories */}
          <div style={{
            display: 'flex', gap: 2, padding: '6px 8px',
            borderBottom: '1px solid #f0f2f5', overflowX: 'auto', flexShrink: 0,
          }}>
            {categories.map((c, i) => (
              <button key={c.name} onClick={() => setCat(i)} style={{
                padding: '4px 8px', fontSize: 11, fontWeight: 600, borderRadius: 6,
                background: cat === i ? '#f0f2f5' : 'transparent',
                color: cat === i ? '#002045' : '#8896ab',
                border: 'none', cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0,
              }}>
                {c.name}
              </button>
            ))}
          </div>
          {/* Emoji grid */}
          <div style={{
            display: 'flex', flexWrap: 'wrap', gap: 2, padding: 8,
            overflowY: 'auto', alignContent: 'flex-start',
          }}>
            {categories[cat].emojis.map((emoji, i) => (
              <button key={`${emoji}-${i}`} onClick={() => pick(emoji)} style={{
                width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 20, border: 'none', background: 'transparent', cursor: 'pointer',
                borderRadius: 6, transition: 'background 0.1s',
              }}
                onMouseEnter={e => e.currentTarget.style.background = '#f0f2f5'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
