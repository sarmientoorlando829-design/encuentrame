import { AfterViewInit, Component, ElementRef, OnDestroy, effect, input, output, viewChild } from '@angular/core';
import * as L from 'leaflet';
import { MapBounds, Report } from '../core/models';
import { BOGOTA, osmLayer, pinIcon } from './pin-icon';

/** Mapa Leaflet con pines; emite el área visible (getBounds) al mover/zoom. */
@Component({
  selector: 'app-report-map',
  template: `<div #host class="map"></div>`,
  styles: [`:host { display: block; height: 100%; } .map { height: 100%; width: 100%; z-index: 0; }`],
})
export class ReportMapComponent implements AfterViewInit, OnDestroy {
  readonly reports = input<Report[]>([]);
  readonly boundsChange = output<MapBounds>();
  readonly select = output<Report>();

  private readonly host = viewChild.required<ElementRef<HTMLDivElement>>('host');
  private map?: L.Map;
  private layer = L.layerGroup();
  private ro?: ResizeObserver;
  private timer?: ReturnType<typeof setTimeout>;

  constructor() {
    effect(() => this.draw(this.reports()));
  }

  ngAfterViewInit(): void {
    this.map = L.map(this.host().nativeElement).setView(BOGOTA, 12);
    osmLayer().addTo(this.map);
    this.layer.addTo(this.map);
    this.map.on('moveend', () => {
      clearTimeout(this.timer); // debounce
      this.timer = setTimeout(() => this.emitBounds(), 350);
    });
    this.ro = new ResizeObserver(() => {
      this.map?.invalidateSize();
      this.emitBounds();
    });
    this.ro.observe(this.host().nativeElement);
    this.draw(this.reports());
  }

  private emitBounds(): void {
    if (!this.map) return;
    const b = this.map.getBounds();
    this.boundsChange.emit({ south: b.getSouth(), west: b.getWest(), north: b.getNorth(), east: b.getEast() });
  }

  private draw(reports: Report[]): void {
    this.layer.clearLayers();
    for (const r of reports) {
      L.marker([r.lat, r.lng], { icon: pinIcon(r.status), title: r.name ?? r.animal_type })
        .on('click', () => this.select.emit(r))
        .addTo(this.layer);
    }
  }

  centerOn(lat: number, lng: number): void {
    this.map?.setView([lat, lng], 15);
  }

  ngOnDestroy(): void {
    clearTimeout(this.timer);
    this.ro?.disconnect();
    this.map?.remove();
  }
}
