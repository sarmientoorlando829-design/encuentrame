import { Component, ElementRef, OnDestroy, effect, input, output, viewChild, AfterViewInit } from '@angular/core';
import * as L from 'leaflet';
import { LatLng } from '../core/media-location.service';
import { BOGOTA, osmLayer, pinIcon } from './pin-icon';

/** Mini-mapa con pin arrastrable: fallback cuando no hay GPS o se niega el permiso. */
@Component({
  selector: 'app-location-picker',
  template: `<div #host class="picker"></div>`,
  styles: [`.picker { height: 220px; width: 100%; border-radius: 12px; z-index: 0; }`],
})
export class LocationPickerComponent implements AfterViewInit, OnDestroy {
  readonly value = input<LatLng | null>(null);
  readonly valueChange = output<LatLng>();

  private readonly host = viewChild.required<ElementRef<HTMLDivElement>>('host');
  private map?: L.Map;
  private marker?: L.Marker;
  private ro?: ResizeObserver;

  constructor() {
    // Si el GPS (u otro origen) cambia el valor, mover el pin
    effect(() => {
      const v = this.value();
      if (!v || !this.map) return;
      const cur = this.marker?.getLatLng();
      if (cur && cur.lat === v.lat && cur.lng === v.lng) return; // el cambio vino del propio mapa
    });
  }

  ngAfterViewInit(): void {
    const start = this.value();
    this.map = L.map(this.host().nativeElement).setView(start ? [start.lat, start.lng] : BOGOTA, start ? 17 : 12);
    osmLayer().addTo(this.map);
    if (start) this.place(start, false);

    this.map.on('click', (e: L.LeafletMouseEvent) => this.place({ lat: e.latlng.lat, lng: e.latlng.lng }, false, true));

    this.ro = new ResizeObserver(() => this.map?.invalidateSize());
    this.ro.observe(this.host().nativeElement);
  }

  private place(p: LatLng, recenter: boolean, emit = false): void {
    if (!this.map) return;
    if (!this.marker) {
      this.marker = L.marker([p.lat, p.lng], { icon: pinIcon('picker'), draggable: true }).addTo(this.map);
      this.marker.on('dragend', () => {
        const ll = this.marker!.getLatLng();
        this.valueChange.emit({ lat: ll.lat, lng: ll.lng });
      });
    } else {
      this.marker.setLatLng([p.lat, p.lng]);
    }
    if (recenter) this.map.setView([p.lat, p.lng], 17);
    if (emit) this.valueChange.emit(p);
  }

  ngOnDestroy(): void {
    this.ro?.disconnect();
    this.map?.remove();
  }
}
