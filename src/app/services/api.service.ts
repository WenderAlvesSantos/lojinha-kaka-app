import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Product } from '../models/product.model';
import { environment } from '../../environments/environment';

interface AuthResponse {
  token: string;
  user: {
    username: string;
  };
}

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private apiUrl = environment.apiUrl;
  private tokenSubject = new BehaviorSubject<string | null>(
    this.isBrowser() ? localStorage.getItem('auth_token') : null
  );

  constructor(private http: HttpClient) {}

  private isBrowser(): boolean {
    return typeof window !== 'undefined' && typeof localStorage !== 'undefined';
  }

  // Autenticação
  login(username: string, password: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/auth/login`, {
      username,
      password
    }).pipe(
      tap(response => {
        if (this.isBrowser()) {
          localStorage.setItem('auth_token', response.token);
        }
        this.tokenSubject.next(response.token);
      })
    );
  }

  logout(): void {
    if (this.isBrowser()) {
      localStorage.removeItem('auth_token');
    }
    this.tokenSubject.next(null);
  }

  isAuthenticated(): boolean {
    return !!this.tokenSubject.value;
  }

  private getAuthHeaders(): HttpHeaders {
    const token = this.tokenSubject.value;
    if (token) {
      return new HttpHeaders({
        'Authorization': `Bearer ${token}`
      });
    }
    return new HttpHeaders();
  }

  // Produtos (público)
  getProducts(): Observable<Product[]> {
    return this.http.get<Product[]>(`${this.apiUrl}/products`);
  }

  getProductById(id: string): Observable<Product> {
    return this.http.get<Product>(`${this.apiUrl}/products/${id}`);
  }

  // Produtos (admin - protegido)
  createProduct(product: Omit<Product, 'created_at' | 'updated_at'>): Observable<Product> {
    return this.http.post<Product>(
      `${this.apiUrl}/products`,
      product,
      { headers: this.getAuthHeaders() }
    );
  }

  updateProduct(id: string, updates: Partial<Product>): Observable<Product> {
    return this.http.patch<Product>(
      `${this.apiUrl}/products/${id}`,
      updates,
      { headers: this.getAuthHeaders() }
    );
  }

  deleteProduct(id: string): Observable<void> {
    return this.http.delete<void>(
      `${this.apiUrl}/products/${id}`,
      { headers: this.getAuthHeaders() }
    );
  }

  // Estoque (admin - protegido)
  updateStock(id: string, qtd: number): Observable<Product> {
    return this.http.patch<Product>(
      `${this.apiUrl}/products/${id}/stock`,
      { qtd },
      { headers: this.getAuthHeaders() }
    );
  }

  incrementStock(id: string): Observable<Product> {
    return this.http.patch<Product>(
      `${this.apiUrl}/products/${id}/stock`,
      { action: 'increment' },
      { headers: this.getAuthHeaders() }
    );
  }

  decrementStock(id: string): Observable<Product> {
    return this.http.patch<Product>(
      `${this.apiUrl}/products/${id}/stock`,
      { action: 'decrement' },
      { headers: this.getAuthHeaders() }
    );
  }

  // Histórico
  getStockHistory(productId?: string, limit: number = 50): Observable<any[]> {
    let url = `${this.apiUrl}/stock-history?limit=${limit}`;
    if (productId) {
      url += `&productId=${productId}`;
    }
    return this.http.get<any[]>(url, { headers: this.getAuthHeaders() });
  }
}

