import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Observable, BehaviorSubject, combineLatest, map, debounceTime, distinctUntilChanged } from 'rxjs';
import { Product } from '../../models/product.model';
import { InventoryService } from '../../services/inventory.service';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin.component.html',
  styleUrl: './admin.component.scss'
})
export class AdminComponent implements OnInit {
  products$!: Observable<Product[]>;
  filteredProducts$!: Observable<Product[]>;
  isAuthenticated = false;
  username = 'admin';
  password = '';
  loginError = '';
  
  // Filtro
  private searchTermSubject = new BehaviorSubject<string>('');
  searchTerm$ = this.searchTermSubject.asObservable().pipe(
    debounceTime(300),
    distinctUntilChanged()
  );
  
  // Estatísticas
  totalProducts = 0;
  totalStock = 0;
  outOfStockCount = 0;
  
  // Novo produto
  showAddProductModal = false;
  newProduct = {
    id: '',
    nome: '',
    qtd: 0,
    preco: '',
    imagem: ''
  };
  addProductError = '';
  uploadingImage = false;
  selectedFile: File | null = null;

  constructor(
    private inventoryService: InventoryService,
    private apiService: ApiService
  ) {}

  ngOnInit(): void {
    this.products$ = this.inventoryService.products$;
    
    // Filtragem com debounce
    this.filteredProducts$ = combineLatest([
      this.products$,
      this.searchTerm$
    ]).pipe(
      map(([products, term]) => {
        if (!term || term.trim() === '') {
          return products;
        }
        const searchLower = term.toLowerCase().trim();
        return products.filter(product => 
          product.nome.toLowerCase().includes(searchLower) ||
          product.id.toLowerCase().includes(searchLower)
        );
      })
    );
    
    // Calcular estatísticas
    this.products$.subscribe(products => {
      this.totalProducts = products.length;
      this.totalStock = products.reduce((sum, p) => sum + p.qtd, 0);
      this.outOfStockCount = products.filter(p => p.qtd === 0).length;
    });
    
    // Verificar se já está autenticado
    if (this.apiService.isAuthenticated()) {
      this.isAuthenticated = true;
    }
  }

  onSearchChange(term: string): void {
    this.searchTermSubject.next(term);
  }

  clearSearch(): void {
    this.searchTermSubject.next('');
  }

  get searchTerm(): string {
    return this.searchTermSubject.value;
  }

  login(): void {
    this.loginError = '';

    // Login via API com JWT
    this.apiService.login(this.username, this.password).subscribe({
      next: () => {
        this.isAuthenticated = true;
        this.password = '';
      },
      error: (error) => {
        console.error('Erro no login:', error);
        this.loginError = 'Credenciais inválidas';
        this.password = '';
      }
    });
  }

  logout(): void {
    this.apiService.logout();
    this.isAuthenticated = false;
    this.username = 'admin';
    this.password = '';
  }

  increment(productId: string): void {
    this.inventoryService.incrementQuantity(productId);
  }

  decrement(productId: string): void {
    this.inventoryService.decrementQuantity(productId);
  }

  resetDefaults(): void {
    if (confirm('Tem certeza que deseja recarregar os produtos do banco?')) {
      this.inventoryService.resetToDefaults();
    }
  }

  openAddProductModal(): void {
    this.showAddProductModal = true;
    this.newProduct = {
      id: '',
      nome: '',
      qtd: 0,
      preco: '',
      imagem: ''
    };
    this.addProductError = '';
    this.selectedFile = null;
    this.uploadingImage = false;
  }

  closeAddProductModal(): void {
    this.showAddProductModal = false;
    this.addProductError = '';
    this.selectedFile = null;
    this.uploadingImage = false;
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      
      // Validar tipo
      if (!file.type.startsWith('image/')) {
        this.addProductError = 'Apenas imagens são permitidas';
        return;
      }
      
      // Validar tamanho (5MB)
      if (file.size > 5 * 1024 * 1024) {
        this.addProductError = 'Imagem muito grande (máximo 5MB)';
        return;
      }
      
      this.selectedFile = file;
      this.addProductError = '';
    }
  }

  addProduct(): void {
    this.addProductError = '';

    // Validações
    if (!this.newProduct.id || !this.newProduct.nome || !this.newProduct.preco) {
      this.addProductError = 'Preencha todos os campos obrigatórios';
      return;
    }

    // Formatar ID (lowercase, sem espaços)
    this.newProduct.id = this.newProduct.id.toLowerCase().trim().replace(/\s+/g, '-');

    // Se tem arquivo selecionado, fazer upload primeiro
    if (this.selectedFile) {
      this.uploadingImage = true;
      
      this.apiService.uploadImage(this.selectedFile).subscribe({
        next: (response) => {
          this.newProduct.imagem = response.url;
          this.createProductInDatabase();
        },
        error: (error) => {
          this.uploadingImage = false;
          console.error('Erro ao fazer upload:', error);
          this.addProductError = 'Erro ao fazer upload da imagem';
        }
      });
    } else {
      // Se não tem arquivo mas tem texto, usar como URL
      if (this.newProduct.imagem && !this.newProduct.imagem.startsWith('http')) {
        this.newProduct.imagem = `/images/${this.newProduct.imagem}`;
      }
      this.createProductInDatabase();
    }
  }

  private createProductInDatabase(): void {
    this.inventoryService.createProduct(this.newProduct).subscribe({
      next: () => {
        this.uploadingImage = false;
        this.closeAddProductModal();
        alert('Produto adicionado com sucesso!');
      },
      error: (error) => {
        this.uploadingImage = false;
        console.error('Erro ao adicionar produto:', error);
        this.addProductError = error.error?.error || 'Erro ao adicionar produto';
      }
    });
  }

  deleteProduct(productId: string, productName: string): void {
    if (confirm(`Tem certeza que deseja deletar ${productName}?`)) {
      this.inventoryService.deleteProduct(productId).subscribe({
        next: () => {
          alert('Produto deletado com sucesso!');
        },
        error: (error) => {
          console.error('Erro ao deletar produto:', error);
          alert('Erro ao deletar produto');
        }
      });
    }
  }
}
