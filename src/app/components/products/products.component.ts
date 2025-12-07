import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Observable, map, BehaviorSubject, combineLatest, debounceTime, distinctUntilChanged } from 'rxjs';
import { Product } from '../../models/product.model';
import { InventoryService } from '../../services/inventory.service';

type SortField = 'nome' | 'preco' | 'estoque';
type SortDirection = 'asc' | 'desc';

@Component({
  selector: 'app-products',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './products.component.html',
  styleUrl: './products.component.scss'
})
export class ProductsComponent implements OnInit {
  products$!: Observable<Product[]>;
  filteredProducts$!: Observable<Product[]>;
  sortedProducts$!: Observable<Product[]>;
  paginatedProducts$!: Observable<Product[]>;
  pageNumbers$!: Observable<number[]>;
  
  // Filtro com debounce
  private searchTermSubject = new BehaviorSubject<string>('');
  searchTerm$ = this.searchTermSubject.asObservable().pipe(
    debounceTime(300), // Debounce de 300ms
    distinctUntilChanged()
  );
  
  // Ordenação
  private sortFieldSubject = new BehaviorSubject<SortField>('nome');
  private sortDirectionSubject = new BehaviorSubject<SortDirection>('asc');
  sortField$ = this.sortFieldSubject.asObservable();
  sortDirection$ = this.sortDirectionSubject.asObservable();
  
  // Paginação
  private currentPageSubject = new BehaviorSubject<number>(1);
  currentPage$ = this.currentPageSubject.asObservable();
  private totalPagesSubject = new BehaviorSubject<number>(1);
  totalPages$ = this.totalPagesSubject.asObservable();
  itemsPerPage = 12;
  totalItems = 0;
  
  // Modal de compra
  showBuyModal = false;
  selectedProduct: Product | null = null;
  quantity = 1;
  readonly whatsappNumber = '5561992830960';

