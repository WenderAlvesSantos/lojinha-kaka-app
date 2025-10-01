import { Routes } from '@angular/router';
import { ProductsComponent } from './components/products/products.component';
import { AdminComponent } from './components/admin/admin.component';

export const routes: Routes = [
  { path: '', component: ProductsComponent },
  { path: 'admin', component: AdminComponent },
  { path: '**', redirectTo: '' }
];
