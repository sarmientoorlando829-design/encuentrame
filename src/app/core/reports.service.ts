import { Injectable, inject } from '@angular/core';
import { AuthService } from './auth.service';
import { MapBounds, NewReport, ReportInput, ReportStatus, REPORT_COLUMNS, Report, ReportFilters } from './models';
import { SupabaseService } from './supabase.service';

@Injectable({ providedIn: 'root' })
export class ReportsService {
  private readonly sb = inject(SupabaseService).client;
  private readonly auth = inject(AuthService);

  /** RF-01: reportes filtrados; con `bounds` solo trae el área visible del mapa (RNF-08). */
  async list(filters: ReportFilters, bounds?: MapBounds, limit = 100): Promise<Report[]> {
    let q = this.sb.from('reports').select(REPORT_COLUMNS); // columnas explícitas: sin teléfono

    if (filters.status === 'activos') q = q.in('status', ['perdida', 'encontrada']);
    else q = q.eq('status', filters.status);
    if (filters.animalType) q = q.eq('animal_type', filters.animalType);
    if (filters.color.trim()) q = q.ilike('color', `%${filters.color.trim()}%`);
    if (filters.dateFrom) q = q.gte('lost_date', filters.dateFrom);
    if (bounds) {
      q = q.gte('lat', bounds.south).lte('lat', bounds.north).gte('lng', bounds.west).lte('lng', bounds.east);
    }

    const { data, error } = await q.order('created_at', { ascending: false }).limit(limit);
    if (error) throw error;
    return (data ?? []) as Report[];
  }

  async getById(id: string): Promise<Report | null> {
    const { data, error } = await this.sb.from('reports').select(REPORT_COLUMNS).eq('id', id).maybeSingle();
    if (error) throw error;
    return data as Report | null;
  }

  /** RNF-07: la tabla report_contacts solo responde a usuarios autenticados. */
  async getContactPhone(reportId: string): Promise<string | null> {
    if (!this.auth.isAuthenticated()) return null;
    const { data } = await this.sb.from('report_contacts').select('contact_phone').eq('report_id', reportId).maybeSingle();
    return (data as { contact_phone: string } | null)?.contact_phone ?? null;
  }

  /** RF-06: reportes del usuario (activos y resueltos). */
  async listMine(userId: string): Promise<Report[]> {
    const { data, error } = await this.sb.from('reports').select(REPORT_COLUMNS).eq('user_id', userId).order('created_at', { ascending: false });
    if (error) throw error;
    return (data ?? []) as Report[];
  }

  /** RF-06: edita (RLS: solo el autor). */
  async update(id: string, fields: ReportInput, contactPhone: string): Promise<void> {
    const { error } = await this.sb.from('reports').update(fields).eq('id', id);
    if (error) throw error;
    const { error: cErr } = await this.sb.from('report_contacts').upsert({ report_id: id, contact_phone: contactPhone });
    if (cErr) throw cErr;
  }

  async setStatus(id: string, status: ReportStatus): Promise<void> {
    const { error } = await this.sb.from('reports').update({ status }).eq('id', id);
    if (error) throw error;
  }

  /** Borra el reporte y, si se puede, su foto del bucket. */
  async remove(r: Report): Promise<void> {
    const { error } = await this.sb.from('reports').delete().eq('id', r.id);
    if (error) throw error;
    const marker = '/pet-photos/';
    const i = r.photo_url?.indexOf(marker) ?? -1;
    if (r.photo_url && i >= 0) await this.sb.storage.from('pet-photos').remove([r.photo_url.slice(i + marker.length)]);
  }

  /** RF-04: inserta el reporte y su teléfono (tabla aparte). */
  async create(input: NewReport): Promise<Report> {
    const { contact_phone, ...fields } = input;
    const { data, error } = await this.sb.from('reports').insert(fields).select(REPORT_COLUMNS).single();
    if (error) throw error;
    const report = data as Report;

    const { error: cErr } = await this.sb.from('report_contacts').insert({ report_id: report.id, contact_phone });
    if (cErr) {
      await this.sb.from('reports').delete().eq('id', report.id); // rollback manual
      throw cErr;
    }
    return report;
  }
}
