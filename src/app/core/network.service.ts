import { Injectable, signal } from '@angular/core';
import { Network } from '@capacitor/network';

@Injectable({ providedIn: 'root' })
export class NetworkService {
  readonly online = signal(true);

  constructor() {
    void Network.getStatus().then((s) => this.online.set(s.connected));
    void Network.addListener('networkStatusChange', (s) => this.online.set(s.connected));
  }

  async refresh(): Promise<boolean> {
    const s = await Network.getStatus();
    this.online.set(s.connected);
    return s.connected;
  }
}
