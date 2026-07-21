import axios, { AxiosInstance } from 'axios';

interface ProfitConfig {
  baseURL: string;
  user: string;
  password: string;
  token: string;
  company: string;
  year: number;
  ramaVentas: string;
  timeout: number;
}

let profitClient: AxiosInstance | null = null;
let authToken = '';

function getConfig(): ProfitConfig {
  return {
    baseURL: process.env.PROFIT_API_URL || 'http://localhost:8000',
    user: process.env.PROFIT_API_USER || 'admin',
    password: process.env.PROFIT_API_PASSWORD || '',
    token: process.env.PROFIT_API_TOKEN || '',
    company: process.env.PROFIT_COMPANY || 'ROMICARS',
    year: parseInt(process.env.PROFIT_YEAR || '2026', 10),
    ramaVentas: process.env.PROFIT_RAMA_VENTAS || '01',
    timeout: parseInt(process.env.PROFIT_TIMEOUT || '30000', 10),
  };
}

async function authenticate(): Promise<string> {
  const config = getConfig();

  if (config.token) {
    authToken = config.token;
    return authToken;
  }

  try {
    const res = await axios.post(`${config.baseURL}/api/login`, {
      usuario: config.user,
      clave: config.password,
      compania: config.company,
    }, { timeout: config.timeout });

    authToken = res.data.token || res.data.Token || '';
    return authToken;
  } catch (error: any) {
    console.error('Error autenticando con Profit API:', error.message);
    throw new Error('No se pudo autenticar con Profit');
  }
}

function getClient(): AxiosInstance {
  if (profitClient) return profitClient;

  const config = getConfig();
  profitClient = axios.create({
    baseURL: config.baseURL,
    timeout: config.timeout,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'X-Company': config.company,
    },
  });

  profitClient.interceptors.request.use(async (req) => {
    if (authToken) {
      req.headers.Authorization = `Bearer ${authToken}`;
    }
    return req;
  });

  profitClient.interceptors.response.use(
    (res) => res,
    async (error) => {
      if (error.response?.status === 401) {
        authToken = '';
        try {
          authToken = await authenticate();
          if (error.config) {
            error.config.headers.Authorization = `Bearer ${authToken}`;
            return profitClient!.request(error.config);
          }
        } catch { /* fail through */ }
      }
      return Promise.reject(error);
    }
  );

  return profitClient;
}

function parseProfitResponse(data: any): any[] {
  if (Array.isArray(data)) return data;
  if (data?.value && Array.isArray(data.value)) return data.value;
  if (data?.data && Array.isArray(data.data)) return data.data;
  if (data?.records && Array.isArray(data.records)) return data.records;
  if (data?.Resultado && Array.isArray(data.Resultado)) return data.Resultado;
  return [];
}

export interface ProductoProfit {
  co_art: string;
  art_des: string;
  total_vendido: number;
  cantidad_vendida: number;
  existencias: number;
  tipo?: string;
}

export interface FacturaProfit {
  fact_num: string;
  fecha: string;
  cliente: string;
  cliente_nombre: string;
  monto_total: number;
  monto_iva: number;
  status: string;
}

export interface ClienteProfit {
  co_cli: string;
  cli_des: string;
  direccion1: string;
  direccion2: string;
  ciudad: string;
  estado: string;
  telefono: string;
  email: string;
  latitude?: number;
  longitude?: number;
}

export interface ProfitDashboard {
  productos_mas_vendidos: ProductoProfit[];
  productos_menos_vendidos: ProductoProfit[];
  total_facturado: number;
  facturas_periodo: number;
  clientes_ubicacion: ClienteProfit[];
}

export async function getProductosMasVendidos(limit = 10): Promise<ProductoProfit[]> {
  const config = getConfig();
  const client = getClient();
  try {
    const res = await client.get(`/api/maestros/articulos`, {
      params: {
        compania: config.company,
        orderBy: 'total_vendido DESC',
        top: limit,
        año: config.year,
      },
    });
    const items = parseProfitResponse(res.data);
    return items.slice(0, limit).map((i: any) => ({
      co_art: i.co_art || i.CoArt || '',
      art_des: i.art_des || i.ArtDes || i.descripcion || '',
      total_vendido: parseFloat(i.total_vendido || i.TotalVendido || i.monto_total || 0),
      cantidad_vendida: parseFloat(i.cantidad_vendida || i.CantidadVendida || i.cantidad || 0),
      existencias: parseFloat(i.existencias || i.Existencias || i.stock || 0),
    }));
  } catch (error: any) {
    console.error('Error obteniendo productos más vendidos:', error.message);
    return fallbackProductosMasVendidos(limit);
  }
}

