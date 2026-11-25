import { Injectable, inject } from '@angular/core';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Geolocation } from '@capacitor/geolocation';
import imageCompression from 'browser-image-compression';
import { SupabaseService } from './supabase.service';

export interface LatLng {
  lat: number;
  lng: number;
}

@Injectable({ providedIn: 'root' })
export class MediaLocationService {
  private readonly sb = inject(SupabaseService).client;

  /** Cámara o galería (el selector nativo pregunta). El permiso se pide aquí, al pulsar el botón. */
  async pickPhoto(): Promise<File | null> {
    try {
      const photo = await Camera.getPhoto({
        quality: 85,
        resultType: CameraResultType.Uri,
        source: CameraSource.Prompt,
        promptLabelHeader: 'Foto de la mascota',
        promptLabelPhoto: 'Elegir de galería',
        promptLabelPicture: 'Tomar foto',
      });
      if (!photo.webPath) return null;
      const blob = await (await fetch(photo.webPath)).blob();
      return new File([blob], `photo.${photo.format || 'jpg'}`, { type: blob.type || 'image/jpeg' });
    } catch {
      return null; // usuario canceló o negó el permiso
    }
  }

  /** RNF-08: comprime antes de subir. */
  compress(file: File): Promise<File> {
    return imageCompression(file, { maxSizeMB: 0.4, maxWidthOrHeight: 1280, useWebWorker: true, fileType: 'image/jpeg' });
  }

  /** Comprime, sube a pet-photos/<userId>/<uuid>.jpg y devuelve la URL pública. */
  async uploadPhoto(file: File, userId: string, folder: 'reports' | 'sightings' = 'reports'): Promise<string> {
    const small = await this.compress(file);
    const path = folder === 'sightings' ? `sightings/${userId}/${crypto.randomUUID()}.jpg` : `${userId}/${crypto.randomUUID()}.jpg`;
    const { error } = await this.sb.storage.from('pet-photos').upload(path, small, {
      contentType: 'image/jpeg',
      cacheControl: '31536000',
    });
    if (error) throw error;
    return this.sb.storage.from('pet-photos').getPublicUrl(path).data.publicUrl;
  }

  /** Localidad aproximada desde OpenStreetMap (Nominatim). null si falla. */
  async reverseGeocode(p: LatLng): Promise<string | null> {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&zoom=16&accept-language=es&lat=${p.lat}&lon=${p.lng}`,
      );
      const a = (await res.json()).address ?? {};
      const zone = a.suburb ?? a.neighbourhood ?? a.city_district ?? a.quarter;
      const city = a.city ?? a.town ?? a.village ?? a.county;
      return [zone, city].filter(Boolean).join(', ') || null;
    } catch {
      return null;
    }
  }

  /** GPS actual. Devuelve null si se niega el permiso o no hay GPS (el UI usa el mini-mapa). */
  async getCurrentPosition(): Promise<LatLng | null> {
    try {
      const perm = await Geolocation.requestPermissions();
      if (perm.location === 'denied') return null;
      const pos = await Geolocation.getCurrentPosition({ enableHighAccuracy: true, timeout: 10000 });
      return { lat: pos.coords.latitude, lng: pos.coords.longitude };
    } catch {
      return null;
    }
  }
}
