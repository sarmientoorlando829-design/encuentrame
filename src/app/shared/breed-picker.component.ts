import { Component, computed, input, output, signal } from '@angular/core';
import {
  IonButton, IonButtons, IonContent, IonHeader, IonIcon, IonItem, IonLabel, IonList, IonModal, IonSearchbar, IonTitle, IonToolbar,
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import { checkmark, chevronForward, closeCircleOutline } from 'ionicons/icons';
import { AnimalType } from '../core/models';
import { AppIconComponent } from './app-icon.component';
import { BREEDS, normalize, typeIcon } from './pet-data';

/** Selector de raza con búsqueda e ícono del animal. Permite escribir una raza que no esté en la lista. */
@Component({
  selector: 'app-breed-picker',
  imports: [AppIconComponent, IonModal, IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, IonSearchbar, IonContent, IonList, IonItem, IonLabel, IonIcon],
  template: `
    <button type="button" class="row" (click)="open.set(true)">
      <span class="ico"><app-icon [name]="icon()" [size]="26" /></span>
      <span class="txt">
        <small>Raza (opcional)</small>
        <strong>{{ value() || 'Toca para elegir' }}</strong>
      </span>
      <ion-icon name="chevron-forward" />
    </button>

    <ion-modal [isOpen]="open()" (didDismiss)="close()">
      <ng-template>
        <ion-header>
          <ion-toolbar>
            <ion-title>Raza de {{ type() === 'Gato' ? 'gato' : 'perro' }}</ion-title>
            <ion-buttons slot="end"><ion-button (click)="close()">Cerrar</ion-button></ion-buttons>
          </ion-toolbar>
          <ion-toolbar>
            <ion-searchbar placeholder="Buscar o escribir raza" [debounce]="0" (ionInput)="q.set($any($event).detail.value ?? '')" />
          </ion-toolbar>
        </ion-header>
        <ion-content>
          <ion-list>
            @if (customOption(); as c) {
              <ion-item button detail="false" (click)="pick(c)">
                <span slot="start" class="ico"><app-icon [name]="icon()" [size]="22" /></span><ion-label>Usar «{{ c }}»</ion-label>
              </ion-item>
            }
            @for (b of filtered(); track b) {
              <ion-item button detail="false" (click)="pick(b)">
                <span slot="start" class="ico"><app-icon [name]="icon()" [size]="22" /></span>
                <ion-label>{{ b }}</ion-label>
                @if (b === value()) { <ion-icon slot="end" name="checkmark" color="primary" /> }
              </ion-item>
            }
            @if (value()) {
              <ion-item button detail="false" (click)="pick('')">
                <ion-icon slot="start" name="close-circle-outline" color="medium" /><ion-label color="medium">Quitar raza</ion-label>
              </ion-item>
            }
          </ion-list>
        </ion-content>
      </ng-template>
    </ion-modal>
  `,
  styles: [`
    .row { display: flex; align-items: center; gap: 12px; width: 100%; padding: 10px 14px; border-radius: 12px; text-align: left;
      border: 1px solid var(--ion-color-step-250, #ccc); background: transparent; color: inherit; font: inherit; cursor: pointer; }
    .ico { font-size: 24px; }
    .txt { flex: 1; display: flex; flex-direction: column; }
    small { color: var(--ion-color-medium); }
  `],
})
export class BreedPickerComponent {
  readonly type = input<AnimalType>('Perro');
  readonly value = input('');
  readonly valueChange = output<string>();

  readonly open = signal(false);
  readonly q = signal('');

  readonly icon = computed(() => typeIcon(this.type()));
  private readonly all = computed(() => (this.type() === 'Otro' ? [] : BREEDS[this.type() as 'Perro' | 'Gato']));
  readonly filtered = computed(() => {
    const q = normalize(this.q().trim());
    return q ? this.all().filter((b) => normalize(b).includes(q)) : this.all();
  });
  readonly customOption = computed(() => {
    const t = this.q().trim();
    return t && !this.all().some((b) => normalize(b) === normalize(t)) ? t : null;
  });

  constructor() {
    addIcons({ checkmark, chevronForward, closeCircleOutline });
  }

  pick(b: string): void {
    this.valueChange.emit(b);
    this.close();
  }

  close(): void {
    this.open.set(false);
    this.q.set('');
  }
}
