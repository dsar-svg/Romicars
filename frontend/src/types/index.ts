export interface Cliente {
  id: number;
  nombre: string | null;
  telefono: string;
  facebook_psid: string | null;
  instagram_psid: string | null;
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
  modo_atencion: 'bot' | 'agente' | 'transfiriendo';
  asignado_a: number | null;
  resumen_transferencia: string | null;
  pinned: boolean;
  eliminado: boolean;
  estado_conversacion: 'nuevo' | 'en_progreso' | 'resuelto' | 'cerrado' | 'en_pausa';
  sla_inicio: string | null;
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
  pinned: boolean;
  eliminado: boolean;
  fecha_envio: string;
  _uploading?: boolean;
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

export interface NotaInterna {
  id: number;
  cliente_id: number;
  agente_id: number;
  agente_nombre?: string;
  contenido: string;
  created_at: string;
}

export interface Snippet {
  id: number;
  agente_id: number | null;
  atajo: string;
  contenido: string;
  categoria: string;
  created_at: string;
}

export interface Rol {
  id: number;
  nombre: string;
  permisos: string[] | null;
}

export interface Nota {
  id: number;
  cliente_id: number;
  agente_id: number;
  contenido: string;
  agente_nombre: string;
  created_at: string;
}

export interface Snippet {
  id: number;
  agente_id: number | null;
  atajo: string;
  contenido: string;
  categoria: string;
}
