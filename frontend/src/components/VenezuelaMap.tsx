import { MapPin } from 'lucide-react';

interface ClienteUbicacion {
  co_cli: string;
  cli_des: string;
  lat: number;
  lng: number;
  ciudad: string;
  estado: string;
}

interface Props {
  clientes: ClienteUbicacion[];
}

const VENEZUELA_BOUNDS = {
  minLng: -73.4,
  maxLng: -59.8,
  minLat: 0.6,
  maxLat: 12.2,
};

function toSvgX(lng: number, width: number) {
  return ((lng - VENEZUELA_BOUNDS.minLng) / (VENEZUELA_BOUNDS.maxLng - VENEZUELA_BOUNDS.minLng)) * width;
}

function toSvgY(lat: number, height: number) {
  return (1 - (lat - VENEZUELA_BOUNDS.minLat) / (VENEZUELA_BOUNDS.maxLat - VENEZUELA_BOUNDS.minLat)) * height;
}

// Path simplificado del contorno de Venezuela
const VENEZUELA_PATH = `
  M 32,85 L 28,78 L 22,72 L 18,65 L 15,58 L 12,50 L 10,42 L 8,35 L 12,28
  L 18,22 L 25,18 L 32,15 L 40,12 L 48,10 L 55,8 L 62,7 L 70,8 L 78,10
  L 85,14 L 90,18 L 95,24 L 98,30 L 100,38 L 102,45 L 105,50 L 110,52
  L 118,50 L 125,48 L 132,45 L 138,42 L 145,38 L 152,35 L 158,32 L 165,30
  L 172,28 L 180,27 L 188,28 L 195,30 L 200,34 L 205,38 L 208,44 L 210,50
  L 212,58 L 215,65 L 220,70 L 228,72 L 235,70 L 242,68 L 248,65 L 255,60
  L 262,55 L 268,48 L 275,42 L 282,38 L 290,35 L 298,34 L 305,35 L 312,38
  L 318,42 L 322,48 L 325,55 L 328,62 L 330,70 L 332,78 L 330,85 L 325,90
  L 318,94 L 310,96 L 302,95 L 295,92 L 288,88 L 280,85 L 272,82 L 265,80
  L 258,78 L 250,78 L 242,80 L 235,82 L 228,85 L 220,88 L 212,90 L 205,92
  L 198,95 L 190,98 L 182,100 L 175,102 L 168,103 L 160,102 L 152,100
  L 145,97 L 138,93 L 130,90 L 122,88 L 115,87 L 108,88 L 100,90 L 92,92
  L 85,95 L 78,98 L 70,100 L 62,100 L 55,98 L 48,95 L 42,92 L 38,88 L 35,86
  Z
`;

// Estado labels posicionados
const ESTADOS_LABELS = [
  { label: 'Zulia', x: 60, y: 35 },
  { label: 'Falcón', x: 45, y: 50 },
  { label: 'Lara', x: 75, y: 55 },
  { label: 'Carabobo', x: 100, y: 65 },
  { label: 'Aragua', x: 115, y: 60 },
  { label: 'Miranda', x: 135, y: 55 },
  { label: 'Bolívar', x: 220, y: 65 },
  { label: 'Amazonas', x: 180, y: 90 },
  { label: 'Sucre', x: 270, y: 50 },
  { label: 'Monagas', x: 290, y: 42 },
  { label: 'Delta Amacuro', x: 310, y: 38 },
  { label: 'Anzoátegui', x: 250, y: 55 },
  { label: 'Barinas', x: 140, y: 80 },
  { label: 'Mérida', x: 100, y: 82 },
  { label: 'Táchira', x: 75, y: 80 },
  { label: 'Cojedes', x: 120, y: 70 },
  { label: 'Portuguesa', x: 100, y: 72 },
  { label: 'Guárico', x: 160, y: 70 },
  { label: 'Apure', x: 140, y: 92 },
];

export default function VenezuelaMap({ clientes }: Props) {
  if (clientes.length === 0) {
    return (
      <div style={{
        height: 300, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        color: 'var(--text-secondary)', borderRadius: 12,
        background: 'linear-gradient(135deg, #F8FAFC 0%, #E2E8F0 100%)',
      }}>
        <MapPin size={40} style={{ opacity: 0.2, marginBottom: 8 }} />
        <p style={{ fontSize: 14, fontWeight: 600 }}>Sin ubicaciones</p>
        <p style={{ fontSize: 12, marginTop: 2 }}>Clientes sin coordenadas registradas</p>
      </div>
    );
  }

  const width = 340;
  const height = 110;

  return (
    <div style={{
      position: 'relative', width: '100%', maxWidth: 500, margin: '0 auto',
      background: 'linear-gradient(135deg, #F0F4F8 0%, #D9E2EC 100%)',
      borderRadius: 12, overflow: 'hidden', padding: 8,
    }}>
      <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', height: 'auto', display: 'block' }}>
        {/* Fondo del mapa */}
        <rect x="0" y="0" width={width} height={height} fill="transparent" />

        {/* Contorno de Venezuela */}
        <path
          d={VENEZUELA_PATH}
          fill="#E8F4FD"
          stroke="#93C5FD"
          strokeWidth={1.5}
          strokeLinejoin="round"
          opacity={0.8}
        />

        {/* Nombres de estados (sutiles) */}
        {ESTADOS_LABELS.map((e) => (
          <text
            key={e.label}
            x={e.x}
            y={e.y}
            fontSize={5}
            fill="#94A3B8"
            textAnchor="middle"
            fontWeight={500}
            opacity={0.6}
          >
            {e.label}
          </text>
        ))}

        {/* Puntos de clientes */}
        {clientes.map((c) => {
          const cx = toSvgX(c.lng, width);
          const cy = toSvgY(c.lat, height);
          return (
            <g key={c.co_cli}>
              <circle cx={cx} cy={cy} r={6} fill="#BD060A" opacity={0.12} />
              <circle cx={cx} cy={cy} r={3.5} fill="#BD060A" stroke="#FFF" strokeWidth={1.5}>
                <title>{`${c.cli_des} — ${c.ciudad}, ${c.estado}`}</title>
              </circle>
            </g>
          );
        })}
      </svg>

      {/* Contador */}
      <div style={{
        position: 'absolute', bottom: 10, right: 12,
        fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)',
        background: 'rgba(255,255,255,0.9)',
        padding: '4px 10px', borderRadius: 6,
        boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
      }}>
        {clientes.length} cliente{clientes.length !== 1 ? 's' : ''}
      </div>
    </div>
  );
}
