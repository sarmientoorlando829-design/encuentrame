import { Component, computed, inject, input } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { Cat, Check, Circle, Dog, Eye, Frown, HandHeart, House, IconNode, Lock, MailCheck, MapPin, Calendar, PawPrint } from 'lucide';

/** Íconos Lucide (open source, ISC). Se dibujan como SVG inline y heredan el color del texto. */
const ICONS = {
  dog: Dog, cat: Cat, paw: PawPrint, house: House, eye: Eye, pin: MapPin, calendar: Calendar, lock: Lock,
  frown: Frown, 'hand-heart': HandHeart, check: Check, circle: Circle, mail: MailCheck,
} satisfies Record<string, IconNode>;

export type IconName = keyof typeof ICONS;

@Component({
  selector: 'app-icon',
  template: `<span class="i" [style.width.px]="size()" [style.height.px]="size()" [innerHTML]="svg()" aria-hidden="true"></span>`,
  styles: [`:host { display: inline-flex; vertical-align: middle; } .i { display: inline-flex; } :host ::ng-deep svg { width: 100%; height: 100%; }`],
})
export class AppIconComponent {
  readonly name = input.required<IconName>();
  readonly size = input(18);
  private readonly sanitizer = inject(DomSanitizer);

  readonly svg = computed<SafeHtml>(() => {
    const body = ICONS[this.name()]
      .map(([tag, attrs]) => `<${tag} ${Object.entries(attrs).map(([k, v]) => `${k}="${v}"`).join(' ')}/>`)
      .join('');
    // Contenido estático de la librería Lucide (no proviene del usuario)
    return this.sanitizer.bypassSecurityTrustHtml(
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${body}</svg>`,
    );
  });
}
