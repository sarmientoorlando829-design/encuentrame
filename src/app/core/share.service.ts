import { Injectable } from '@angular/core';
import { Share } from '@capacitor/share';
import { Report } from './models';

@Injectable({ providedIn: 'root' })
export class ShareService {
  osmLink(r: Pick<Report, 'lat' | 'lng'>): string {
    return `https://www.openstreetmap.org/?mlat=${r.lat}&mlon=${r.lng}#map=17/${r.lat}/${r.lng}`;
  }

  text(r: Report): string {
    const head = r.status === 'perdida' ? 'SE BUSCA' : r.status === 'encontrada' ? 'ENCONTRADO, BUSCA DUEÑO' : 'YA VOLVIÓ A CASA';
    const who = [r.name, r.animal_type, r.breed].filter(Boolean).join(' · ');
    return [
      head,
      who,
      `Color: ${r.color}`,
      `Zona: ${r.city}`,
      `Fecha: ${r.lost_date}`,
      `Ubicación: ${this.osmLink(r)}`,
      r.photo_url ? `Foto: ${r.photo_url}` : '',
      '— Encuéntrame App, ayudamos a tus peluditos a volver a su hogar',
    ].filter(Boolean).join('\n');
  }

  /** @returns 'shared' | 'copied' (sin menú nativo, se copia al portapapeles) | 'cancelled' */
  async shareReport(r: Report): Promise<'shared' | 'copied' | 'cancelled'> {
    const text = this.text(r);
    try {
      if ((await Share.canShare()).value) {
        await Share.share({ title: `Se busca: ${r.name || r.animal_type}`, text, dialogTitle: 'Compartir reporte' });
        return 'shared';
      }
      await navigator.clipboard.writeText(text);
      return 'copied';
    } catch {
      return 'cancelled';
    }
  }
}
