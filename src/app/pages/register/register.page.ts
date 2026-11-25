import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import {
  IonBackButton, IonButton, IonButtons, IonContent, IonHeader, IonInput, IonInputPasswordToggle, IonSpinner, IonTitle, IonToast, IonToolbar,
} from '@ionic/angular';
import { AuthService } from '../../core/auth.service';
import { PASSWORD_PATTERN, PasswordRulesComponent } from '../../shared/password-rules.component';
import { PHONE_PATTERN, cleanPhone } from '../../core/models';

@Component({
  selector: 'app-register',
  imports: [ReactiveFormsModule, RouterLink, IonHeader, IonToolbar, IonTitle, IonContent, IonInput, IonButton, IonToast, IonInputPasswordToggle, PasswordRulesComponent,
    IonButtons, IonBackButton, IonSpinner],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start"><ion-back-button defaultHref="/explorar" /></ion-buttons>
        <ion-title>Crear cuenta</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content class="ion-padding">
      <form [formGroup]="form" (ngSubmit)="submit()">
        <ion-input label="Nombre completo" labelPlacement="floating" fill="outline" formControlName="fullName"
          errorText="Escribe tu nombre completo (mín. 3 letras)" autocomplete="name" class="ion-margin-bottom" />
        <ion-input label="Correo electrónico" labelPlacement="floating" fill="outline" type="email"
          formControlName="email" errorText="Correo no válido" autocomplete="email" class="ion-margin-bottom" />
        <ion-input label="Teléfono (WhatsApp)" labelPlacement="floating" fill="outline" type="tel"
          formControlName="phone" placeholder="+573001234567" helperText="Solo lo verán usuarios registrados." errorText="7 a 20 dígitos, ej: +573001234567"
          autocomplete="tel" class="ion-margin-bottom" />
        <ion-input label="Contraseña" labelPlacement="floating" fill="outline" type="password"
          formControlName="password" autocomplete="new-password">
          <ion-input-password-toggle slot="end" />
        </ion-input>
        <app-password-rules [value]="form.controls.password.value" />
        <ion-button type="submit" expand="block" [disabled]="form.invalid || loading()">
          @if (loading()) { <ion-spinner name="dots" /> } @else { Registrarme }
        </ion-button>
      </form>
      <ion-button fill="clear" expand="block" routerLink="/login" [queryParams]="{ returnUrl: returnUrl }">
        ¿Ya tienes cuenta? Inicia sesión
      </ion-button>
      <ion-toast [isOpen]="toast() !== ''" [message]="toast()" [duration]="4000" [color]="toastColor()" (didDismiss)="toast.set('')" />
    </ion-content>
  `,
})
export class RegisterPage {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  readonly returnUrl = this.auth.safeReturnUrl(inject(ActivatedRoute).snapshot.queryParamMap.get('returnUrl'));

  readonly loading = signal(false);
  readonly toast = signal('');
  readonly toastColor = signal<'danger' | 'success'>('danger');
  readonly form = this.fb.nonNullable.group({
    fullName: ['', [Validators.required, Validators.minLength(3)]],
    email: ['', [Validators.required, Validators.email]],
    phone: ['', [Validators.required, Validators.pattern(PHONE_PATTERN)]],
    password: ['', [Validators.required, Validators.pattern(PASSWORD_PATTERN)]],
  });

  async submit(): Promise<void> {
    if (this.form.invalid) return;
    this.loading.set(true);
    try {
      const v = this.form.getRawValue();
      const hasSession = await this.auth.signUp({ ...v, fullName: v.fullName.trim(), email: v.email.trim(), phone: cleanPhone(v.phone) });
      if (hasSession) {
        await this.router.navigateByUrl(this.returnUrl, { replaceUrl: true });
      } else {
        // Proyecto con confirmación de correo activada
        this.toastColor.set('success');
        this.toast.set('Cuenta creada. Confirma tu correo e inicia sesión.');
        await this.router.navigate(['/login'], { queryParams: { returnUrl: this.returnUrl } });
      }
    } catch (e) {
      const msg = (e as Error).message ?? '';
      this.toastColor.set('danger');
      this.toast.set(msg.includes('already registered') ? 'Ese correo ya tiene una cuenta.' : 'No se pudo crear la cuenta.');
    } finally {
      this.loading.set(false);
    }
  }
}
