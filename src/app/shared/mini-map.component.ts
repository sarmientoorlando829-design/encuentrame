import { AfterViewInit, Component, ElementRef, OnDestroy, input, viewChild } from '@angular/core';
import * as L from 'leaflet';
import { ReportStatus } from '../core/models';
import { osmLayer, pinIcon } from './pin-icon';

/** Mapa pequeño, no interactivo, centrado en un punto. */
@Component({
  selector: 'app-mini-map',
  template: `<div #host class="mini"></div>`,
  styles: [`.mini { height: 200px; width: 100%; border-radius: 12px; z-index: 0; }`],
})
export class MiniMapComponent implements AfterViewInit, OnDestroy {
  readonly lat = input.required<number>();
  readonly lng = input.required<number>();
  readonly status = input<ReportStatus>('perdida');
  private readonly host = viewChild.required<ElementRef<HTMLDivElement>>('host');
  private map?: L.Map;

  ngAfterViewInit(): void {
    this.map = L.map(this.host().nativeElement, {
      dragging: false, scrollWheelZoom: false, doubleClickZoom: false, touchZoom: false, boxZoom: false, keyboard: false,
      zoomControl: false,
    }).setView([this.lat(), this.lng()], 16);
    osmLayer().addTo(this.map);
    L.marker([this.lat(), this.lng()], { icon: pinIcon(this.status()) }).addTo(this.map);
    setTimeout(() => this.map?.invalidateSize(), 200);
  }

  ngOnDestroy(): void {
    this.map?.remove();
  }
}
