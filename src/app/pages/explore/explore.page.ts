import { DatePipe } from '@angular/common';
import { Component, computed, inject, signal, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import {
  IonBadge, IonButton, IonButtons, IonContent, IonFab, IonFabButton, IonHeader, IonIcon, IonInput, IonLabel, IonModal,
  IonRefresher, IonRefresherContent, IonSegment, IonSegmentButton, IonSelect, IonSelectOption, IonSpinner, IonTitle,
  IonToolbar,
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import { add, funnelOutline, logInOutline, logOutOutline, wifiOutline } from 'ionicons/icons';
import { AuthService } from '../../core/auth.service';
import { EMPTY_FILTERS, MapBounds, Report, ReportFilters } from '../../core/models';
import { NetworkService } from '../../core/network.service';
import { ReportsService } from '../../core/reports.service';
import { ProfileMenuComponent } from '../../shared/profile-menu.component';
import { ReportCardComponent } from '../../shared/report-card.component';
import { ReportMapComponent } from '../../shared/report-map.component';

@Component({
  selector: 'app-explore',
  imports: [FormsModule, DatePipe, RouterLink, ReportMapComponent, ReportCardComponent, ProfileMenuComponent, IonHeader, IonToolbar, IonTitle,
    IonContent, IonButtons, IonButton, IonIcon, IonSegment, IonSegmentButton, IonLabel, IonFab, IonFabButton, IonModal,
    IonInput, IonSelect, IonSelectOption, IonBadge, IonSpinner, IonRefresher, IonRefresherContent],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-title>Encuéntrame</ion-title>
        <ion-buttons slot="end">
          <ion-button (click)="openFilters()" aria-label="Filtros">
            <ion-icon slot="icon-only" name="funnel-outline" />
            @if (activeFilterCount() > 0) { <ion-badge color="danger">{{ activeFilterCount() }}</ion-badge> }
          </ion-button>
          @if (auth.isAuthenticated()) {
            <app-profile-menu />
          } @else {
            <ion-button routerLink="/login" aria-label="Iniciar sesión"><ion-icon slot="icon-only" name="log-in-outline" /></ion-button>
          }
        </ion-buttons>
      </ion-toolbar>
      <ion-toolbar>
        <ion-segment [value]="view()" (ionChange)="setView($any($event.detail.value))">
          <ion-segment-button value="map"><ion-label>Mapa</ion-label></ion-segment-button>
          <ion-segment-button value="list"><ion-label>Lista</ion-label></ion-segment-button>
        </ion-segment>
      </ion-toolbar>
    </ion-header>

    <ion-content [scrollY]="view() === 'list'">
      @if (!network.online()) {
        <div class="state">
          <ion-icon name="wifi-outline" size="large" />
          <h2>Sin conexión</h2>
          <p>Necesitas internet para ver los reportes.</p>
          <ion-button (click)="retry()">Reintentar</ion-button>
        </div>
      } @else if (error()) {
        <div class="state">
          <h2>No pudimos cargar los reportes</h2>
          <ion-button (click)="retry()">Reintentar</ion-button>
        </div>
      } @else {
        <!-- Mapa (siempre montado para no perder posición al alternar) -->
        <div class="map-wrap" [class.hidden]="view() !== 'map'">
          <app-report-map [reports]="reports()" (boundsChange)="onBounds($event)" (select)="selected.set($event)" />
          @if (loading()) { <ion-spinner class="map-spinner" name="dots" /> }
          @if (selected(); as r) {
            <div class="summary" (click)="open(r)">
              <img [src]="r.photo_url ?? 'assets/icon/favicon.png'" alt="" />
              <div class="info">
                <strong>{{ r.name || r.animal_type }}</strong>
                <span>{{ r.animal_type }} · {{ r.color }}</span>
                <span>{{ r.city }} · {{ r.lost_date | date: 'dd/MM/yyyy' }}</span>
              </div>
              <ion-button size="small" (click)="open(r); $event.stopPropagation()">Ver detalle</ion-button>
            </div>
          }
        </div>

        @if (view() === 'list') {
          <ion-refresher slot="fixed" (ionRefresh)="refresh($event)"><ion-refresher-content /></ion-refresher>
          <div class="list">
            @if (loading() && reports().length === 0) { <ion-spinner /> }
            @for (r of reports(); track r.id) { <app-report-card [report]="r" /> }
            @empty { @if (!loading()) { <p class="ion-text-center">No hay reportes con estos filtros.</p> } }
          </div>
        }
      }

      <ion-fab slot="fixed" vertical="bottom" horizontal="end">
        <ion-fab-button (click)="newReport()" aria-label="Publicar mascota"><ion-icon name="add" /></ion-fab-button>
      </ion-fab>
    </ion-content>

    <ion-modal [isOpen]="filtersOpen()" [breakpoints]="[0, 0.75]" [initialBreakpoint]="0.75" (didDismiss)="filtersOpen.set(false)">
      <ng-template>
        <ion-content class="ion-padding">
          <h2>Filtros</h2>
          <ion-select label="Tipo de animal" labelPlacement="floating" fill="outline" [(ngModel)]="draft.animalType"
            class="ion-margin-bottom">
            <ion-select-option [value]="null">Todos</ion-select-option>
            <ion-select-option value="Perro">Perro</ion-select-option>
            <ion-select-option value="Gato">Gato</ion-select-option>
            <ion-select-option value="Otro">Otro</ion-select-option>
          </ion-select>
          <ion-input label="Color" labelPlacement="floating" fill="outline" [(ngModel)]="draft.color" class="ion-margin-bottom" />
          <ion-select label="Estado" labelPlacement="floating" fill="outline" [(ngModel)]="draft.status" class="ion-margin-bottom">
            <ion-select-option value="activos">Activos (perdidos y encontrados)</ion-select-option>
            <ion-select-option value="perdida">Perdido</ion-select-option>
            <ion-select-option value="resuelta">Ya volvió a casa</ion-select-option>
          </ion-select>
          <ion-input label="Desde (fecha)" labelPlacement="floating" fill="outline" type="date" [(ngModel)]="draft.dateFrom"
            class="ion-margin-bottom" />
          <ion-button expand="block" (click)="applyFilters()">Aplicar filtros</ion-button>
          <ion-button expand="block" fill="outline" (click)="clearFilters()">Limpiar filtros</ion-button>
        </ion-content>
      </ng-template>
    </ion-modal>
  `,
  styles: [`
    .map-wrap { position: absolute; inset: 0; }
    .hidden { visibility: hidden; pointer-events: none; }
    .map-spinner { position: absolute; top: 12px; left: 50%; z-index: 500; }
    .summary { position: absolute; left: 12px; right: 12px; bottom: 84px; z-index: 500; display: flex; gap: 12px;
      align-items: center; padding: 10px; border-radius: 14px; background: var(--ion-background-color, #fff);
      box-shadow: 0 2px 10px rgba(0,0,0,.3); }
    .summary img { width: 64px; height: 64px; object-fit: cover; border-radius: 10px; }
    .summary .info { flex: 1; display: flex; flex-direction: column; font-size: 13px; }
    .list { padding: 8px 12px 90px; }
    .state { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%;
      text-align: center; padding: 24px; }
  `],
})
export class ExplorePage {
  readonly auth = inject(AuthService);
  readonly network = inject(NetworkService);
  private readonly reportsApi = inject(ReportsService);
  private readonly router = inject(Router);
  private readonly map = viewChild(ReportMapComponent);

  readonly view = signal<'map' | 'list'>('map');
  readonly reports = signal<Report[]>([]);
  readonly selected = signal<Report | null>(null);
  readonly loading = signal(false);
  readonly error = signal(false);
  readonly filters = signal<ReportFilters>({ ...EMPTY_FILTERS });
  readonly filtersOpen = signal(false);
  draft: ReportFilters = { ...EMPTY_FILTERS };
  private bounds: MapBounds | null = null;

  readonly activeFilterCount = computed(() => {
    const f = this.filters();
    return [f.animalType, f.color.trim(), f.status !== 'activos', f.dateFrom].filter(Boolean).length;
  });

  constructor() {
    addIcons({ add, funnelOutline, logInOutline, logOutOutline, wifiOutline });
    // Al volver a tener internet, recargar solo
    this.network.refresh().then(() => this.load());
  }

  /** Al volver de publicar/editar, refresca. */
  ionViewWillEnter(): void {
    if (this.bounds || this.view() === 'list') void this.load();
  }

  setView(v: 'map' | 'list'): void {
    this.view.set(v);
    this.selected.set(null);
    void this.load();
  }

  onBounds(b: MapBounds): void {
    this.bounds = b;
    if (this.view() === 'map') void this.load();
  }

  async load(): Promise<void> {
    if (!(await this.network.refresh())) return;
    this.loading.set(true);
    this.error.set(false);
    try {
      // Mapa: solo el área visible (RNF-08). Lista: los más recientes.
      const useBounds = this.view() === 'map' ? (this.bounds ?? undefined) : undefined;
      if (this.view() === 'map' && !this.bounds) return; // esperar al primer evento de bounds
      this.reports.set(await this.reportsApi.list(this.filters(), useBounds, this.view() === 'map' ? 200 : 50));
    } catch {
      this.error.set(true);
    } finally {
      this.loading.set(false);
    }
  }

  retry(): void {
    void this.load();
  }

  async refresh(ev: CustomEvent): Promise<void> {
    await this.load();
    (ev.target as unknown as { complete(): void }).complete();
  }

  openFilters(): void {
    this.draft = { ...this.filters() };
    this.filtersOpen.set(true);
  }

  applyFilters(): void {
    this.filters.set({ ...this.draft, dateFrom: this.draft.dateFrom || null });
    this.filtersOpen.set(false);
    void this.load();
  }

  clearFilters(): void {
    this.draft = { ...EMPTY_FILTERS };
    this.filters.set({ ...EMPTY_FILTERS });
    this.filtersOpen.set(false);
    void this.load();
  }

  open(r: Report): void {
    void this.router.navigate(['/reporte', r.id]);
  }

  /** Si no hay sesión, el authGuard redirige a /login y regresa aquí tras entrar. */
  newReport(): void {
    void this.router.navigateByUrl('/nuevo-reporte');
  }
}
