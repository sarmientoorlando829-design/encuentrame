import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  IonBackButton, IonButton, IonButtons, IonContent, IonHeader, IonInput, IonSpinner, IonTitle, IonToast, IonToolbar,
} from '@ionic/angular';
import { AuthService } from '../../core/auth.service';

@Component({
  selector: 'app-recover',
  imports: [ReactiveFormsModule, IonHeader, IonToolbar, IonTitle, IonContent, IonInput, IonButton, IonToast, IonButtons,
    IonBackButton, IonSpinner],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start"><ion-back-button defaultHref="/login" /></ion-buttons>
        <ion-title>Recuperar contraseña</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content class="ion-padding">
      @if (sent()) {
        <h2>Revisa tu correo 📬</h2>
        <p>Si <strong>{{ form.controls.email.value }}</strong> tiene una cuenta, te enviamos un enlace para crear una nueva contraseña.
          Revisa también la carpeta de spam.</p>
      } @else {
        <p>Escribe tu correo y te enviaremos un enlace para restablecer tu contraseña.</p>
        <form [formGroup]="form" (ngSubmit)="submit()">
          <ion-input label="Correo electrónico" labelPlacement="floating" fill="outline" type="email"
            formControlName="email" class="ion-margin-bottom" />
          <ion-button type="submit" expand="block" [disabled]="form.invalid || loading()">
            @if (loading()) { <ion-spinner name="dots" /> } @else { Enviar enlace }
          </ion-button>
        </form>
      }
      <ion-toast [isOpen]="toast() !== ''" [message]="toast()" [duration]="4000" color="danger" (didDismiss)="toast.set('')" />
    </ion-content>
  `,
})
export class RecoverPage {
  private readonly auth = inject(AuthService);
  readonly form = inject(FormBuilder).nonNullable.group({ email: ['', [Validators.required, Validators.email]] });
  readonly loading = signal(false);
  readonly sent = signal(false);
  readonly toast = signal('');

  async submit(): Promise<void> {
    if (this.form.invalid) return;
    this.loading.set(true);
    try {
      await this.auth.sendPasswordReset(this.form.controls.email.value.trim());
      this.sent.set(true);
    } catch (e) {
      const msg = (e as Error).message ?? '';
      this.toast.set(
        msg.includes('rate limit')
          ? 'Se enviaron demasiados correos. Espera un rato e intenta de nuevo.'
          : `No se pudo enviar el correo: ${msg}`,
      );
    } finally {
      this.loading.set(false);
    }
  }
}
