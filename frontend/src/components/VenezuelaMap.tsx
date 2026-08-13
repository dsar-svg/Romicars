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

// Coordenadas reales del contorno de Venezuela
const VENEZUELA_COORDS: [number, number][] = [
  [-71.331584, 11.776284], [-71.360006, 11.539994], [-71.94705, 11.423282],
  [-71.620868, 10.96946], [-71.633064, 10.446494], [-72.074174, 9.865651],
  [-71.695644, 9.072263], [-71.264559, 9.137195], [-71.039999, 9.859993],
  [-71.350084, 10.211935], [-71.400623, 10.968969], [-70.155299, 11.375482],
  [-70.293843, 11.846822], [-69.943245, 12.162307], [-69.5843, 11.459611],
  [-68.882999, 11.443385], [-68.233271, 10.885744], [-68.194127, 10.554653],
  [-67.296249, 10.545868], [-66.227864, 10.648627], [-65.655238, 10.200799],
  [-64.890452, 10.077215], [-64.329479, 10.389599], [-64.318007, 10.641418],
  [-63.079322, 10.701724], [-61.880946, 10.715625], [-62.730119, 10.420269],
  [-62.388512, 9.948204], [-61.588767, 9.873067], [-60.830597, 9.38134],
  [-60.671252, 8.580174], [-60.150096, 8.602757], [-59.758285, 8.367035],
  [-60.550588, 7.779603], [-60.637973, 7.415], [-60.295668, 7.043911],
  [-60.543999, 6.856584], [-61.159336, 6.696077], [-61.139415, 6.234297],
  [-61.410303, 5.959068], [-60.733574, 5.200277], [-60.601179, 4.918098],
  [-60.966893, 4.536468], [-62.08543, 4.162124], [-62.804533, 4.006965],
  [-63.093198, 3.770571], [-63.888343, 4.02053], [-64.628659, 4.148481],
  [-64.816064, 4.056445], [-64.368494, 3.79721], [-64.408828, 3.126786],
  [-64.269999, 2.497006], [-63.422867, 2.411068], [-63.368788, 2.2009],
  [-64.083085, 1.916369], [-64.199306, 1.492855], [-64.611012, 1.328731],
  [-65.354713, 1.095282], [-65.548267, 0.789254], [-66.325765, 0.724452],
  [-66.876326, 1.253361], [-67.181294, 2.250638], [-67.447092, 2.600281],
  [-67.809938, 2.820655], [-67.303173, 3.318454], [-67.337564, 3.542342],
  [-67.621836, 3.839482], [-67.823012, 4.503937], [-67.744697, 5.221129],
  [-67.521532, 5.55687], [-67.34144, 6.095468], [-67.695087, 6.267318],
  [-68.265052, 6.153268], [-68.985319, 6.206805], [-69.38948, 6.099861],
  [-70.093313, 6.960376], [-70.674234, 7.087785], [-71.960176, 6.991615],
  [-72.198352, 7.340431], [-72.444487, 7.423785], [-72.479679, 7.632506],
  [-72.360901, 8.002638], [-72.439862, 8.405275], [-72.660495, 8.625288],
  [-72.78873, 9.085027], [-73.304952, 9.152], [-73.027604, 9.73677],
  [-72.905286, 10.450344], [-72.614658, 10.821975], [-72.227575, 11.108702],
  [-71.973922, 11.608672], [-71.331584, 11.776284],
];

// Líneas de frontera internas (estados) — coordenadas simplificadas
const FRONTERAS_ESTADOS: [number, number][][] = [
  // Zulia - Falcón - Lara
  [[-72.4, 11.0], [-72.0, 10.8], [-71.6, 10.5], [-71.0, 10.2]],
  // Falcón - Yaracuy - Carabobo
  [[-70.6, 10.4], [-70.0, 10.2], [-69.5, 10.0]],
  // Lara - Portuguesa - Barinas
  [[-70.0, 9.8], [-69.5, 9.5], [-69.0, 9.2]],
  // Trujillo - Mérida - Táchira
  [[-71.2, 9.5], [-71.0, 9.0], [-70.8, 8.5]],
  // Aragua - Miranda - Guárico
  [[-67.5, 10.0], [-67.0, 9.8], [-66.5, 9.5]],
  // Anzoátegui - Sucre - Monagas
  [[-64.0, 10.5], [-63.5, 10.2], [-63.0, 10.0]],
  // Bolívar - Delta Amacuro
  [[-62.0, 9.5], [-61.5, 9.0], [-61.0, 8.5]],
  // Amazonas - Bolívar
  [[-65.0, 6.0], [-64.5, 5.5], [-64.0, 5.0]],
  // Cojedes - Portuguesa - Yaracuy
  [[-68.5, 9.5], [-68.0, 9.2], [-67.5, 9.0]],
];

