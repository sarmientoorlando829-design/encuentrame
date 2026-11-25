import { DatePipe } from '@angular/common';
import { Component, computed, effect, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import {
  IonBackButton, IonButton, IonButtons, IonContent, IonHeader, IonInput, IonItem, IonLabel, IonList, IonSpinner,
  IonTitle, IonToast, IonToolbar, IonBadge,
} from '@ionic/angular';
import { AuthService } from '../../core/auth.service';
import { PHONE_PATTERN, Report, STATUS_LABEL, cleanPhone } from '../../core/models';
import { ReportActionsService } from '../../core/report-actions.service';
import { ReportsService } from '../../core/reports.service';

@Component({
  selector: 'app-profile',
  imports: [ReactiveFormsModule, DatePipe, IonBadge, IonHeader, IonToolbar, IonTitle, IonContent, IonInput, IonButton, IonToast, IonButtons,
    IonBackButton, IonSpinner, IonList, IonItem, IonLabel],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start"><ion-back-button defaultHref="/explorar" /></ion-buttons>
        <ion-title>Mi perfil</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content class="ion-padding">
      @if (!editing()) {
        <ion-list lines="full">
          <ion-item><ion-label><p>Nombre completo</p><h3>{{ auth.profile()?.full_name || '—' }}</h3></ion-label></ion-item>
          <ion-item><ion-label><p>Correo electrónico</p><h3>{{ auth.currentUser()?.email }}</h3></ion-label></ion-item>
          <ion-item><ion-label><p>Teléfono (WhatsApp)</p><h3>{{ auth.profile()?.phone || '—' }}</h3></ion-label></ion-item>
        </ion-list>
        <ion-button expand="block" class="ion-margin-top" (click)="startEdit()">Editar información</ion-button>

        <div class="counters">
          <div><strong>{{ activeCount() }}</strong><span>Activos</span></div>
          <div><strong>{{ resolvedCount() }}</strong><span>Ya volvieron</span></div>
        </div>
        <h2>Mis reportes publicados</h2>
        @for (r of mine(); track r.id) {
          <div class="mine">
            <div class="top" (click)="open(r)">
              <img [src]="r.photo_url ?? 'assets/icon/favicon.png'" alt="" />
              <div class="info">
                <strong>{{ r.name || r.animal_type }}</strong>
                <span>{{ r.city }} · {{ r.lost_date | date: 'dd/MM/yyyy' }}</span>
                <ion-badge [color]="r.status === 'perdida' ? 'danger' : r.status === 'encontrada' ? 'warning' : 'success'">{{ label(r) }}</ion-badge>
              </div>
            </div>
            <div class="acts">
              <ion-button size="small" fill="outline" (click)="edit(r)">Editar</ion-button>
              @if (r.status !== 'resuelta') { <ion-button size="small" color="success" (click)="resolve(r)">Ya volvió</ion-button> }
              <ion-button size="small" fill="outline" color="danger" (click)="remove(r)">Eliminar</ion-button>
            </div>
          </div>
        } @empty {
          <p class="empty">Aún no has publicado reportes.</p>
        }
      } @else {
        <form [formGroup]="form" (ngSubmit)="save()">
          <ion-input label="Correo electrónico" labelPlacement="floating" fill="outline" [value]="auth.currentUser()?.email"
            [readonly]="true" helperText="El correo no se puede cambiar." class="ion-margin-bottom" />
          <ion-input label="Nombre completo" labelPlacement="floating" fill="outline" formControlName="fullName"
            errorText="Mínimo 3 caracteres" class="ion-margin-bottom" />
          <ion-input label="Teléfono (WhatsApp)" labelPlacement="floating" fill="outline" type="tel" formControlName="phone"
            errorText="7 a 20 dígitos, ej: +573001234567" class="ion-margin-bottom" />
          <ion-button type="submit" expand="block" [disabled]="form.invalid || form.pristine || saving()">
            @if (saving()) { <ion-spinner name="dots" /> } @else { Guardar cambios }
          </ion-button>
          <ion-button expand="block" fill="clear" (click)="editing.set(false)">Cancelar</ion-button>
        </form>
      }
      <ion-toast [isOpen]="toast() !== ''" [message]="toast()" [duration]="3500" [color]="toastColor()" (didDismiss)="toast.set('')" />
    </ion-content>
  `,
  styles: [`
    .counters { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin: 20px 0 4px; }
    .counters div { text-align: center; padding: 12px; border-radius: 12px; background: var(--ion-color-step-100, #eee); }
    .counters strong { display: block; font-size: 26px; } .counters span { font-size: 12px; color: var(--ion-color-medium); }
    h2 { font-size: 18px; margin: 20px 0 8px; }
    .mine { padding: 10px; border-radius: 12px; border: 1px solid var(--ion-color-step-150, #ddd); margin-bottom: 10px; }
    .mine .top { display: flex; gap: 12px; cursor: pointer; }
    .mine img { width: 64px; height: 64px; object-fit: cover; border-radius: 10px; }
    .mine .info { display: flex; flex-direction: column; gap: 2px; font-size: 13px; align-items: flex-start; }
    .acts { display: flex; flex-wrap: wrap; gap: 4px; margin-top: 6px; }
    .empty { color: var(--ion-color-medium); }
  `],
})
export class ProfilePage {
  readonly auth = inject(AuthService);
  private readonly reportsApi = inject(ReportsService);
  private readonly actions = inject(ReportActionsService);
  private readonly router = inject(Router);
  readonly mine = signal<Report[]>([]);
  readonly activeCount = computed(() => this.mine().filter((r) => r.status !== 'resuelta').length);
  readonly resolvedCount = computed(() => this.mine().filter((r) => r.status === 'resuelta').length);
  readonly label = (r: Report): string => STATUS_LABEL[r.status];
  readonly editing = signal(false);
  readonly saving = signal(false);
  readonly toast = signal('');
  readonly toastColor = signal<'success' | 'danger'>('success');
  readonly form = inject(FormBuilder).nonNullable.group({
    fullName: ['', [Validators.required, Validators.minLength(3)]],
    phone: ['', [Validators.required, Validators.pattern(PHONE_PATTERN)]],
  });

  constructor() {
    effect(() => {
      // Si el perfil llega tarde, no pisa lo que el usuario esté editando
      const p = this.auth.profile();
      if (p && !this.editing()) this.form.reset({ fullName: p.full_name, phone: p.phone });
    });
  }

  ionViewWillEnter(): void {
    void this.loadMine();
  }

  async loadMine(): Promise<void> {
    await this.auth.initialized;
    const id = this.auth.currentUser()?.id;
    if (id) this.mine.set(await this.reportsApi.listMine(id).catch(() => []));
  }

  open(r: Report): void {
    void this.router.navigate(['/reporte', r.id]);
  }

  edit(r: Report): void {
    void this.router.navigate(['/reporte', r.id, 'editar']);
  }

  async resolve(r: Report): Promise<void> {
    if (await this.actions.markResolved(r)) await this.loadMine();
  }

  async remove(r: Report): Promise<void> {
    if (await this.actions.confirmDelete(r)) await this.loadMine();
  }

  startEdit(): void {
    const p = this.auth.profile();
    this.form.reset({ fullName: p?.full_name ?? '', phone: p?.phone ?? '' });
    this.editing.set(true);
  }

  async save(): Promise<void> {
    if (this.form.invalid) return;
    this.saving.set(true);
    try {
      const v = this.form.getRawValue();
      await this.auth.updateProfile(v.fullName.trim(), cleanPhone(v.phone));
      this.toastColor.set('success');
      this.toast.set('Perfil actualizado');
      this.editing.set(false);
    } catch (e) {
      this.toastColor.set('danger');
      this.toast.set(`No se pudo guardar: ${(e as Error).message}`);
    } finally {
      this.saving.set(false);
    }
  }
}
