import { DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import {
  IonBackButton, IonBadge, IonButton, IonButtons, IonContent, IonHeader, IonIcon, IonSpinner, IonTitle, IonToolbar,
  ModalController, ToastController,
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import { callOutline, createOutline, logoWhatsapp, shareSocialOutline, trashOutline } from 'ionicons/icons';
import { AuthService } from '../../core/auth.service';
import { Report, STATUS_LABEL, Sighting, toWhatsappNumber } from '../../core/models';
import { ReportActionsService } from '../../core/report-actions.service';
import { ReportsService } from '../../core/reports.service';
import { ShareService } from '../../core/share.service';
import { SightingsService } from '../../core/sightings.service';
import { AddSightingModal } from '../../shared/add-sighting.modal';
import { AppIconComponent, IconName } from '../../shared/app-icon.component';
import { MiniMapComponent } from '../../shared/mini-map.component';
import { typeIcon } from '../../shared/pet-data';

@Component({
  selector: 'app-report-detail',
  imports: [AppIconComponent, DatePipe, MiniMapComponent, IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonBackButton, IonBadge,
    IonButton, IonIcon, IonSpinner],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start"><ion-back-button defaultHref="/explorar" /></ion-buttons>
        <ion-title>Detalle</ion-title>
        <ion-buttons slot="end">
          @if (report()) {
            <ion-button (click)="share()" aria-label="Compartir"><ion-icon slot="icon-only" name="share-social-outline" /></ion-button>
          }
        </ion-buttons>
      </ion-toolbar>
    </ion-header>
    <ion-content>
      @if (loading()) { <div class="center"><ion-spinner /></div> }
      @else if (report(); as r) {
        @if (r.photo_url) { <img [src]="r.photo_url" class="hero" [alt]="r.name ?? r.animal_type" /> }
        <div class="body">
          <ion-badge [color]="badgeColor(r)">{{ label(r) }}</ion-badge>
          <h1 class="title"><app-icon [name]="icon(r)" [size]="28" /> {{ r.name || r.animal_type }}</h1>
          <div class="facts">
            <span>{{ r.animal_type }}</span>
            @if (r.breed) { <span>{{ r.breed }}</span> }
            <span>{{ r.color }}</span>
            @if (r.size) { <span>{{ r.size }}</span> }
          </div>
          <p class="meta"><app-icon name="pin" [size]="16" /> {{ r.city }} &nbsp;·&nbsp; <app-icon name="calendar" [size]="16" /> {{ r.lost_date | date: 'dd/MM/yyyy' }}</p>
          @if (r.description) { <p>{{ r.description }}</p> }

          <h2>Dónde fue</h2>
          <app-mini-map [lat]="r.lat" [lng]="r.lng" [status]="r.status" />

          <!-- Contacto protegido (RNF-07) -->
          <h2>Contacto</h2>
          @if (auth.isAuthenticated()) {
            <p><strong>{{ r.contact_name }}</strong>@if (phone()) { · {{ phone() }} }</p>
            @if (phone(); as p) {
              <div class="row">
                <ion-button color="success" [href]="waLink(r, p)" target="_blank" rel="noopener">
                  <ion-icon slot="start" name="logo-whatsapp" />WhatsApp
                </ion-button>
                <ion-button fill="outline" [href]="'tel:+' + wa(p)"><ion-icon slot="start" name="call-outline" />Llamar</ion-button>
              </div>
            }
          } @else {
            <div class="locked">
              <app-icon name="lock" [size]="16" /> Inicia sesión para ver el teléfono y contactar al dueño.
              <ion-button expand="block" class="ion-margin-top" (click)="login()">Iniciar sesión o registrarme</ion-button>
            </div>
          }

          <!-- Acciones del autor (RF-06) -->
          @if (isOwner()) {
            <h2>Mi reporte</h2>
            <div class="row">
              <ion-button fill="outline" (click)="edit(r)"><ion-icon slot="start" name="create-outline" />Editar</ion-button>
              @if (r.status !== 'resuelta') {
                <ion-button color="success" (click)="resolve(r)"><app-icon slot="start" name="house" [size]="18" />Ya volvió a casa</ion-button>
              }
              <ion-button fill="outline" color="danger" (click)="remove(r)"><ion-icon slot="start" name="trash-outline" />Eliminar</ion-button>
            </div>
          }

          <!-- Avistamientos (RF-05) -->
          <h2>Avistamientos ({{ sightings().length }})</h2>
          <ion-button expand="block" (click)="addSighting()"><app-icon slot="start" name="eye" [size]="18" />Reportar avistamiento</ion-button>
          @for (s of sightings(); track s.id) {
            <div class="sighting">
              <div class="sh"><strong>{{ s.author_name || 'Usuario' }}</strong><span>{{ s.created_at | date: 'dd/MM/yyyy HH:mm' }}</span></div>
              <p>{{ s.comment }}</p>
              @if (s.photo_url) { <img [src]="s.photo_url" alt="Foto del avistamiento" /> }
              @if (s.lat !== null && s.lng !== null) {
                <a [href]="'https://www.openstreetmap.org/?mlat=' + s.lat + '&mlon=' + s.lng + '#map=17/' + s.lat + '/' + s.lng"
                  target="_blank" rel="noopener"><app-icon name="pin" [size]="14" /> Ver ubicación del avistamiento</a>
              }
            </div>
          } @empty {
            <p class="meta">Aún no hay avistamientos. ¿Lo viste? Cuéntanos.</p>
          }
        </div>
      } @else { <p class="ion-padding">No encontramos este reporte.</p> }
    </ion-content>
  `,
  styles: [`
    .center { display: flex; justify-content: center; padding: 40px; }
    .hero { width: 100%; max-height: 340px; object-fit: cover; display: block; }
    .body { padding: 16px 16px 40px; }
    h1 { margin: 8px 0; } .title { display: flex; align-items: center; gap: 8px; } h2 { margin: 24px 0 8px; font-size: 18px; }
    .facts { display: flex; flex-wrap: wrap; gap: 6px; }
    .facts span { padding: 4px 12px; border-radius: 14px; background: var(--ion-color-step-100, #eee); font-size: 13px; }
    .meta { color: var(--ion-color-medium); }
    .row { display: flex; flex-wrap: wrap; gap: 8px; }
    .locked { padding: 14px; border-radius: 12px; border: 1px dashed var(--ion-color-medium); }
    .sighting { margin-top: 12px; padding: 12px; border-radius: 12px; background: var(--ion-color-step-50, #f5f5f5); }
    .sighting .sh { display: flex; justify-content: space-between; font-size: 13px; }
    .sighting .sh span { color: var(--ion-color-medium); }
    .sighting p { margin: 6px 0; }
    .sighting img { width: 100%; max-height: 220px; object-fit: cover; border-radius: 10px; }
  `],
})
export class ReportDetailPage {
  readonly auth = inject(AuthService);
  private readonly reports = inject(ReportsService);
  private readonly sightingsApi = inject(SightingsService);
  private readonly shareApi = inject(ShareService);
  private readonly actions = inject(ReportActionsService);
  private readonly modals = inject(ModalController);
  private readonly toasts = inject(ToastController);
  private readonly router = inject(Router);
  private readonly id = inject(ActivatedRoute).snapshot.paramMap.get('id')!;

  readonly report = signal<Report | null>(null);
  readonly phone = signal<string | null>(null);
  readonly sightings = signal<Sighting[]>([]);
  readonly loading = signal(true);
  readonly isOwner = computed(() => !!this.report() && this.report()!.user_id === this.auth.currentUser()?.id);

  readonly wa = toWhatsappNumber;
  readonly icon = (r: Report): IconName => typeIcon(r.animal_type);
  readonly label = (r: Report): string => STATUS_LABEL[r.status];
  readonly badgeColor = (r: Report): string => (r.status === 'perdida' ? 'danger' : r.status === 'encontrada' ? 'warning' : 'success');

  constructor() {
    addIcons({ callOutline, createOutline, logoWhatsapp, shareSocialOutline, trashOutline });
  }

  ionViewWillEnter(): void {
    void this.load();
  }

  async load(): Promise<void> {
    try {
      await this.auth.initialized;
      // Los avistamientos y el teléfono son secundarios: si fallan, el reporte igual se muestra
      const [r, s, p] = await Promise.all([
        this.reports.getById(this.id),
        this.sightingsApi.list(this.id).catch((e) => {
          console.error('No se pudieron cargar los avistamientos', e);
          return [] as Sighting[];
        }),
        this.reports.getContactPhone(this.id).catch(() => null), // null sin sesión (RLS)
      ]);
      this.report.set(r);
      this.sightings.set(s);
      this.phone.set(p);
    } finally {
      this.loading.set(false);
    }
  }

  waLink(r: Report, phone: string): string {
    const msg = `Hola ${r.contact_name}, vi el reporte de ${r.name || r.animal_type} en Encuéntrame App y tengo información...`;
    return `https://wa.me/${toWhatsappNumber(phone)}?text=${encodeURIComponent(msg)}`;
  }

  login(): void {
    this.auth.goToLogin(`/reporte/${this.id}`);
  }

  async addSighting(): Promise<void> {
    if (!this.auth.isAuthenticated()) return this.login();
    const modal = await this.modals.create({ component: AddSightingModal, componentProps: { reportId: this.id } });
    await modal.present();
    const { role } = await modal.onWillDismiss();
    if (role === 'saved') {
      this.sightings.set(await this.sightingsApi.list(this.id));
      await (await this.toasts.create({ message: '¡Gracias por avisar! Avistamiento publicado.', color: 'success', duration: 3000 })).present();
    }
  }

  async share(): Promise<void> {
    const r = this.report();
    if (!r) return;
    if ((await this.shareApi.shareReport(r)) === 'copied') {
      await (await this.toasts.create({ message: 'Resumen copiado. Pégalo donde quieras.', duration: 2500 })).present();
    }
  }

  edit(r: Report): void {
    void this.router.navigate(['/reporte', r.id, 'editar']);
  }

  async resolve(r: Report): Promise<void> {
    if (await this.actions.markResolved(r)) await this.load();
  }

  async remove(r: Report): Promise<void> {
    if (await this.actions.confirmDelete(r)) await this.router.navigateByUrl('/explorar', { replaceUrl: true });
  }
}