  constructor(private inventoryService: InventoryService) {}

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
          product.nome.toLowerCase().includes(searchLower)
        );
      })
    );
    
    // Ordenação
    this.sortedProducts$ = combineLatest([
      this.filteredProducts$,
      this.sortField$,
      this.sortDirection$
    ]).pipe(
      map(([products, field, direction]) => {
        return this.sortProducts([...products], field, direction);
      })
    );
    
    // Paginação
    this.paginatedProducts$ = combineLatest([
      this.sortedProducts$,
      this.currentPage$
    ]).pipe(
      map(([products, currentPage]) => {
        this.totalItems = products.length;
        const totalPages = Math.ceil(this.totalItems / this.itemsPerPage);
        this.totalPagesSubject.next(totalPages);
        
        // Ajustar página atual se necessário
        let adjustedPage = currentPage;
        if (adjustedPage > totalPages && totalPages > 0) {
          adjustedPage = totalPages;
          this.currentPageSubject.next(adjustedPage);
        }
        
        const startIndex = (adjustedPage - 1) * this.itemsPerPage;
        const endIndex = startIndex + this.itemsPerPage;
        return products.slice(startIndex, endIndex);
      })
    );

    // Números de página reativos
    this.pageNumbers$ = combineLatest([
      this.currentPage$,
      this.totalPages$
    ]).pipe(
      map(([currentPage, totalPages]) => {
        const pages: number[] = [];
        const maxVisible = 5;
        let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
        let end = Math.min(totalPages, start + maxVisible - 1);
        
        if (end - start < maxVisible - 1) {
          start = Math.max(1, end - maxVisible + 1);
        }
        
        for (let i = start; i <= end; i++) {
          pages.push(i);
        }
        
        return pages;
      })
    );
  }

  private sortProducts(products: Product[], field: SortField, direction: SortDirection): Product[] {
    return products.sort((a, b) => {
      let comparison = 0;
      
      switch (field) {
        case 'nome':
          comparison = a.nome.localeCompare(b.nome, 'pt-BR', { sensitivity: 'base' });
          break;
        case 'preco':
          // Extrair número do preço (remover "R$", espaços e vírgulas, converter vírgula para ponto)
          const extractPrice = (priceStr: string): number => {
            const cleaned = priceStr.replace(/[^\d,]/g, '').replace(',', '.');
            const parsed = parseFloat(cleaned);
            return isNaN(parsed) ? 0 : parsed;
          };
          const priceA = extractPrice(a.preco);
          const priceB = extractPrice(b.preco);
          comparison = priceA - priceB;
          break;
        case 'estoque':
          comparison = a.qtd - b.qtd;
          break;
      }
      
      return direction === 'asc' ? comparison : -comparison;
    });
  }

  onSearchChange(term: string): void {
    this.searchTermSubject.next(term);
    this.currentPageSubject.next(1); // Resetar para primeira página ao buscar
  }

  clearSearch(): void {
    this.searchTermSubject.next('');
    this.currentPageSubject.next(1);
  }

  get searchTerm(): string {
    return this.searchTermSubject.value;
  }

  // Ordenação
  setSortField(field: SortField): void {
    if (this.sortFieldSubject.value === field) {
      // Alternar direção se o mesmo campo
      this.sortDirectionSubject.next(
        this.sortDirectionSubject.value === 'asc' ? 'desc' : 'asc'
      );
    } else {
      this.sortFieldSubject.next(field);
      this.sortDirectionSubject.next('asc');
    }
    this.currentPageSubject.next(1); // Resetar para primeira página ao ordenar
  }

  get sortField(): SortField {
    return this.sortFieldSubject.value;
  }

  get sortDirection(): SortDirection {
    return this.sortDirectionSubject.value;
  }

  getSortIcon(field: SortField): string {
    if (this.sortField !== field) {
      return '⇅';
    }
    return this.sortDirection === 'asc' ? '↑' : '↓';
  }

  // Paginação
  get currentPage(): number {
    return this.currentPageSubject.value;
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPageSubject.next(page);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  previousPage(): void {
    const current = this.currentPageSubject.value;
    if (current > 1) {
      this.goToPage(current - 1);
    }
  }

  nextPage(): void {
    const current = this.currentPageSubject.value;
    if (current < this.totalPages) {
      this.goToPage(current + 1);
    }
  }

  get totalPages(): number {
    return this.totalPagesSubject.value;
  }

  getPageNumbers(): number[] {
    // Este método não é mais usado, mas mantido para compatibilidade
    // Use pageNumbers$ no template
    return [];
  }

  // Expor Math para o template
  Math = Math;

  openBuyModal(product: Product): void {
    if (product.qtd === 0) {
      alert('Produto sem estoque no momento 😔');
      return;
    }
    
    this.selectedProduct = product;
    this.quantity = 1;
    this.showBuyModal = true;
  }

  closeBuyModal(): void {
    this.showBuyModal = false;
    this.selectedProduct = null;
    this.quantity = 1;
  }

  confirmPurchase(): void {
    if (!this.selectedProduct) return;

    // Validar quantidade
    if (this.quantity < 1) {
      alert('Quantidade deve ser no mínimo 1');
      return;
    }

    if (this.quantity > this.selectedProduct.qtd) {
      alert(`Apenas ${this.selectedProduct.qtd} unidades disponíveis em estoque`);
      return;
    }

    // Montar mensagem para WhatsApp
    const message = this.buildWhatsAppMessage();
    
    // Abrir WhatsApp
    const whatsappUrl = `https://wa.me/${this.whatsappNumber}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
    
    // Fechar modal
    this.closeBuyModal();
  }

  private buildWhatsAppMessage(): string {
    if (!this.selectedProduct) return '';

    const productName = this.selectedProduct.nome;
    const qty = this.quantity;
    const price = this.selectedProduct.preco;
    
    return `Olá! 👋\n\nGostaria de comprar ${qty} ${productName}${qty > 1 ? 's' : ''}\n\nPreço unitário: ${price}\n\nPoderia me ajudar com essa compra? 😊`;
  }

  incrementQuantity(): void {
    if (this.selectedProduct && this.quantity < this.selectedProduct.qtd) {
      this.quantity++;
    }
  }

  decrementQuantity(): void {
    if (this.quantity > 1) {
      this.quantity--;
    }
  }
}
