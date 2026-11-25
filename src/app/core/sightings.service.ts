import { Injectable, inject } from '@angular/core';
import { AuthService } from './auth.service';
import { MediaLocationService } from './media-location.service';
import { Sighting } from './models';
import { SupabaseService } from './supabase.service';

export interface NewSighting {
  reportId: string;
  comment: string;
  photo: File | null;
  lat: number | null;
  lng: number | null;
}

@Injectable({ providedIn: 'root' })
export class SightingsService {
  private readonly sb = inject(SupabaseService).client;
  private readonly auth = inject(AuthService);
  private readonly media = inject(MediaLocationService);

  /** Cronológico: del más antiguo al más reciente. */
  async list(reportId: string): Promise<Sighting[]> {
    const { data, error } = await this.sb.from('sightings').select('*').eq('report_id', reportId).order('created_at', { ascending: true });
    if (error) throw error;
    return (data ?? []) as Sighting[];
  }

  async add(s: NewSighting): Promise<void> {
    const user = this.auth.currentUser();
    if (!user) throw new Error('Sin sesión');
    const photo_url = s.photo ? await this.media.uploadPhoto(s.photo, user.id, 'sightings') : null;
    const { error } = await this.sb.from('sightings').insert({
      report_id: s.reportId,
      comment: s.comment,
      photo_url,
      lat: s.lat,
      lng: s.lng,
      author_name: this.auth.profile()?.full_name ?? '',
    });
    if (error) throw error;
  }
}
