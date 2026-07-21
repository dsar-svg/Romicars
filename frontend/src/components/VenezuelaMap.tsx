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

export default function VenezuelaMap({ clientes }: Props) {
  if (clientes.length === 0) {
    return (
      <div style={{
        height: 300, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        color: 'var(--gris-texto)', borderRadius: 12,
        background: 'linear-gradient(135deg, #F8FAFC 0%, #E2E8F0 100%)',
      }}>
        <MapPin size={40} style={{ opacity: 0.2, marginBottom: 8 }} />
        <p style={{ fontSize: 14, fontWeight: 600 }}>Sin ubicaciones</p>
        <p style={{ fontSize: 12, marginTop: 2 }}>Clientes sin coordenadas registradas</p>
      </div>
    );
  }

  const width = 400;
  const height = 340;

  return (
    <div style={{
      position: 'relative', width: '100%', maxWidth: 500, margin: '0 auto',
      background: 'linear-gradient(135deg, #F0F4F8 0%, #D9E2EC 100%)',
      borderRadius: 12, overflow: 'hidden',
    }}>
      <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', height: 'auto', display: 'block' }}>
        <path
          d="M 50,20 L 90,10 L 140,15 L 200,8 L 280,12 L 340,25 L 370,50 L 380,90 L 385,140 L 380,180 L 370,210 L 350,240 L 320,270 L 280,300 L 240,320 L 200,330 L 160,325 L 120,310 L 80,290 L 50,260 L 30,220 L 15,180 L 10,130 L 15,80 L 25,45 Z"
          fill="#E8F0FE" stroke="#93C5FD" strokeWidth={2} opacity={0.6}
        />
        {clientes.map((c) => {
          const cx = toSvgX(c.lng, width);
          const cy = toSvgY(c.lat, height);
          return (
            <g key={c.co_cli}>
              <circle cx={cx} cy={cy} r={8} fill="#BD060A" opacity={0.15} />
              <circle cx={cx} cy={cy} r={5} fill="#BD060A" stroke="#FFF" strokeWidth={2}>
                <title>{`${c.cli_des} (${c.ciudad}, ${c.estado})`}</title>
              </circle>
            </g>
          );
        })}
      </svg>
      {clientes.length > 0 && (
        <div style={{
          position: 'absolute', bottom: 8, right: 10,
          fontSize: 11, color: 'var(--gris-texto)',
          background: 'rgba(255,255,255,0.85)',
          padding: '4px 10px', borderRadius: 6,
        }}>
          {clientes.length} cliente{clientes.length !== 1 ? 's' : ''}
        </div>
      )}
    </div>
  );
}
