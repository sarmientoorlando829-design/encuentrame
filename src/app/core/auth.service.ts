import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Session } from '@supabase/supabase-js';
import { Profile } from './models';
import { SupabaseService } from './supabase.service';

export interface SignUpData {
  fullName: string;
  email: string;
  phone: string;
  password: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly sb = inject(SupabaseService).client;
  private readonly router = inject(Router);

  private readonly session = signal<Session | null>(null);
  readonly profile = signal<Profile | null>(null);

  readonly currentUser = computed(() => this.session()?.user ?? null);
  readonly isAuthenticated = computed(() => this.session() !== null);

  /** Se resuelve cuando ya se leyó la sesión guardada (el guard la espera). */
  readonly initialized: Promise<void>;

  constructor() {
    this.initialized = this.sb.auth.getSession().then(({ data }) => this.setSession(data.session));
    this.sb.auth.onAuthStateChange((_event, session) => {
      // setTimeout: evita llamar a Supabase dentro del callback (puede bloquearse)
      setTimeout(() => this.setSession(session), 0);
    });
  }

  private setSession(session: Session | null): void {
    this.session.set(session);
    if (session) void this.loadProfile(session.user.id);
    else this.profile.set(null);
  }

  private async loadProfile(userId: string): Promise<void> {
    const { data } = await this.sb.from('profiles').select('id,full_name,phone').eq('id', userId).maybeSingle();
    this.profile.set((data as Profile | null) ?? null);
  }

  async signIn(email: string, password: string): Promise<void> {
    const { error } = await this.sb.auth.signInWithPassword({ email, password });
    if (error) throw error;
  }

  /** @returns true si quedó con sesión; false si Supabase exige confirmar el correo. */
  async signUp(d: SignUpData): Promise<boolean> {
    const { data, error } = await this.sb.auth.signUp({
      email: d.email,
      password: d.password,
      options: { data: { full_name: d.fullName, phone: d.phone } }, // lo lee el trigger handle_new_user
    });
    if (error) throw error;
    return data.session !== null;
  }

  async sendPasswordReset(email: string): Promise<void> {
    const { error } = await this.sb.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/restablecer`,
    });
    if (error) throw error;
  }

  async updatePassword(password: string): Promise<void> {
    const { error } = await this.sb.auth.updateUser({ password });
    if (error) throw error;
  }

  /** Verifica la contraseña actual y luego la cambia. */
  async changePassword(current: string, next: string): Promise<void> {
    const email = this.currentUser()?.email;
    if (!email) throw new Error('Sin sesión');
    const { error } = await this.sb.auth.signInWithPassword({ email, password: current });
    if (error) throw new Error('WRONG_CURRENT');
    await this.updatePassword(next);
  }

  async updateProfile(fullName: string, phone: string): Promise<void> {
    const user = this.currentUser();
    if (!user) throw new Error('Sin sesión');
    const row = { id: user.id, full_name: fullName, phone };
    const { error } = await this.sb.from('profiles').upsert(row);
    if (error) throw error;
    this.profile.set(row);
  }

  async signOut(): Promise<void> {
    await this.sb.auth.signOut();
  }

  /** Solo permite rutas internas (evita open-redirect). */
  safeReturnUrl(url: string | null | undefined): string {
    return url && url.startsWith('/') && !url.startsWith('//') ? url : '/explorar';
  }

  /** Redirige a login conservando la pantalla que el usuario quería abrir. */
  goToLogin(returnUrl: string): void {
    void this.router.navigate(['/login'], { queryParams: { returnUrl } });
  }
}
