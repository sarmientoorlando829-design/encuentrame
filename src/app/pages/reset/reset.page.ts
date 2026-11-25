import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { IonButton, IonContent, IonHeader, IonInput, IonInputPasswordToggle, IonSpinner, IonTitle, IonToast, IonToolbar } from '@ionic/angular';
import { AuthService } from '../../core/auth.service';
import { PASSWORD_PATTERN, PasswordRulesComponent } from '../../shared/password-rules.component';

/** Destino del enlace del correo de recuperación (Supabase deja una sesión temporal). */
@Component({
  selector: 'app-reset',
  imports: [ReactiveFormsModule, RouterLink, IonHeader, IonToolbar, IonTitle, IonContent, IonInput, IonInputPasswordToggle, PasswordRulesComponent, IonButton, IonToast, IonSpinner],
  template: `
    <ion-header><ion-toolbar><ion-title>Nueva contraseña</ion-title></ion-toolbar></ion-header>
    <ion-content class="ion-padding">
      @if (auth.isAuthenticated()) {
        <form [formGroup]="form" (ngSubmit)="submit()">
          <ion-input label="Nueva contraseña" labelPlacement="floating" fill="outline" type="password"
            formControlName="password" autocomplete="new-password">
            <ion-input-password-toggle slot="end" />
          </ion-input>
          <app-password-rules [value]="form.controls.password.value" />
          <ion-button type="submit" expand="block" [disabled]="form.invalid || loading()">
            @if (loading()) { <ion-spinner name="dots" /> } @else { Guardar contraseña }
          </ion-button>
        </form>
      } @else {
        <p>Este enlace no es válido o ya expiró.</p>
        <ion-button routerLink="/recuperar">Solicitar otro enlace</ion-button>
      }
      <ion-toast [isOpen]="toast() !== ''" [message]="toast()" [duration]="4000" color="danger" (didDismiss)="toast.set('')" />
    </ion-content>
  `,
})
export class ResetPage {
  readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  readonly form = inject(FormBuilder).nonNullable.group({ password: ['', [Validators.required, Validators.pattern(PASSWORD_PATTERN)]] });
  readonly loading = signal(false);
  readonly toast = signal('');

  async submit(): Promise<void> {
    if (this.form.invalid) return;
    this.loading.set(true);
    try {
      await this.auth.updatePassword(this.form.controls.password.value);
      await this.router.navigateByUrl('/explorar', { replaceUrl: true });
    } catch (e) {
      this.toast.set(`No se pudo cambiar la contraseña: ${(e as Error).message}`);
    } finally {
      this.loading.set(false);
    }
  }
}
