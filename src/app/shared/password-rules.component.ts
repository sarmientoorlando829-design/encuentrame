import { Component, computed, input } from '@angular/core';
import { AppIconComponent } from './app-icon.component';

export const PASSWORD_PATTERN = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;

@Component({
  selector: 'app-password-rules',
  imports: [AppIconComponent],
  template: `
    <ul>
      @for (r of rules(); track r.text) {
        <li [class.ok]="r.ok"><app-icon [name]="r.ok ? 'check' : 'circle'" [size]="14" /> {{ r.text }}</li>
      }
    </ul>
  `,
  styles: [`
    ul { list-style: none; padding: 0 4px; margin: 0 0 12px; font-size: 13px; color: var(--ion-color-medium); }
    li.ok { color: var(--ion-color-success); }
  `],
})
export class PasswordRulesComponent {
  readonly value = input('');
  readonly rules = computed(() => {
    const v = this.value();
    return [
      { text: 'Mínimo 8 caracteres', ok: v.length >= 8 },
      { text: 'Al menos una letra', ok: /[A-Za-z]/.test(v) },
      { text: 'Al menos un número', ok: /\d/.test(v) },
    ];
  });
}
