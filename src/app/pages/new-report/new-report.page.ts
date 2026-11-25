import { Component, effect, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import {
  IonAccordion, IonAccordionGroup, IonBackButton, IonButton, IonButtons, IonContent, IonHeader, IonIcon, IonInput, IonItem,
  IonLabel, IonSpinner, IonTextarea, IonTitle, IonToast, IonToolbar,
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import { camera, locate } from 'ionicons/icons';
import { AuthService } from '../../core/auth.service';
import { LatLng, MediaLocationService } from '../../core/media-location.service';
import { AnimalType, PHONE_PATTERN, PetSize, Report, cleanPhone } from '../../core/models';
import { NetworkService } from '../../core/network.service';
import { ReportsService } from '../../core/reports.service';
import { AppIconComponent } from '../../shared/app-icon.component';
import { BreedPickerComponent } from '../../shared/breed-picker.component';
import { ColorPickerComponent } from '../../shared/color-picker.component';
import { LocationPickerComponent } from '../../shared/location-picker.component';
import { typeIcon } from '../../shared/pet-data';

const iso = (d: Date): string => new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);

@Component({
  selector: 'app-new-report',
  imports: [AppIconComponent, ReactiveFormsModule, LocationPickerComponent, ColorPickerComponent, BreedPickerComponent, IonHeader, IonToolbar,
    IonTitle, IonContent, IonButtons, IonBackButton, IonButton, IonIcon, IonInput, IonTextarea, IonAccordionGroup,
    IonAccordion, IonItem, IonLabel, IonToast, IonSpinner],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start"><ion-back-button defaultHref="/explorar" /></ion-buttons>
        <ion-title>{{ editId ? 'Editar reporte' : 'Nuevo reporte' }}</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content class="ion-padding">
      @if (loadingReport()) { <div class="center"><ion-spinner /></div> } @else {
      <form [formGroup]="form" (ngSubmit)="submit()">

        <!-- Qué pasó -->
        <div class="two">
          <button type="button" class="big" [class.sel]="status() === 'perdida'" (click)="status.set('perdida')"><app-icon name="frown" [size]="26" />Se me perdió</button>
          <button type="button" class="big" [class.sel]="status() === 'encontrada'" (click)="status.set('encontrada')"><app-icon name="hand-heart" [size]="26" />La encontré</button>
        </div>

        <!-- 1 Foto -->
        <h3><span class="n">1</span> Foto <small>(ayuda mucho a que la reconozcan)</small></h3>
        @if (photoPreview()) { <img [src]="photoPreview()" class="preview" alt="Foto de la mascota" /> }
        <ion-button expand="block" fill="outline" (click)="choosePhoto()">
          <ion-icon slot="start" name="camera" />{{ photoPreview() ? 'Cambiar foto' : 'Tomar foto o elegir de galería' }}
        </ion-button>

        <!-- 2 Animal -->
        <h3 id="step-color"><span class="n" [class.ok]="!!color()">@if (color()) { <app-icon name="check" [size]="14" /> } @else { 2 }</span> ¿Qué animal es?</h3>
        <div class="three">
          @for (t of animalTypes; track t) {
            <button type="button" class="big" [class.sel]="animalType() === t" (click)="setType(t)">
              <app-icon [name]="icon(t)" [size]="30" />{{ t }}
            </button>
          }
        </div>
        @if (animalType() !== 'Otro') {
          <div class="ion-margin-top">
            <app-breed-picker [type]="animalType()" [value]="breed()" (valueChange)="breed.set($event)" />
          </div>
        }
        <p class="label">Color <small>(elige hasta 2)</small></p>
        <app-color-picker [type]="animalType()" [value]="color()" (valueChange)="color.set($event)" />

        <!-- 3 Dónde y cuándo -->
        <h3 id="step-place"><span class="n" [class.ok]="!!coords()">@if (coords()) { <app-icon name="check" [size]="14" /> } @else { 3 }</span> ¿Dónde fue?</h3>
        <ion-button expand="block" fill="outline" (click)="useGps()" [disabled]="gpsLoading()">
          @if (gpsLoading()) { <ion-spinner name="dots" /> } @else { <ion-icon slot="start" name="locate" />Usar mi ubicación actual }
        </ion-button>
        <p class="hint">O toca el mapa / arrastra el pin al lugar exacto.</p>
        <app-location-picker [value]="coords()" (valueChange)="onPin($event)" />
        <ion-input label="Zona / localidad" labelPlacement="floating" fill="outline" formControlName="city"
          [helperText]="'Se completa sola al marcar el punto; puedes corregirla.'" class="ion-margin-top" />

        <p class="label">¿Cuándo?</p>
        <div class="chips">
          <button type="button" class="chip" [class.sel]="dateMode() === 'hoy'" (click)="setDate('hoy')">Hoy</button>
          <button type="button" class="chip" [class.sel]="dateMode() === 'ayer'" (click)="setDate('ayer')">Ayer</button>
          <button type="button" class="chip" [class.sel]="dateMode() === 'otro'" (click)="setDate('otro')">Otro día</button>
        </div>
        @if (dateMode() === 'otro') {
          <ion-input type="date" fill="outline" formControlName="lost_date" [max]="today" class="ion-margin-top" aria-label="Fecha" />
        }

        <!-- Más detalles (opcional) -->
        <ion-accordion-group class="ion-margin-top">
          <ion-accordion value="more">
            <ion-item slot="header"><ion-label>Más detalles <small>(opcional)</small></ion-label></ion-item>
            <div slot="content" class="ion-padding-top">
              <ion-input label="Nombre de la mascota" labelPlacement="floating" fill="outline" formControlName="name" class="ion-margin-bottom" />
              <p class="label">Tamaño</p>
              <div class="chips">
                @for (s of sizes; track s) {
                  <button type="button" class="chip" [class.sel]="size() === s" (click)="size.set(size() === s ? null : s)">{{ s }}</button>
                }
              </div>
              <ion-textarea label="Señas particulares" labelPlacement="floating" fill="outline" rows="3" class="ion-margin-top"
                placeholder="Collar, cicatriz, manchas, comportamiento…" formControlName="description" />
            </div>
          </ion-accordion>
        </ion-accordion-group>

        <!-- Contacto -->
        <h3>Contacto</h3>
        @if (!editContact() && form.controls.contact_name.value && form.controls.contact_phone.valid) {
          <div class="contact">
            <div><strong>{{ form.controls.contact_name.value }}</strong><br /><span>{{ form.controls.contact_phone.value }}</span></div>
            <ion-button fill="clear" size="small" (click)="editContact.set(true)">Cambiar</ion-button>
          </div>
        } @else {
          <ion-input label="Nombre de contacto" labelPlacement="floating" fill="outline" formControlName="contact_name" class="ion-margin-bottom" />
          <ion-input label="Teléfono / WhatsApp" labelPlacement="floating" fill="outline" type="tel" formControlName="contact_phone"
            errorText="7 a 20 dígitos, ej: +573001234567" />
        }
        <p class="hint">Solo lo verán personas con cuenta.</p>

        <ion-button type="submit" expand="block" size="large" class="ion-margin-top" [disabled]="saving()">
          @if (saving()) { <ion-spinner name="dots" /> } @else { {{ editId ? 'Guardar cambios' : 'Publicar reporte' }} }
        </ion-button>
      </form>
      }
      <ion-toast [isOpen]="toast() !== ''" [message]="toast()" [duration]="5000" color="warning" (didDismiss)="toast.set('')" />
    </ion-content>
  `,
  styles: [`
    .center { display: flex; justify-content: center; padding: 40px; }
    h3 { margin: 22px 0 10px; display: flex; align-items: center; gap: 8px; font-size: 17px; }
    h3 small, .label small { font-weight: 400; color: var(--ion-color-medium); font-size: 12px; }
    .n { width: 24px; height: 24px; border-radius: 50%; background: var(--ion-color-medium); color: #fff; font-size: 13px;
      display: inline-flex; align-items: center; justify-content: center; }
    .n.ok { background: var(--ion-color-success); }
    .label { margin: 16px 0 8px; font-weight: 600; font-size: 14px; }
    .hint { font-size: 12px; color: var(--ion-color-medium); margin: 6px 2px; }
    .two, .three { display: grid; gap: 8px; }
    .two { grid-template-columns: 1fr 1fr; }
    .three { grid-template-columns: repeat(3, 1fr); }
    .big { padding: 12px 6px; border-radius: 14px; border: 2px solid var(--ion-color-step-150, #ddd); background: transparent;
      color: inherit; font: inherit; font-weight: 600; cursor: pointer; display: flex; flex-direction: column; align-items: center; gap: 2px; }
    .big.sel, .chip.sel { border-color: var(--ion-color-primary); background: color-mix(in srgb, var(--ion-color-primary) 14%, transparent); }
    .chips { display: flex; flex-wrap: wrap; gap: 8px; }
    .chip { padding: 8px 16px; border-radius: 20px; border: 2px solid var(--ion-color-step-150, #ddd); background: transparent;
      color: inherit; font: inherit; cursor: pointer; }
    .preview { width: 100%; max-height: 220px; object-fit: cover; border-radius: 12px; margin-bottom: 8px; }
    .contact { display: flex; justify-content: space-between; align-items: center; padding: 10px 14px; border-radius: 12px;
      border: 1px solid var(--ion-color-step-250, #ccc); }
  `],
})
export class NewReportPage {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly media = inject(MediaLocationService);
  private readonly reports = inject(ReportsService);
  private readonly network = inject(NetworkService);
  private readonly router = inject(Router);

  readonly editId = inject(ActivatedRoute).snapshot.paramMap.get('id');
  readonly animalTypes: AnimalType[] = ['Perro', 'Gato', 'Otro'];
  readonly sizes: PetSize[] = ['Pequeño', 'Mediano', 'Grande'];
  readonly today = iso(new Date());
  readonly icon = typeIcon;

  readonly status = signal<'perdida' | 'encontrada'>('perdida');
  readonly animalType = signal<AnimalType>('Perro');
  readonly color = signal('');
  readonly breed = signal('');
  readonly size = signal<PetSize | null>(null);
  readonly dateMode = signal<'hoy' | 'ayer' | 'otro'>('hoy');
  readonly coords = signal<LatLng | null>(null);
  readonly photoPreview = signal<string | null>(null);
  readonly gpsLoading = signal(false);
  readonly saving = signal(false);
  readonly loadingReport = signal(!!this.editId);
  readonly editContact = signal(false);
  readonly toast = signal('');
  private photoFile: File | null = null;
  private existingPhotoUrl: string | null = null;
  private cityTouched = false;

  readonly form = this.fb.nonNullable.group({
    name: [''],
    description: [''],
    city: [''],
    lost_date: [this.today, Validators.required],
    contact_name: ['', Validators.required],
    contact_phone: ['', [Validators.required, Validators.pattern(PHONE_PATTERN)]],
  });

  constructor() {
    addIcons({ camera, locate });
    this.form.controls.city.valueChanges.subscribe(() => (this.cityTouched = true));

    // Contacto pre-llenado desde el perfil (solo al crear)
    effect(() => {
      const p = this.auth.profile();
      if (p && !this.editId && !this.form.controls.contact_name.value) {
        this.form.patchValue({ contact_name: p.full_name, contact_phone: p.phone });
        this.cityTouched = false;
      }
    });
    if (this.editId) void this.loadForEdit(this.editId);
  }

  private async loadForEdit(id: string): Promise<void> {
    try {
      await this.auth.initialized;
      const r = await this.reports.getById(id);
      if (!r || r.user_id !== this.auth.currentUser()?.id) {
        await this.router.navigateByUrl('/explorar', { replaceUrl: true });
        return;
      }
      const phone = (await this.reports.getContactPhone(id)) ?? '';
      this.fill(r, phone);
    } finally {
      this.loadingReport.set(false);
    }
  }

  private fill(r: Report, phone: string): void {
    this.status.set(r.status === 'encontrada' ? 'encontrada' : 'perdida');
    this.animalType.set(r.animal_type);
    this.color.set(r.color);
    this.breed.set(r.breed ?? '');
    this.size.set(r.size);
    this.coords.set({ lat: r.lat, lng: r.lng });
    this.existingPhotoUrl = r.photo_url;
    this.photoPreview.set(r.photo_url);
    this.dateMode.set(r.lost_date === this.today ? 'hoy' : r.lost_date === iso(new Date(Date.now() - 86400000)) ? 'ayer' : 'otro');
    this.form.patchValue({
      name: r.name ?? '', description: r.description ?? '', city: r.city, lost_date: r.lost_date,
      contact_name: r.contact_name, contact_phone: phone,
    });
    this.cityTouched = true;
  }

  setType(t: AnimalType): void {
    if (t === this.animalType()) return;
    this.animalType.set(t);
    this.color.set(''); // la paleta cambia según el animal
    this.breed.set('');
  }

  setDate(m: 'hoy' | 'ayer' | 'otro'): void {
    this.dateMode.set(m);
    if (m === 'hoy') this.form.patchValue({ lost_date: this.today });
    if (m === 'ayer') this.form.patchValue({ lost_date: iso(new Date(Date.now() - 86400000)) });
  }

  async choosePhoto(): Promise<void> {
    const file = await this.media.pickPhoto(); // aquí se piden permisos de cámara/galería
    if (!file) return;
    this.photoFile = file;
    this.photoPreview.set(URL.createObjectURL(file));
  }

  async useGps(): Promise<void> {
    this.gpsLoading.set(true);
    const pos = await this.media.getCurrentPosition(); // aquí se pide el permiso de ubicación
    this.gpsLoading.set(false);
    if (pos) this.onPin(pos);
    else this.toast.set('No pudimos usar el GPS. Toca el mapa para marcar el lugar.');
  }

  onPin(p: LatLng): void {
    this.coords.set(p);
    void this.media.reverseGeocode(p).then((zone) => {
      if (zone && !this.cityTouched) {
        this.form.controls.city.setValue(zone, { emitEvent: false });
      }
    });
  }

  /** Qué falta para publicar (solo lo indispensable). */
  private firstMissing(): { msg: string; anchor: string } | null {
    if (!this.color()) return { msg: 'Elige el color de la mascota', anchor: 'step-color' };
    if (!this.coords()) return { msg: 'Marca en el mapa dónde fue', anchor: 'step-place' };
    if (this.form.controls.contact_name.invalid || this.form.controls.contact_phone.invalid) {
      this.editContact.set(true);
      return { msg: 'Revisa tu nombre y teléfono de contacto', anchor: 'step-place' };
    }
    return null;
  }

  async submit(): Promise<void> {
    const user = this.auth.currentUser();
    const c = this.coords();
    const missing = this.firstMissing();
    if (missing || !user || !c) {
      if (missing) {
        this.toast.set(missing.msg);
        document.getElementById(missing.anchor)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }
    if (!(await this.network.refresh())) {
      this.toast.set('Sin conexión a internet. Intenta de nuevo.');
      return;
    }
    this.saving.set(true);
    try {
      const photo_url = this.photoFile ? await this.media.uploadPhoto(this.photoFile, user.id) : this.existingPhotoUrl;
      const v = this.form.getRawValue();
      const fields = {
        status: this.status(),
        animal_type: this.animalType(),
        name: v.name.trim() || null,
        breed: this.breed() || null,
        color: this.color(),
        size: this.size(),
        city: v.city.trim() || 'Bogotá',
        description: v.description.trim() || null,
        lost_date: v.lost_date,
        lat: c.lat,
        lng: c.lng,
        photo_url,
        contact_name: v.contact_name.trim(),
      };
      const phone = cleanPhone(v.contact_phone);
      if (this.editId) {
        await this.reports.update(this.editId, fields, phone);
        await this.router.navigate(['/reporte', this.editId], { replaceUrl: true });
      } else {
        await this.reports.create({ ...fields, contact_phone: phone });
        await this.router.navigateByUrl('/explorar', { replaceUrl: true });
      }
    } catch (e) {
      console.error('Error al guardar reporte', e);
      this.toast.set(`No se pudo guardar: ${(e as { message?: string }).message ?? 'error desconocido'}`);
    } finally {
      this.saving.set(false);
    }
  }
}