export async function getProductosMenosVendidos(limit = 10): Promise<ProductoProfit[]> {
  const config = getConfig();
  const client = getClient();
  try {
    const res = await client.get(`/api/maestros/articulos`, {
      params: {
        compania: config.company,
        orderBy: 'total_vendido ASC',
        top: limit,
        año: config.year,
        soloConVentas: true,
      },
    });
    const items = parseProfitResponse(res.data);
    return items.slice(0, limit).map((i: any) => ({
      co_art: i.co_art || i.CoArt || '',
      art_des: i.art_des || i.ArtDes || i.descripcion || '',
      total_vendido: parseFloat(i.total_vendido || i.TotalVendido || i.monto_total || 0),
      cantidad_vendida: parseFloat(i.cantidad_vendida || i.CantidadVendida || i.cantidad || 0),
      existencias: parseFloat(i.existencias || i.Existencias || i.stock || 0),
    }));
  } catch (error: any) {
    console.error('Error obteniendo productos menos vendidos:', error.message);
    return fallbackProductosMenosVendidos(limit);
  }
}

export async function getTotalFacturado(): Promise<{ total: number; facturas: number }> {
  const config = getConfig();
  const client = getClient();
  try {
    const res = await client.get(`/api/ventas/facturas`, {
      params: {
        compania: config.company,
        año: config.year,
        rama: config.ramaVentas,
        resumen: true,
      },
    });
    const data = res.data;
    const total = parseFloat(
      data.total || data.Total || data.monto_total || data.MontoTotal || 0
    );
    const facturas = parseInt(
      data.count || data.Count || data.cantidad || data.Cantidad || 0, 10
    );
    return { total, facturas };
  } catch (error: any) {
    console.error('Error obteniendo total facturado:', error.message);
    return fallbackTotalFacturado();
  }
}

export async function getClientesUbicacion(): Promise<ClienteProfit[]> {
  const config = getConfig();
  const client = getClient();
  try {
    const res = await client.get(`/api/maestros/clientes`, {
      params: {
        compania: config.company,
        campos: 'co_cli,cli_des,direccion1,direccion2,ciudad,estado,telefono,email',
        limit: 500,
      },
    });
    const items = parseProfitResponse(res.data);
    return items.map((c: any) => ({
      co_cli: c.co_cli || c.CoCli || '',
      cli_des: c.cli_des || c.CliDes || c.nombre || '',
      direccion1: c.direccion1 || c.Direccion1 || '',
      direccion2: c.direccion2 || c.Direccion2 || '',
      ciudad: c.ciudad || c.Ciudad || '',
      estado: c.estado || c.Estado || '',
      telefono: c.telefono || c.Telefono || '',
      email: c.email || c.Email || '',
    }));
  } catch (error: any) {
    console.error('Error obteniendo clientes de Profit:', error.message);
    return fallbackClientesUbicacion();
  }
}

export async function getProfitDashboard(): Promise<ProfitDashboard> {
  const [masVendidos, menosVendidos, facturado, clientes] = await Promise.all([
    getProductosMasVendidos(10),
    getProductosMenosVendidos(10),
    getTotalFacturado(),
    getClientesUbicacion(),
  ]);

  return {
    productos_mas_vendidos: masVendidos,
    productos_menos_vendidos: menosVendidos,
    total_facturado: facturado.total,
    facturas_periodo: facturado.facturas,
    clientes_ubicacion: clientes,
  };
}

function extractCoordsFromAddress(address: string): { lat: number; lng: number } | null {
  const coordRegex = /(\-?\d+\.?\d*),\s*(\-?\d+\.?\d*)/;
  const match = address.match(coordRegex);
  if (match) {
    return { lat: parseFloat(match[1]), lng: parseFloat(match[2]) };
  }
  return null;
}

