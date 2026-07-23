export interface Cliente {
  id: number;
  nombre: string | null;
  telefono: string;
  canal_origen: 'whatsapp' | 'instagram' | 'facebook';
  marca_carro: string | null;
  modelo_carro: string | null;
  anio_carro: number | null;
  motor_carro: string | null;
  estado_venta: 'Lead' | 'Interesado' | 'Compro' | 'No Compro';
  urgencia: 'Alta' | 'Media' | 'Baja';
  resumen_busqueda: string | null;
  pidio_fotos: boolean;
  acepta_promos: boolean;
  ultimo_mensaje: string | null;
  ultimo_remitente: string | null;
  ultima_interaccion: string | null;
  created_at: string;
  updated_at: string;
}

export interface Mensaje {
  id: number;
  cliente_id: number;
  remitente: 'cliente' | 'agente' | 'bot';
  contenido: string;
  tipo: 'texto' | 'imagen' | 'archivo' | 'audio' | 'video';
  url_multimedia: string | null;
  leido: boolean;
  asignado_a: number | null;
  fecha_envio: string;
  /** Solo frontend: true mientras se sube el archivo */
  _uploading?: boolean;
  /** Solo frontend: true si falló la subida */
  _error?: boolean;
}

export interface Agente {
  id: number;
  nombre: string;
  email: string;
  rol_id: number;
  rol_nombre: string;
  activo: boolean;
  ultimo_acceso: string | null;
}

export interface Rol {
  id: number;
  nombre: string;
  permisos: string[] | null;
}
