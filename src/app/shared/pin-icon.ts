import * as L from 'leaflet';

export const BOGOTA: L.LatLngTuple = [4.711, -74.0721];

export function pinIcon(kind: 'perdida' | 'encontrada' | 'resuelta' | 'picker'): L.DivIcon {
  return L.divIcon({
    className: `pin ${kind}`,
    html: '<span></span>',
    iconSize: [26, 26],
    iconAnchor: [13, 26],
    popupAnchor: [0, -26],
  });
}

export function osmLayer(): L.TileLayer {
  return L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap contributors',
  });
}
