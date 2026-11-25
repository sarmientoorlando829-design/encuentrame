export type ReportStatus = 'perdida' | 'encontrada' | 'resuelta';
export type AnimalType = 'Perro' | 'Gato' | 'Otro';
export type PetSize = 'Pequeño' | 'Mediano' | 'Grande';

export const STATUS_LABEL: Record<ReportStatus, string> = {
  perdida: 'PERDIDO',
  encontrada: 'ENCONTRADO (busca dueño)',
  resuelta: 'YA VOLVIÓ A CASA',
};

/** Acepta espacios/guiones al escribir y los quita al guardar. */
export const PHONE_PATTERN = /^\+?[\d\s-]{7,20}$/;
export const cleanPhone = (p: string): string => p.replace(/[\s-]/g, '');

export interface Sighting {
  id: string;
  report_id: string;
  user_id: string;
  author_name: string;
  comment: string;
  photo_url: string | null;
  lat: number | null;
  lng: number | null;
  created_at: string;
}

export type ReportInput = Omit<NewReport, 'contact_phone'>;

/** Número listo para wa.me: si son 10 dígitos locales agrega el 57 de Colombia. */
export function toWhatsappNumber(phone: string): string {
  const d = phone.replace(/\D/g, '');
  return d.length === 10 ? `57${d}` : d;
}

export interface Profile {
  id: string;
  full_name: string;
  phone: string;
}

/** Reporte público: NO incluye teléfono (RNF-07). */
export interface Report {
  id: string;
  user_id: string;
  status: ReportStatus;
  animal_type: AnimalType;
  name: string | null;
  breed: string | null;
  color: string;
  size: PetSize | null;
  city: string;
  description: string | null;
  lost_date: string; // YYYY-MM-DD
  lat: number;
  lng: number;
  photo_url: string | null;
  contact_name: string;
  created_at: string;
}

export type NewReport = Omit<Report, 'id' | 'user_id' | 'created_at'> & { contact_phone: string };

export interface ReportFilters {
  animalType: AnimalType | null;
  color: string;
  status: 'activos' | 'perdida' | 'resuelta';
  dateFrom: string | null; // YYYY-MM-DD
}

export const EMPTY_FILTERS: ReportFilters = { animalType: null, color: '', status: 'activos', dateFrom: null };

export interface MapBounds {
  south: number;
  west: number;
  north: number;
  east: number;
}

export const REPORT_COLUMNS =
  'id,user_id,status,animal_type,name,breed,color,size,city,description,lost_date,lat,lng,photo_url,contact_name,created_at';
