interface Props {
  nombre: string;
}

export default function TypingIndicator({ nombre }: Props) {
  return (
    <>
      <style>{`
        @keyframes bounce {
          0%, 60%, 100% { transform: translateY(0); }
          30% { transform: translateY(-4px); }
        }
        .typing-dot {
          display: inline-block;
          width: 4px;
          height: 4px;
          border-radius: 50%;
          background: #9ca3af;
          margin: 0 1px;
          animation: bounce 0.6s infinite;
        }
        .typing-dot:nth-child(2) { animation-delay: 0.15s; }
        .typing-dot:nth-child(3) { animation-delay: 0.3s; }
      `}</style>
      <div style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '4px 12px',
        background: '#f3f4f6',
        borderRadius: 12,
        fontSize: 12,
        color: '#6b7280',
        height: 24,
        lineHeight: 1,
      }}>
        <span>{nombre} está escribiendo</span>
        <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: 1 }}>
          <span className="typing-dot" />
          <span className="typing-dot" />
          <span className="typing-dot" />
        </span>
      </div>
    </>
  );
}
