import { useState, useMemo } from 'react';

interface ClientLocation {
  co_cli: string;
  cli_des: string;
  lat: number;
  lng: number;
  ciudad: string;
  estado: string;
}

interface Props {
  clientes: ClientLocation[];
  className?: string;
}

function getEstadoFromCoords(lat: number, lng: number): string {
  if (lat >= 10.3 && lat <= 10.6 && lng >= -67.1 && lng <= -66.7) return 'Distrito Capital';
  if (lat >= 10.0 && lat <= 10.6 && lng >= -66.0 && lng <= -65.5) return 'Miranda';
  if (lat >= 10.0 && lat <= 10.8 && lng >= -68.5 && lng <= -67.5) return 'Carabobo';
  if (lat >= 9.0 && lat <= 10.5 && lng >= -70.5 && lng <= -68.5) return 'Lara';
  if (lat >= 10.0 && lat <= 11.0 && lng >= -72.5 && lng <= -70.5) return 'Zulia';
  if (lat >= 7.5 && lat <= 9.0 && lng >= -72.5 && lng <= -71.0) return 'Táchira';
  if (lat >= 8.0 && lat <= 9.5 && lng >= -71.5 && lng <= -70.0) return 'Mérida';
  if (lat >= 9.0 && lat <= 10.0 && lng >= -71.0 && lng <= -69.5) return 'Trujillo';
  if (lat >= 8.5 && lat <= 10.5 && lng >= -69.5 && lng <= -68.0) return 'Portuguesa';
  if (lat >= 8.5 && lat <= 10.0 && lng >= -70.5 && lng <= -69.0) return 'Barinas';
  if (lat >= 9.0 && lat <= 10.5 && lng >= -68.5 && lng <= -67.0) return 'Yaracuy';
  if (lat >= 10.0 && lat <= 11.0 && lng >= -71.5 && lng <= -69.5) return 'Falcón';
  if (lat >= 9.5 && lat <= 10.8 && lng >= -67.5 && lng <= -66.0) return 'Aragua';
  if (lat >= 7.5 && lat <= 9.5 && lng >= -67.5 && lng <= -65.5) return 'Guárico';
  if (lat >= 6.0 && lat <= 8.0 && lng >= -67.5 && lng <= -65.0) return 'Apure';
  if (lat >= 3.5 && lat <= 6.0 && lng >= -67.5 && lng <= -63.0) return 'Amazonas';
  if (lat >= 5.0 && lat <= 8.5 && lng >= -64.5 && lng <= -60.0) return 'Bolívar';
  if (lat >= 8.0 && lat <= 10.0 && lng >= -65.5 && lng <= -63.0) return 'Anzoátegui';
  if (lat >= 9.0 && lat <= 10.5 && lng >= -64.0 && lng <= -62.0) return 'Monagas';
  if (lat >= 8.0 && lat <= 9.5 && lng >= -68.5 && lng <= -66.0) return 'Cojedes';
  if (lat >= 8.5 && lat <= 10.0 && lng >= -63.0 && lng <= -61.5) return 'Delta Amacuro';
  if (lat >= 10.0 && lat <= 11.0 && lng >= -64.5 && lng <= -63.5) return 'Nueva Esparta';
  if (lat >= 10.0 && lat <= 11.0 && lng >= -64.0 && lng <= -62.0) return 'Sucre';
  if (lat >= 10.5 && lat <= 10.8 && lng >= -67.0 && lng <= -66.5) return 'Vargas';
  return 'Distrito Capital';
}

