import { Injectable, inject } from '@angular/core';
import { AlertController, ToastController } from '@ionic/angular';
import { Report } from './models';
import { ReportsService } from './reports.service';

/** Acciones del autor con confirmación (las usan el detalle y Mi perfil). */
@Injectable({ providedIn: 'root' })
export class ReportActionsService {
  private readonly reports = inject(ReportsService);
  private readonly alerts = inject(AlertController);
  private readonly toasts = inject(ToastController);

  private confirm(header: string, message: string, ok: string, destructive = false): Promise<boolean> {
    return new Promise(async (resolve) => {
      const a = await this.alerts.create({
        header,
        message,
        buttons: [
          { text: 'Cancelar', role: 'cancel', handler: () => resolve(false) },
          { text: ok, role: destructive ? 'destructive' : 'confirm', handler: () => resolve(true) },
        ],
        backdropDismiss: false,
      });
      await a.present();
    });
  }

  private async toast(message: string, color: 'success' | 'danger' = 'success'): Promise<void> {
    await (await this.toasts.create({ message, color, duration: 3000 })).present();
  }

  /** @returns true si cambió el reporte */
  async markResolved(r: Report): Promise<boolean> {
    const ok = await this.confirm('¡Qué alegría!', 'Se marcará como "ya volvió a casa" y dejará de aparecer como activo en el mapa.', 'Sí, ya volvió');
    if (!ok) return false;
    try {
      await this.reports.setStatus(r.id, 'resuelta');
      await this.toast('Reporte cerrado. ¡Gracias por avisar!');
      return true;
    } catch (e) {
      await this.toast(`No se pudo actualizar: ${(e as Error).message}`, 'danger');
      return false;
    }
  }

  async confirmDelete(r: Report): Promise<boolean> {
    const ok = await this.confirm('Eliminar reporte', 'Se borrará el reporte y sus avistamientos. Esta acción no se puede deshacer.', 'Eliminar', true);
    if (!ok) return false;
    try {
      await this.reports.remove(r);
      await this.toast('Reporte eliminado');
      return true;
    } catch (e) {
      await this.toast(`No se pudo eliminar: ${(e as Error).message}`, 'danger');
      return false;
    }
  }
}
