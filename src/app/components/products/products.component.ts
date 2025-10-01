import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Observable } from 'rxjs';
import { Product } from '../../models/product.model';
import { InventoryService } from '../../services/inventory.service';

@Component({
  selector: 'app-products',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './products.component.html',
  styleUrl: './products.component.scss'
})
export class ProductsComponent implements OnInit {
  products$!: Observable<Product[]>;

  constructor(private inventoryService: InventoryService) {}

  ngOnInit(): void {
    this.products$ = this.inventoryService.products$;
  }
}
