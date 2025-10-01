import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Product } from '../models/product.model';
import { ApiService } from './api.service';

@Injectable({
  providedIn: 'root'
})
export class InventoryService {
  private productsSubject: BehaviorSubject<Product[]>;
  public products$: Observable<Product[]>;

  constructor(private apiService: ApiService) {
    this.productsSubject = new BehaviorSubject<Product[]>([]);
    this.products$ = this.productsSubject.asObservable();
    this.loadProducts();
  }

  private loadProducts(): void {
    this.apiService.getProducts().subscribe({
      next: (products) => this.productsSubject.next(products),
      error: (error) => {
        console.error('Erro ao carregar produtos da API:', error);
        // Em caso de erro, mantém array vazio
        this.productsSubject.next([]);
      }
    });
  }

  getProducts(): Product[] {
    return this.productsSubject.value;
  }

  incrementQuantity(productId: string): void {
    this.apiService.incrementStock(productId).subscribe({
      next: (updatedProduct) => this.updateLocalProduct(updatedProduct),
      error: (error) => console.error('Erro ao incrementar:', error)
    });
  }

  decrementQuantity(productId: string): void {
    this.apiService.decrementStock(productId).subscribe({
      next: (updatedProduct) => this.updateLocalProduct(updatedProduct),
      error: (error) => console.error('Erro ao decrementar:', error)
    });
  }

  updateProductQuantity(productId: string, newQuantity: number): void {
    this.apiService.updateStock(productId, newQuantity).subscribe({
      next: (updatedProduct) => this.updateLocalProduct(updatedProduct),
      error: (error) => console.error('Erro ao atualizar:', error)
    });
  }

  createProduct(product: Omit<Product, 'created_at' | 'updated_at'>): Observable<Product> {
    return this.apiService.createProduct(product).pipe(
      tap(newProduct => {
        const products = [...this.getProducts(), newProduct];
        this.productsSubject.next(products);
      })
    );
  }

  deleteProduct(productId: string): Observable<void> {
    return this.apiService.deleteProduct(productId).pipe(
      tap(() => {
        const products = this.getProducts().filter(p => p.id !== productId);
        this.productsSubject.next(products);
      })
    );
  }

  resetToDefaults(): void {
    // Recarregar da API
    this.loadProducts();
  }

  // Atualizar produto localmente após mudança na API
  private updateLocalProduct(updatedProduct: Product): void {
    const products = this.getProducts();
    const index = products.findIndex(p => p.id === updatedProduct.id);
    if (index !== -1) {
      products[index] = updatedProduct;
      this.productsSubject.next([...products]);
    }
  }
}
