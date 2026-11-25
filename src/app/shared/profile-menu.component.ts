import { Component, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AlertController, IonChip, IonIcon, IonItem, IonLabel, IonList, IonPopover } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { keyOutline, logOutOutline, personOutline } from 'ionicons/icons';
import { AuthService } from '../core/auth.service';

/** Cápsula con el nombre del usuario que abre un menú: Mi perfil · Cambiar contraseña · Cerrar sesión. */
@Component({
  selector: 'app-profile-menu',
  imports: [IonChip, IonLabel, IonPopover, IonList, IonItem, IonIcon],
  template: `
    <ion-chip id="profile-chip" color="primary" aria-label="Menú de perfil">
      <span class="avatar">{{ initial() }}</span>
      <ion-label>{{ firstName() }}</ion-label>
    </ion-chip>
    <ion-popover trigger="profile-chip" triggerAction="click" dismissOnSelect="true" side="bottom" alignment="end">
      <ng-template>
        <ion-list lines="none">
          <ion-item button detail="false" (click)="go('/perfil')">
            <ion-icon slot="start" name="person-outline" /><ion-label>Mi perfil</ion-label>
          </ion-item>
          <ion-item button detail="false" (click)="go('/cambiar-contrasena')">
            <ion-icon slot="start" name="key-outline" /><ion-label>Cambiar contraseña</ion-label>
          </ion-item>
          <ion-item button detail="false" (click)="confirmLogout()">
            <ion-icon slot="start" name="log-out-outline" color="danger" /><ion-label color="danger">Cerrar sesión</ion-label>
          </ion-item>
        </ion-list>
      </ng-template>
    </ion-popover>
  `,
  styles: [`
    .avatar { width: 24px; height: 24px; border-radius: 50%; background: var(--ion-color-primary); color: #fff;
      display: inline-flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 600; margin-right: 6px; }
  `],
})
export class ProfileMenuComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly alerts = inject(AlertController);

  readonly displayName = computed(
    () => this.auth.profile()?.full_name || this.auth.currentUser()?.email?.split('@')[0] || 'Mi cuenta',
  );
  readonly firstName = computed(() => this.displayName().split(' ')[0]);
  readonly initial = computed(() => this.displayName().charAt(0).toUpperCase());

  constructor() {
    addIcons({ personOutline, keyOutline, logOutOutline });
  }

  go(url: string): void {
    void this.router.navigateByUrl(url);
  }

  async confirmLogout(): Promise<void> {
    const alert = await this.alerts.create({
      header: 'Cerrar sesión',
      message: '¿Seguro que quieres salir?',
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Cerrar sesión',
          role: 'destructive',
          handler: async () => {
            await this.auth.signOut();
            await this.router.navigateByUrl('/explorar', { replaceUrl: true });
          },
        },
      ],
    });
    await alert.present();
  }
}
