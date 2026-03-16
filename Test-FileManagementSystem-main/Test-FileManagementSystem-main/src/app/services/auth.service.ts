// src/app/services/auth.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { Router } from '@angular/router'; // <-- add this
import { environment } from '../../environments/environment';
import { User } from '../models/user.model';

@Injectable({ providedIn: 'root' })
export class AuthService {
private readonly KEY = 'fl_user';
private currentUserSubject = new BehaviorSubject<User | null>(this.loadUser());
currentUser$ = this.currentUserSubject.asObservable();

constructor(private http: HttpClient, private router: Router) {} // <-- inject Router

  private loadUser(): User | null {
    const raw = localStorage.getItem(this.KEY);
    try {
      return raw ? JSON.parse(raw) as User : null;
    } catch {
      return null;
    }
  }

  private saveUser(user: User | null) {
    if (user) localStorage.setItem(this.KEY, JSON.stringify(user));
    else localStorage.removeItem(this.KEY);
  }

  login(payload: { email: string; password: string }): Observable<User> {
    return this.http.post<User>(`${environment.apiBaseUrl}/auth/login`, payload).pipe(
      tap(user => {
        this.saveUser(user);
        this.currentUserSubject.next(user);
      })
    );
  }

  register(payload: { name: string; email: string; password: string }): Observable<User> {
    return this.http.post<User>(`${environment.apiBaseUrl}/auth/register`, payload).pipe(
      tap(user => {
        this.saveUser(user);
        this.currentUserSubject.next(user);
      })
    );
  }

  logout() {
    this.saveUser(null);
    this.currentUserSubject.next(null);

    // ✅ Redirect to dashboard after logout
    this.router.navigate(['/']);
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  getToken(): string | null {
    return this.currentUserSubject.value?.token ?? null;
  }
}