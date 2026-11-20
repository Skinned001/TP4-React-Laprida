export type Libro = {
  isbn: string; // 13 dígitos, sin guiones
  titulo: string;
  autor: string;
  anio: number;
  ejemplares: number; // ejemplares en el estante al iniciar la app
};

export type Prestamo = {
  isbn: string;
  titulo: string;
  fechaDevolucion: string; // ISO string
  recordarme: boolean;
  notificacionId: string | null;
};

export type ReservaEspera = {
  isbn: string;
  titulo: string;
  posicion: number;
};

export type AvisoApp = {
  id: string;
  mensaje: string;
  fecha: string;
};

export type EstadoPermiso =
  | 'cargando'
  | 'concedido'
  | 'preguntable'
  | 'bloqueado';

export type RecursoPermiso = 'camara' | 'notificaciones';
