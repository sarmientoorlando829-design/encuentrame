import { DatePipe } from '@angular/common';
import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IonBadge, IonCard, IonCardContent } from '@ionic/angular';
import { Report, STATUS_LABEL } from '../core/models';

@Component({
  selector: 'app-report-card',
  imports: [IonCard, IonCardContent, IonBadge, RouterLink, DatePipe],
  template: `
    <ion-card [routerLink]="['/reporte', report().id]" class="card">
      <img [src]="report().photo_url ?? 'assets/icon/favicon.png'" [alt]="report().name ?? report().animal_type" />
      <ion-card-content>
        <ion-badge [color]="report().status === 'perdida' ? 'danger' : report().status === 'encontrada' ? 'warning' : 'success'">
          {{ label() }}
        </ion-badge>
        <h2>{{ report().name || report().animal_type }}</h2>
        <p>{{ report().animal_type }}{{ report().breed ? ' · ' + report().breed : '' }} · {{ report().color }}</p>
        <p>{{ report().city }} · {{ report().lost_date | date: 'dd/MM/yyyy' }}</p>
      </ion-card-content>
    </ion-card>
  `,
  styles: [`
    .card { cursor: pointer; margin: 8px 0; }
    img { width: 100%; height: 160px; object-fit: cover; display: block; }
    h2 { margin: 6px 0 2px; font-weight: 600; }
    p { margin: 0; font-size: 13px; }
  `],
})
export class ReportCardComponent {
  readonly report = input.required<Report>();
  label(): string {
    return STATUS_LABEL[this.report().status];
  }
}
