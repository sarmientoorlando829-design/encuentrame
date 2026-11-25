import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import {
  IonBackButton, IonButton, IonButtons, IonContent, IonHeader, IonInput, IonInputPasswordToggle, IonSpinner, IonTitle, IonToast, IonToolbar,
} from '@ionic/angular';
import { AuthService } from '../../core/auth.service';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, RouterLink, IonHeader, IonToolbar, IonTitle, IonContent, IonInput, IonButton, IonToast, IonInputPasswordToggle,
    IonButtons, IonBackButton, IonSpinner],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start"><ion-back-button defaultHref="/explorar" /></ion-buttons>
        <ion-title>Iniciar sesión</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content class="ion-padding">
      <p>Inicia sesión para publicar y gestionar reportes.</p>
      <form [formGroup]="form" (ngSubmit)="submit()">
        <ion-input label="Correo electrónico" labelPlacement="floating" fill="outline" type="email"
          formControlName="email" autocomplete="email" class="ion-margin-bottom" />
        <ion-input label="Contraseña" labelPlacement="floating" fill="outline" type="password"
          formControlName="password" autocomplete="current-password" class="ion-margin-bottom">
          <ion-input-password-toggle slot="end" />
        </ion-input>
        <ion-button type="submit" expand="block" [disabled]="form.invalid || loading()">
          @if (loading()) { <ion-spinner name="dots" /> } @else { Entrar }
        </ion-button>
      </form>
      <ion-button fill="clear" expand="block" routerLink="/recuperar" size="small">¿Olvidaste tu contraseña?</ion-button>
      <ion-button fill="clear" expand="block" routerLink="/registro" [queryParams]="{ returnUrl: returnUrl }">
        ¿No tienes cuenta? Regístrate
      </ion-button>
      <ion-toast [isOpen]="toast() !== ''" [message]="toast()" [duration]="3500" color="danger" (didDismiss)="toast.set('')" />
    </ion-content>
  `,
})
export class LoginPage {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  readonly returnUrl = this.auth.safeReturnUrl(inject(ActivatedRoute).snapshot.queryParamMap.get('returnUrl'));

  readonly loading = signal(false);
  readonly toast = signal('');
  readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  async submit(): Promise<void> {
    if (this.form.invalid) return;
    this.loading.set(true);
    try {
      const { email, password } = this.form.getRawValue();
      await this.auth.signIn(email.trim(), password);
      await this.router.navigateByUrl(this.returnUrl, { replaceUrl: true }); // vuelve a donde iba
    } catch (e) {
      const msg = (e as Error).message ?? '';
      this.toast.set(
        msg.includes('Invalid login')
          ? 'Correo o contraseña incorrectos.'
          : msg.includes('not confirmed')
            ? 'Debes confirmar tu correo antes de entrar. Revisa tu bandeja (y spam).'
            : 'No se pudo iniciar sesión. Intenta de nuevo.',
      );
    } finally {
      this.loading.set(false);
    }
  }
}
