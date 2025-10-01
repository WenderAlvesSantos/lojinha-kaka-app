import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Observable } from 'rxjs';
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
  isAuthenticated = false;
  username = 'admin';
  password = '';
  loginError = '';

  constructor(
    private inventoryService: InventoryService,
    private apiService: ApiService
  ) {}

  ngOnInit(): void {
    this.products$ = this.inventoryService.products$;
    
    // Verificar se já está autenticado
    if (this.apiService.isAuthenticated()) {
      this.isAuthenticated = true;
    }
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
}
