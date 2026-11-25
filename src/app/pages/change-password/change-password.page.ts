import { Component, inject, signal } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import {
  IonBackButton, IonButton, IonButtons, IonContent, IonHeader, IonInput, IonInputPasswordToggle, IonSpinner, IonTitle,
  IonToast, IonToolbar,
} from '@ionic/angular';
import { AuthService } from '../../core/auth.service';
import { PASSWORD_PATTERN, PasswordRulesComponent } from '../../shared/password-rules.component';

const sameAsNew = (g: AbstractControl): ValidationErrors | null =>
  g.get('newPassword')?.value === g.get('confirm')?.value ? null : { mismatch: true };

@Component({
  selector: 'app-change-password',
  imports: [ReactiveFormsModule, PasswordRulesComponent, IonHeader, IonToolbar, IonTitle, IonContent, IonInput,
    IonInputPasswordToggle, IonButton, IonToast, IonButtons, IonBackButton, IonSpinner],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start"><ion-back-button defaultHref="/explorar" /></ion-buttons>
        <ion-title>Cambiar contraseña</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content class="ion-padding">
      <form [formGroup]="form" (ngSubmit)="submit()">
        <ion-input label="Contraseña actual" labelPlacement="floating" fill="outline" type="password"
          formControlName="current" autocomplete="current-password" class="ion-margin-bottom">
          <ion-input-password-toggle slot="end" />
        </ion-input>
        <ion-input label="Nueva contraseña" labelPlacement="floating" fill="outline" type="password"
          formControlName="newPassword" autocomplete="new-password">
          <ion-input-password-toggle slot="end" />
        </ion-input>
        <app-password-rules [value]="form.controls.newPassword.value" />
        <ion-input label="Repite la nueva contraseña" labelPlacement="floating" fill="outline" type="password"
          formControlName="confirm" autocomplete="new-password" class="ion-margin-bottom">
          <ion-input-password-toggle slot="end" />
        </ion-input>
        @if (form.hasError('mismatch') && form.controls.confirm.dirty) {
          <p class="err">Las contraseñas no coinciden.</p>
        }
        <ion-button type="submit" expand="block" [disabled]="form.invalid || saving()">
          @if (saving()) { <ion-spinner name="dots" /> } @else { Cambiar contraseña }
        </ion-button>
      </form>
      <ion-toast [isOpen]="toast() !== ''" [message]="toast()" [duration]="3500" [color]="toastColor()" (didDismiss)="toast.set('')" />
    </ion-content>
  `,
  styles: [`.err { color: var(--ion-color-danger); font-size: 13px; margin: 0 4px 12px; }`],
})
export class ChangePasswordPage {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  readonly saving = signal(false);
  readonly toast = signal('');
  readonly toastColor = signal<'success' | 'danger'>('danger');
  readonly form = inject(FormBuilder).nonNullable.group(
    {
      current: ['', Validators.required],
      newPassword: ['', [Validators.required, Validators.pattern(PASSWORD_PATTERN)]],
      confirm: ['', Validators.required],
    },
    { validators: sameAsNew },
  );

  async submit(): Promise<void> {
    if (this.form.invalid) return;
    this.saving.set(true);
    try {
      const { current, newPassword } = this.form.getRawValue();
      await this.auth.changePassword(current, newPassword);
      this.toastColor.set('success');
      this.toast.set('Contraseña actualizada');
      setTimeout(() => void this.router.navigateByUrl('/explorar', { replaceUrl: true }), 1200);
    } catch (e) {
      const msg = (e as Error).message ?? '';
      this.toastColor.set('danger');
      this.toast.set(
        msg === 'WRONG_CURRENT' ? 'La contraseña actual no es correcta.'
        : msg.includes('different from the old') ? 'La nueva contraseña debe ser distinta a la actual.'
        : `No se pudo cambiar: ${msg}`,
      );
    } finally {
      this.saving.set(false);
    }
  }
}