const VENEZUELA_BOUNDS = {
  minLng: -73.5,
  maxLng: -59.5,
  minLat: 0.5,
  maxLat: 12.5,
};

function toSvgX(lng: number, width: number) {
  return ((lng - VENEZUELA_BOUNDS.minLng) / (VENEZUELA_BOUNDS.maxLng - VENEZUELA_BOUNDS.minLng)) * width;
}

function toSvgY(lat: number, height: number) {
  return (1 - (lat - VENEZUELA_BOUNDS.minLat) / (VENEZUELA_BOUNDS.maxLat - VENEZUELA_BOUNDS.minLat)) * height;
}

function buildPath(coords: [number, number][], width: number, height: number): string {
  return coords.map((coord, i) => {
    const x = toSvgX(coord[0], width);
    const y = toSvgY(coord[1], height);
    return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ') + ' Z';
}

function buildLine(coords: [number, number][], width: number, height: number): string {
  return coords.map((coord, i) => {
    const x = toSvgX(coord[0], width);
    const y = toSvgY(coord[1], height);
    return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');
}

// Islas
const ISLAS: [number, number][][] = [
  [[-63.05, 11.05], [-62.85, 11.08], [-62.75, 11.03], [-62.78, 10.95], [-62.90, 10.90], [-63.05, 10.95], [-63.05, 11.05]],
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

  const width = 450;
  const height = 380;
  const venezuelaPath = buildPath(VENEZUELA_COORDS, width, height);

  return (
    <div style={{
      position: 'relative', width: '100%', maxWidth: 500, margin: '0 auto',
      background: 'linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%)',
      borderRadius: 16, overflow: 'hidden',
      border: '1px solid rgba(59,130,246,0.15)',
      boxShadow: '0 4px 20px rgba(59,130,246,0.08)',
    }}>
      <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', height: 'auto', display: 'block' }}>
        <defs>
          <linearGradient id="mapGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#EFF6FF" />
            <stop offset="100%" stopColor="#DBEAFE" />
          </linearGradient>
          <filter id="mapShadow" x="-5%" y="-5%" width="110%" height="110%">
            <feDropShadow dx="1" dy="2" stdDeviation="2" floodOpacity="0.15" />
          </filter>
        </defs>

        {/* Fondo */}
        <rect x="0" y="0" width={width} height={height} fill="transparent" />

        {/* Sombra del contorno */}
        <path d={venezuelaPath} fill="rgba(0,0,0,0.06)" stroke="none" transform="translate(3,3)" />

        {/* Contorno de Venezuela */}
        <path
          d={venezuelaPath}
          fill="url(#mapGradient)"
          stroke="#2563EB"
          strokeWidth={2.5}
          strokeLinejoin="round"
          filter="url(#mapShadow)"
        />

        {/* Islas */}
        {ISLAS.map((isla, i) => (
          <path
            key={i}
            d={buildPath(isla, width, height)}
            fill="url(#mapGradient)"
            stroke="#2563EB"
            strokeWidth={1.5}
            strokeLinejoin="round"
          />
        ))}

        {/* Fronteras internas (estados) */}
        {FRONTERAS_ESTADOS.map((frontera, i) => (
          <path
            key={i}
            d={buildLine(frontera, width, height)}
            fill="none"
            stroke="#93C5FD"
            strokeWidth={0.8}
            strokeDasharray="4,3"
            opacity={0.6}
          />
        ))}

        {/* Puntos de clientes */}
        {clientes.map((c) => {
          const cx = toSvgX(c.lng, width);
          const cy = toSvgY(c.lat, height);
          return (
            <g key={c.co_cli}>
              <circle cx={cx} cy={cy} r={10} fill="#DC2626" opacity={0.1} />
              <circle cx={cx} cy={cy} r={6} fill="#DC2626" opacity={0.2} />
              <circle cx={cx} cy={cy} r={4} fill="#DC2626" stroke="#FFF" strokeWidth={2}>
                <title>{`${c.cli_des} — ${c.ciudad}, ${c.estado}`}</title>
              </circle>
              <circle cx={cx} cy={cy} r={1.5} fill="#FFF" opacity={0.7} />
            </g>
          );
        })}
      </svg>

      {/* Contador */}
      <div style={{
        position: 'absolute', bottom: 10, right: 12,
        fontSize: 11, fontWeight: 600, color: '#1E40AF',
        background: 'rgba(255,255,255,0.92)',
        padding: '5px 12px', borderRadius: 8,
        boxShadow: '0 2px 8px rgba(59,130,246,0.12)',
        border: '1px solid rgba(59,130,246,0.15)',
      }}>
        {clientes.length} cliente{clientes.length !== 1 ? 's' : ''}
      </div>
    </div>
  );
}