const ESTADO_COORDS: Record<string, { lat: number; lng: number }> = {
  'Amazonas': { lat: 3.5, lng: -65.5 },
  'Anzoátegui': { lat: 8.5, lng: -64.0 },
  'Apure': { lat: 7.0, lng: -68.5 },
  'Aragua': { lat: 10.0, lng: -67.5 },
  'Barinas': { lat: 8.5, lng: -70.0 },
  'Bolívar': { lat: 6.0, lng: -63.5 },
  'Carabobo': { lat: 10.0, lng: -68.0 },
  'Cojedes': { lat: 9.5, lng: -68.5 },
  'Delta Amacuro': { lat: 9.0, lng: -61.5 },
  'Distrito Capital': { lat: 10.48, lng: -66.90 },
  'Falcón': { lat: 11.0, lng: -69.5 },
  'Guárico': { lat: 8.5, lng: -66.5 },
  'Lara': { lat: 10.0, lng: -69.5 },
  'Mérida': { lat: 8.5, lng: -71.0 },
  'Miranda': { lat: 10.3, lng: -66.5 },
  'Monagas': { lat: 9.5, lng: -63.0 },
  'Nueva Esparta': { lat: 11.0, lng: -64.0 },
  'Portuguesa': { lat: 9.0, lng: -69.0 },
  'Sucre': { lat: 10.5, lng: -63.0 },
  'Táchira': { lat: 7.5, lng: -72.0 },
  'Trujillo': { lat: 9.5, lng: -70.5 },
  'Vargas': { lat: 10.6, lng: -66.8 },
  'Yaracuy': { lat: 10.0, lng: -68.5 },
  'Zulia': { lat: 10.0, lng: -71.5 },
};

export async function getClientesConCoordenadas(): Promise<(ClienteProfit & { lat: number; lng: number })[]> {
  const clientes = await getClientesUbicacion();
  return clientes.map((c) => {
    const coords = extractCoordsFromAddress(c.direccion1) || extractCoordsFromAddress(c.direccion2) || null;
    if (coords) {
      return { ...c, lat: coords.lat, lng: coords.lng };
    }
    const estadoKey = Object.keys(ESTADO_COORDS).find(
      (k) => c.estado?.toLowerCase().includes(k.toLowerCase()) ||
             c.ciudad?.toLowerCase().includes(k.toLowerCase())
    );
    if (estadoKey) {
      return { ...c, lat: ESTADO_COORDS[estadoKey].lat, lng: ESTADO_COORDS[estadoKey].lng };
    }
    return { ...c, lat: 10.48, lng: -66.90 };
  });
}

function fallbackProductosMasVendidos(limit: number): ProductoProfit[] {
  const dummy: ProductoProfit[] = [];
  for (let i = 0; i < limit; i++) {
    dummy.push({
      co_art: `PROFIT${String(i + 1).padStart(3, '0')}`,
      art_des: `Producto ${i + 1} (conectar Profit)`,
      total_vendido: Math.round(Math.random() * 100000) / 10,
      cantidad_vendida: Math.round(Math.random() * 500),
      existencias: Math.round(Math.random() * 200),
    });
  }
  return dummy.sort((a, b) => b.total_vendido - a.total_vendido);
}

function fallbackProductosMenosVendidos(limit: number): ProductoProfit[] {
  const dummy: ProductoProfit[] = [];
  for (let i = 0; i < limit; i++) {
    dummy.push({
      co_art: `PROFIT${String(i + 1).padStart(3, '0')}`,
      art_des: `Producto ${i + 1} (conectar Profit)`,
      total_vendido: Math.round(Math.random() * 5000) / 10,
      cantidad_vendida: Math.round(Math.random() * 20),
      existencias: Math.round(Math.random() * 200),
    });
  }
  return dummy.sort((a, b) => a.total_vendido - b.total_vendido);
}

function fallbackTotalFacturado(): { total: number; facturas: number } {
  return {
    total: 0,
    facturas: 0,
  };
}

function fallbackClientesUbicacion(): ClienteProfit[] {
  return [];
}
