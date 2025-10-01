import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Observable } from 'rxjs';
import { Product } from '../../models/product.model';
import { InventoryService } from '../../services/inventory.service';

@Component({
  selector: 'app-products',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './products.component.html',
  styleUrl: './products.component.scss'
})
export class ProductsComponent implements OnInit {
  products$!: Observable<Product[]>;
  
  // Modal de compra
  showBuyModal = false;
  selectedProduct: Product | null = null;
  quantity = 1;
  readonly whatsappNumber = '5561992830960';

  constructor(private inventoryService: InventoryService) {}

  ngOnInit(): void {
    this.products$ = this.inventoryService.products$;
  }

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
