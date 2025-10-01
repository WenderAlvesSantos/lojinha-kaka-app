import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { Product } from '../models/product.model';
import { ApiService } from './api.service';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class InventoryService {
  private productsSubject: BehaviorSubject<Product[]>;
  public products$: Observable<Product[]>;
  // Usar API se a URL estiver configurada e for diferente de localhost
  private useApi = environment.apiUrl.includes('vercel.app') || environment.apiUrl.includes('netlify.app');

  constructor(private apiService: ApiService) {
    this.productsSubject = new BehaviorSubject<Product[]>([]);
    this.products$ = this.productsSubject.asObservable();
    this.loadProducts();
  }

  private loadProducts(): void {
    if (this.useApi) {
      // Carregar da API
      this.apiService.getProducts().subscribe({
        next: (products) => this.productsSubject.next(products),
        error: (error) => {
          console.error('Erro ao carregar produtos da API:', error);
          this.loadFromLocalStorage(); // Fallback para localStorage
        }
      });
    } else {
      // Modo desenvolvimento: usar localStorage
      this.loadFromLocalStorage();
    }
  }

  private loadFromLocalStorage(): void {
    const STORAGE_KEY = 'estoqueLojaKaka';
    const defaultProducts: Product[] = [
      { id: 'kitsune', nome: 'Kitsune', qtd: 0, preco: 'R$19,50', imagem: '/images/Kitsune_Fruit.webp' },
      { id: 'yeti', nome: 'Yeti', qtd: 1, preco: 'R$12,50', imagem: '/images/Yeti_Fruit.webp' },
      { id: 'gas', nome: 'Gas', qtd: 2, preco: 'R$10,90', imagem: '/images/Gas_Fruit.webp' },
      { id: 'leopard', nome: 'Leopard', qtd: 4, preco: 'R$9,90', imagem: '/images/Leopard_Fruit.webp' },
      { id: 'mamute', nome: 'Mamute', qtd: 3, preco: 'R$3,90', imagem: '/images/Mammoth_Fruit.webp' },
      { id: 'gravity', nome: 'Gravity', qtd: 3, preco: 'R$2,90', imagem: '/images/Gravity_Fruit.webp' },
      { id: 'portal', nome: 'Portal', qtd: 3, preco: 'R$2,90', imagem: '/images/Portal_Fruit.webp' },
      { id: 'buddha', nome: 'Buddha', qtd: 4, preco: 'R$3,90', imagem: '/images/Buddha_Fruit.webp' },
      { id: 'shadow', nome: 'Shadow', qtd: 2, preco: 'R$2,99', imagem: '/images/Shadow_Fruit.webp' },
      { id: 'venom', nome: 'Venom', qtd: 2, preco: 'R$2,99', imagem: '/images/Venom_Fruit.webp' },
      { id: 'control', nome: 'Control', qtd: 3, preco: 'R$2,90', imagem: '/images/Control_Fruit.webp' }
    ];

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          this.productsSubject.next(parsed);
          return;
        }
      }
    } catch (error) {
      console.warn('Erro ao carregar do localStorage:', error);
    }
    
    this.productsSubject.next([...defaultProducts]);
  }

  private saveToLocalStorage(products: Product[]): void {
    if (!this.useApi) {
      try {
        localStorage.setItem('estoqueLojaKaka', JSON.stringify(products));
      } catch (error) {
        console.error('Erro ao salvar no localStorage:', error);
      }
    }
  }

  getProducts(): Product[] {
    return this.productsSubject.value;
  }

  incrementQuantity(productId: string): void {
    if (this.useApi) {
      this.apiService.incrementStock(productId).pipe(
        tap(updatedProduct => this.updateLocalProduct(updatedProduct)),
        catchError(error => {
          console.error('Erro ao incrementar via API:', error);
          this.incrementLocal(productId);
          throw error;
        })
      ).subscribe();
    } else {
      this.incrementLocal(productId);
    }
  }

  decrementQuantity(productId: string): void {
    if (this.useApi) {
      this.apiService.decrementStock(productId).pipe(
        tap(updatedProduct => this.updateLocalProduct(updatedProduct)),
        catchError(error => {
          console.error('Erro ao decrementar via API:', error);
          this.decrementLocal(productId);
          throw error;
        })
      ).subscribe();
    } else {
      this.decrementLocal(productId);
    }
  }

  updateProductQuantity(productId: string, newQuantity: number): void {
    if (this.useApi) {
      this.apiService.updateStock(productId, newQuantity).pipe(
        tap(updatedProduct => this.updateLocalProduct(updatedProduct)),
        catchError(error => {
          console.error('Erro ao atualizar via API:', error);
          throw error;
        })
      ).subscribe();
    } else {
      const products = this.getProducts();
      const product = products.find(p => p.id === productId);
      if (product) {
        product.qtd = Math.max(0, newQuantity);
        this.productsSubject.next([...products]);
        this.saveToLocalStorage(products);
      }
    }
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
    this.loadFromLocalStorage();
  }

  // Métodos auxiliares
  private updateLocalProduct(updatedProduct: Product): void {
    const products = this.getProducts();
    const index = products.findIndex(p => p.id === updatedProduct.id);
    if (index !== -1) {
      products[index] = updatedProduct;
      this.productsSubject.next([...products]);
    }
  }

  private incrementLocal(productId: string): void {
    const products = this.getProducts();
    const product = products.find(p => p.id === productId);
    if (product) {
      product.qtd++;
      this.productsSubject.next([...products]);
      this.saveToLocalStorage(products);
    }
  }

  private decrementLocal(productId: string): void {
    const products = this.getProducts();
    const product = products.find(p => p.id === productId);
    if (product && product.qtd > 0) {
      product.qtd--;
      this.productsSubject.next([...products]);
      this.saveToLocalStorage(products);
    }
  }

  // Ativar/desativar modo API manualmente
  setApiMode(useApi: boolean): void {
    this.useApi = useApi;
    this.loadProducts();
  }
}