export default function VenezuelaMap({ clientes, className }: Props) {
  const [tooltip, setTooltip] = useState<{ x: number; y: number; cliente: ClientLocation } | null>(null);

  const estadoCounts = useMemo(() => {
    const counts: Record<string, { count: number; clientes: ClientLocation[] }> = {};
    clientes.forEach((c) => {
      const estado = c.estado || getEstadoFromCoords(c.lat, c.lng);
      if (!counts[estado]) {
        counts[estado] = { count: 0, clientes: [] };
      }
      counts[estado].count++;
      counts[estado].clientes.push(c);
    });
    return counts;
  }, [clientes]);

  const maxCount = Math.max(...Object.values(estadoCounts).map((e) => e.count), 1);

  function getColor(count: number): string {
    if (count === 0) return '#f0f0f0';
    const intensity = Math.min(count / maxCount, 1);
    if (intensity <= 0.33) return '#cce5ff';
    if (intensity <= 0.66) return '#66b0ff';
    return '#1a73e8';
  }

  return (
    <div className={className} style={{ position: 'relative', width: '100%', maxWidth: 500, margin: '0 auto' }}>
      <svg viewBox="200 150 800 700" style={{ width: '100%', height: 'auto' }}>
        <g transform="translate(0, 20)">
          <path
            d="M520,260 L540,255 L560,260 L570,275 L565,290 L550,295 L535,290 L525,278 Z"
            fill={getColor(estadoCounts['Zulia']?.count || 0)} stroke="#999" strokeWidth="1"
          />
          <text x="542" y="278" fontSize="9" textAnchor="middle" fill="#555" fontWeight="500">Zulia</text>

          <path
            d="M480,295 L500,290 L520,295 L525,310 L515,325 L500,325 L485,315 L478,303 Z"
            fill={getColor(estadoCounts['Falcón']?.count || 0)} stroke="#999" strokeWidth="1"
          />
          <text x="500" y="310" fontSize="8" textAnchor="middle" fill="#555" fontWeight="500">Falcón</text>

          <path
            d="M530,295 L550,295 L565,305 L560,320 L545,325 L530,320 L525,308 Z"
            fill={getColor(estadoCounts['Lara']?.count || 0)} stroke="#999" strokeWidth="1"
          />
          <text x="546" y="312" fontSize="8" textAnchor="middle" fill="#555" fontWeight="500">Lara</text>

          <path
            d="M555,330 L570,330 L580,340 L578,355 L565,358 L555,350 L550,340 Z"
            fill={getColor(estadoCounts['Portuguesa']?.count || 0)} stroke="#999" strokeWidth="1"
          />
          <text x="566" y="346" fontSize="8" textAnchor="middle" fill="#555" fontWeight="500">Portuguesa</text>

          <path
            d="M530,330 L545,330 L553,340 L550,355 L540,360 L530,352 L525,342 Z"
            fill={getColor(estadoCounts['Yaracuy']?.count || 0)} stroke="#999" strokeWidth="1"
          />
          <text x="540" y="347" fontSize="8" textAnchor="middle" fill="#555" fontWeight="500">Yaracuy</text>

          <path
            d="M555,298 L570,298 L580,308 L578,320 L565,322 L555,315 L550,305 Z"
            fill={getColor(estadoCounts['Trujillo']?.count || 0)} stroke="#999" strokeWidth="1"
          />
          <text x="566" y="312" fontSize="7" textAnchor="middle" fill="#555" fontWeight="500">Trujillo</text>

          <path
            d="M555,368 L570,370 L580,380 L575,395 L562,398 L553,390 L550,378 Z"
            fill={getColor(estadoCounts['Barinas']?.count || 0)} stroke="#999" strokeWidth="1"
          />
          <text x="566" y="385" fontSize="8" textAnchor="middle" fill="#555" fontWeight="500">Barinas</text>

          <path
            d="M530,368 L545,370 L552,380 L550,395 L540,398 L530,390 L525,380 Z"
            fill={getColor(estadoCounts['Cojedes']?.count || 0)} stroke="#999" strokeWidth="1"
          />
          <text x="540" y="385" fontSize="7" textAnchor="middle" fill="#555" fontWeight="500">Cojedes</text>

          <path
            d="M580,295 L600,290 L615,300 L612,315 L600,320 L585,315 L578,305 Z"
            fill={getColor(estadoCounts['Carabobo']?.count || 0)} stroke="#999" strokeWidth="1"
          />
          <text x="596" y="308" fontSize="8" textAnchor="middle" fill="#555" fontWeight="500">Carabobo</text>

          <path
            d="M620,290 L640,285 L655,295 L650,310 L638,315 L622,310 L618,300 Z"
            fill={getColor(estadoCounts['Aragua']?.count || 0)} stroke="#999" strokeWidth="1"
          />
          <text x="636" y="303" fontSize="8" textAnchor="middle" fill="#555" fontWeight="500">Aragua</text>

          <path
            d="M658,285 L678,280 L690,290 L685,305 L672,310 L660,305 L656,295 Z"
            fill={getColor(estadoCounts['Distrito Capital']?.count || 0)} stroke="#999" strokeWidth="1"
          />
          <text x="672" y="298" fontSize="7" textAnchor="middle" fill="#555" fontWeight="500">D.C.</text>

          <path
            d="M678,278 L700,272 L718,280 L715,295 L700,300 L685,295 L678,285 Z"
            fill={getColor(estadoCounts['Miranda']?.count || 0)} stroke="#999" strokeWidth="1"
          />
          <text x="698" y="288" fontSize="8" textAnchor="middle" fill="#555" fontWeight="500">Miranda</text>

          <path
            d="M700,270 L720,265 L735,272 L732,288 L718,293 L705,288 L698,278 Z"
            fill={getColor(estadoCounts['Vargas']?.count || 0)} stroke="#999" strokeWidth="1"
          />
          <text x="718" y="280" fontSize="7" textAnchor="middle" fill="#555" fontWeight="500">Vargas</text>

          <path
            d="M590,330 L610,325 L625,335 L622,352 L610,358 L595,352 L588,342 Z"
            fill={getColor(estadoCounts['Guárico']?.count || 0)} stroke="#999" strokeWidth="1"
          />
          <text x="606" y="344" fontSize="8" textAnchor="middle" fill="#555" fontWeight="500">Guárico</text>

          <path
            d="M530,405 L550,408 L565,418 L560,435 L548,440 L535,435 L528,420 Z"
            fill={getColor(estadoCounts['Apure']?.count || 0)} stroke="#999" strokeWidth="1"
          />
          <text x="548" y="425" fontSize="8" textAnchor="middle" fill="#555" fontWeight="500">Apure</text>

          <path
            d="M580,408 L600,405 L620,415 L618,432 L605,438 L588,432 L578,420 Z"
            fill={getColor(estadoCounts['Anzoátegui']?.count || 0)} stroke="#999" strokeWidth="1"
          />
          <text x="600" y="425" fontSize="8" textAnchor="middle" fill="#555" fontWeight="500">Anzoátegui</text>

          <path
            d="M620,410 L640,408 L658,418 L655,435 L640,440 L625,435 L618,422 Z"
            fill={getColor(estadoCounts['Monagas']?.count || 0)} stroke="#999" strokeWidth="1"
          />
          <text x="638" y="426" fontSize="8" textAnchor="middle" fill="#555" fontWeight="500">Monagas</text>

          <path
            d="M660,412 L680,410 L695,420 L692,435 L678,440 L662,435 L658,422 Z"
            fill={getColor(estadoCounts['Sucre']?.count || 0)} stroke="#999" strokeWidth="1"
          />
          <text x="678" y="428" fontSize="8" textAnchor="middle" fill="#555" fontWeight="500">Sucre</text>

          <path
            d="M695,415 L710,412 L720,420 L718,432 L708,436 L698,432 L694,422 Z"
            fill={getColor(estadoCounts['Delta Amacuro']?.count || 0)} stroke="#999" strokeWidth="1"
          />
          <text x="708" y="426" fontSize="7" textAnchor="middle" fill="#555" fontWeight="500">Delta A.</text>

          <path
            d="M705,270 L720,265 L735,275 L732,288 L718,290 L708,282 L704,275 Z"
            fill={getColor(estadoCounts['Nueva Esparta']?.count || 0)} stroke="#999" strokeWidth="1"
          />
          <text x="720" y="280" fontSize="7" textAnchor="middle" fill="#555" fontWeight="500">N. Esparta</text>

          <path
            d="M555,445 L575,448 L590,458 L585,475 L572,480 L558,475 L552,462 Z"
            fill={getColor(estadoCounts['Amazonas']?.count || 0)} stroke="#999" strokeWidth="1"
          />
          <text x="572" y="465" fontSize="8" textAnchor="middle" fill="#555" fontWeight="500">Amazonas</text>

          <path
            d="M595,448 L630,445 L655,458 L650,478 L632,485 L605,480 L590,468 Z"
            fill={getColor(estadoCounts['Bolívar']?.count || 0)} stroke="#999" strokeWidth="1"
          />
          <text x="625" y="466" fontSize="8" textAnchor="middle" fill="#555" fontWeight="500">Bolívar</text>

          <path
            d="M525,290 L540,290 L548,300 L545,310 L535,312 L525,306 L522,298 Z"
            fill={getColor(estadoCounts['Mérida']?.count || 0)} stroke="#999" strokeWidth="1"
          />
          <text x="536" y="302" fontSize="7" textAnchor="middle" fill="#555" fontWeight="500">Mérida</text>

          <path
            d="M510,290 L525,290 L530,300 L528,312 L518,315 L508,308 L505,298 Z"
            fill={getColor(estadoCounts['Táchira']?.count || 0)} stroke="#999" strokeWidth="1"
          />
          <text x="518" y="305" fontSize="7" textAnchor="middle" fill="#555" fontWeight="500">Táchira</text>
        </g>

        {clientes.map((cliente, i) => {
          const cx = ((cliente.lng + 74) / 12) * 100 + 200;
          const cy = ((12 - (cliente.lat - 0)) / 12) * 100 + 280;
          return (
            <circle
              key={`${cliente.co_cli}-${i}`}
              cx={cx} cy={cy} r={Math.min(4 + clientes.length / 20, 8)}
              fill="#BD060A" opacity={0.7}
              stroke="#fff" strokeWidth={1.5}
              style={{ cursor: 'pointer', transition: 'opacity 0.2s' }}
              onMouseEnter={(e) => {
                const rect = (e.target as SVGCircleElement).getBoundingClientRect();
                setTooltip({ x: rect.left, y: rect.top - 10, cliente });
              }}
              onMouseLeave={() => setTooltip(null)}
            />
          );
        })}
      </svg>

      {tooltip && (
        <div style={{
          position: 'fixed', top: tooltip.y - 10, left: tooltip.x + 10,
          background: '#fff', border: '1px solid #ddd', borderRadius: 8,
          padding: '8px 12', boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
          fontSize: 12, zIndex: 1000, pointerEvents: 'none', maxWidth: 200,
        }}>
          <div style={{ fontWeight: 700, color: 'var(--gris-oscuro)' }}>{tooltip.cliente.cli_des}</div>
          <div style={{ color: 'var(--gris-texto)', marginTop: 2 }}>
            {tooltip.cliente.ciudad}{tooltip.cliente.ciudad && tooltip.cliente.estado ? ', ' : ''}{tooltip.cliente.estado}
          </div>
          <div style={{ color: '#666', fontSize: 11, marginTop: 1 }}>
            {tooltip.cliente.lat.toFixed(3)}, {tooltip.cliente.lng.toFixed(3)}
          </div>
        </div>
      )}

      {clientes.length === 0 && (
        <div style={{
          position: 'absolute', top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          textAlign: 'center', color: 'var(--gris-texto)',
          fontSize: 14,
        }}>
          <p style={{ fontWeight: 600 }}>Sin ubicaciones</p>
          <p style={{ fontSize: 13, marginTop: 4 }}>Conecta Profit para ver el mapa</p>
        </div>
      )}
    </div>
  );
}
