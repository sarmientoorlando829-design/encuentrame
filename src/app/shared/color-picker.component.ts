import { Component, computed, effect, input, output, signal, untracked } from '@angular/core';
import { IonInput } from '@ionic/angular';
import { AnimalType } from '../core/models';
import { COLORS } from './pet-data';

const OTHER = 'Otro';

/** Paleta de colores según el animal. Hasta 2 colores; el valor sale como "Negro / Blanco". */
@Component({
  selector: 'app-color-picker',
  imports: [IonInput],
  template: `
    <div class="grid">
      @for (o of options(); track o.label) {
        <button type="button" class="opt" [class.sel]="isSel(o.label)" (click)="toggle(o.label)">
          <span class="sw" [style.background]="o.css"></span>
          <span class="lbl">{{ o.label }}</span>
        </button>
      }
      <button type="button" class="opt" [class.sel]="isSel(other)" (click)="toggle(other)">
        <span class="sw plus">+</span><span class="lbl">Otro</span>
      </button>
    </div>
    @if (isSel(other)) {
      <ion-input fill="outline" label="¿Qué color?" labelPlacement="floating" [value]="custom()"
        (ionInput)="setCustom($any($event).detail.value ?? '')" class="ion-margin-top" />
    }
  `,
  styles: [`
    .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(76px, 1fr)); gap: 8px; }
    .opt { display: flex; flex-direction: column; align-items: center; gap: 4px; padding: 8px 4px; border-radius: 12px;
      border: 2px solid var(--ion-color-step-150, #ddd); background: transparent; color: inherit; font: inherit; cursor: pointer; }
    .opt.sel { border-color: var(--ion-color-primary); background: color-mix(in srgb, var(--ion-color-primary) 12%, transparent); }
    .sw { width: 34px; height: 34px; border-radius: 50%; border: 1px solid rgba(0,0,0,.25); display: block; }
    .plus { display: flex; align-items: center; justify-content: center; font-size: 20px; color: var(--ion-color-medium); }
    .lbl { font-size: 12px; text-align: center; line-height: 1.1; }
  `],
})
export class ColorPickerComponent {
  readonly type = input<AnimalType>('Perro');
  readonly value = input('');
  readonly valueChange = output<string>();
  readonly other = OTHER;

  readonly selected = signal<string[]>([]);
  readonly custom = signal('');
  readonly options = computed(() => COLORS[this.type()]);

  constructor() {
    // Sincroniza desde afuera (modo edición o cambio de tipo)
    effect(() => {
      const v = this.value();
      const labels = this.options().map((o) => o.label);
      untracked(() => {
        if (v === this.compose()) return;
        const parts = v ? v.split(' / ') : [];
        const known = parts.filter((p) => labels.includes(p));
        const extra = parts.filter((p) => !labels.includes(p)).join(' ');
        this.selected.set(extra ? [...known, OTHER] : known);
        this.custom.set(extra);
      });
    });
  }

  isSel(label: string): boolean {
    return this.selected().includes(label);
  }

  toggle(label: string): void {
    const cur = this.selected();
    if (cur.includes(label)) this.selected.set(cur.filter((l) => l !== label));
    else this.selected.set([...cur, label].slice(-2)); // máximo 2
    this.valueChange.emit(this.compose());
  }

  setCustom(v: string): void {
    this.custom.set(v);
    this.valueChange.emit(this.compose());
  }

  private compose(): string {
    const sel = this.selected();
    const parts = sel.filter((l) => l !== OTHER);
    if (sel.includes(OTHER) && this.custom().trim()) parts.push(this.custom().trim());
    return parts.join(' / ');
  }
}
