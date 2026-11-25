import { Component, inject, input, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  IonButton, IonButtons, IonContent, IonHeader, IonIcon, IonSpinner, IonTextarea, IonTitle, IonToast, IonToolbar, ModalController,
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import { camera, locate } from 'ionicons/icons';
import { LatLng, MediaLocationService } from '../core/media-location.service';
import { NetworkService } from '../core/network.service';
import { SightingsService } from '../core/sightings.service';
import { LocationPickerComponent } from './location-picker.component';

/** RF-05: comentario obligatorio; foto y ubicación opcionales. */
@Component({
  selector: 'app-add-sighting-modal',
  imports: [ReactiveFormsModule, LocationPickerComponent, IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, IonContent,
    IonTextarea, IonIcon, IonSpinner, IonToast],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-title>Reportar avistamiento</ion-title>
        <ion-buttons slot="end"><ion-button (click)="close()">Cancelar</ion-button></ion-buttons>
      </ion-toolbar>
    </ion-header>
    <ion-content class="ion-padding">
      <form [formGroup]="form" (ngSubmit)="save()">
        <ion-textarea label="¿Qué viste y dónde?" labelPlacement="floating" fill="outline" rows="4" formControlName="comment"
          placeholder="Ej: Lo vi hoy a las 5pm cerca del parque, parecía asustado." errorText="Cuéntanos un poco más (mín. 3 letras)" />

        @if (photoPreview()) { <img [src]="photoPreview()" class="preview" alt="Foto del avistamiento" /> }
        <ion-button expand="block" fill="outline" class="ion-margin-top" (click)="choosePhoto()">
          <ion-icon slot="start" name="camera" />{{ photoPreview() ? 'Cambiar foto' : 'Agregar foto (opcional)' }}
        </ion-button>

        @if (!showMap()) {
          <ion-button expand="block" fill="outline" (click)="showMap.set(true)">
            <ion-icon slot="start" name="locate" />Agregar ubicación (opcional)
          </ion-button>
        } @else {
          <ion-button expand="block" fill="outline" (click)="useGps()"><ion-icon slot="start" name="locate" />Usar mi ubicación actual</ion-button>
          <p class="hint">O toca el mapa para marcar dónde lo viste.</p>
          <app-location-picker [value]="coords()" (valueChange)="coords.set($event)" />
        }

        <ion-button type="submit" expand="block" class="ion-margin-top" [disabled]="form.invalid || saving()">
          @if (saving()) { <ion-spinner name="dots" /> } @else { Publicar avistamiento }
        </ion-button>
      </form>
      <ion-toast [isOpen]="toast() !== ''" [message]="toast()" [duration]="4000" color="danger" (didDismiss)="toast.set('')" />
    </ion-content>
  `,
  styles: [`.preview { width: 100%; max-height: 200px; object-fit: cover; border-radius: 12px; margin-top: 12px; } .hint { font-size: 12px; color: var(--ion-color-medium); }`],
})
export class AddSightingModal {
  readonly reportId = input.required<string>();
  private readonly modal = inject(ModalController);
  private readonly media = inject(MediaLocationService);
  private readonly sightings = inject(SightingsService);
  private readonly network = inject(NetworkService);

  readonly form = inject(FormBuilder).nonNullable.group({ comment: ['', [Validators.required, Validators.minLength(3)]] });
  readonly coords = signal<LatLng | null>(null);
  readonly showMap = signal(false);
  readonly photoPreview = signal<string | null>(null);
  readonly saving = signal(false);
  readonly toast = signal('');
  private photo: File | null = null;

  constructor() {
    addIcons({ camera, locate });
  }

  async choosePhoto(): Promise<void> {
    const f = await this.media.pickPhoto();
    if (!f) return;
    this.photo = f;
    this.photoPreview.set(URL.createObjectURL(f));
  }

  async useGps(): Promise<void> {
    const p = await this.media.getCurrentPosition();
    if (p) this.coords.set(p);
    else this.toast.set('No pudimos usar el GPS. Toca el mapa para marcar el lugar.');
  }

  async save(): Promise<void> {
    if (this.form.invalid) return;
    if (!(await this.network.refresh())) {
      this.toast.set('Sin conexión a internet.');
      return;
    }
    this.saving.set(true);
    try {
      const c = this.coords();
      await this.sightings.add({
        reportId: this.reportId(),
        comment: this.form.controls.comment.value.trim(),
        photo: this.photo,
        lat: c?.lat ?? null,
        lng: c?.lng ?? null,
      });
      await this.modal.dismiss(null, 'saved');
    } catch (e) {
      this.toast.set(`No se pudo guardar: ${(e as { message?: string }).message ?? 'error'}`);
    } finally {
      this.saving.set(false);
    }
  }

  close(): Promise<boolean> {
    return this.modal.dismiss(null, 'cancel');
  }
}
