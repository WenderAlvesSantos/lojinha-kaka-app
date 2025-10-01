# 🔌 Guia de Integração com Backend

## Preparando o Frontend para API

O `InventoryService` foi projetado para facilitar a migração de localStorage para uma API REST.

### Passo 1: Adicionar HttpClient

Edite `src/app/app.config.ts`:

```typescript
import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { routes } from './app.routes';
import { provideClientHydration } from '@angular/platform-browser';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }), 
    provideRouter(routes), 
    provideClientHydration(),
    provideHttpClient() // <-- Adicione esta linha
  ]
};
```

### Passo 2: Criar Serviço de API

Crie `src/app/services/api.service.ts`:

```typescript
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Product } from '../models/product.model';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private apiUrl = 'http://localhost:3000/api'; // URL da sua API

  constructor(private http: HttpClient) {}

  getProducts(): Observable<Product[]> {
    return this.http.get<Product[]>(`${this.apiUrl}/products`);
  }

  updateProductQuantity(productId: string, quantity: number): Observable<Product> {
    return this.http.patch<Product>(
      `${this.apiUrl}/products/${productId}`, 
      { qtd: quantity }
    );
  }

  createProduct(product: Product): Observable<Product> {
    return this.http.post<Product>(`${this.apiUrl}/products`, product);
  }

  deleteProduct(productId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/products/${productId}`);
  }
}
```

### Passo 3: Atualizar InventoryService

Modifique `src/app/services/inventory.service.ts`:

```typescript
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, tap } from 'rxjs';
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
      error: (error) => console.error('Erro ao carregar produtos:', error)
    });
  }

  getProducts(): Product[] {
    return this.productsSubject.value;
  }

  updateProductQuantity(productId: string, newQuantity: number): void {
    this.apiService.updateProductQuantity(productId, newQuantity)
      .pipe(
        tap(() => {
          const products = this.getProducts();
          const product = products.find(p => p.id === productId);
          if (product) {
            product.qtd = newQuantity;
            this.productsSubject.next([...products]);
          }
        })
      )
      .subscribe({
        error: (error) => console.error('Erro ao atualizar quantidade:', error)
      });
  }

  incrementQuantity(productId: string): void {
    const product = this.getProducts().find(p => p.id === productId);
    if (product) {
      this.updateProductQuantity(productId, product.qtd + 1);
    }
  }

  decrementQuantity(productId: string): void {
    const product = this.getProducts().find(p => p.id === productId);
    if (product && product.qtd > 0) {
      this.updateProductQuantity(productId, product.qtd - 1);
    }
  }
}
```

## 🚀 Exemplo de Backend (Node.js + Express)

### Estrutura Básica

```
backend/
├── src/
│   ├── controllers/
│   │   └── product.controller.js
│   ├── models/
│   │   └── product.model.js
│   ├── routes/
│   │   └── product.routes.js
│   ├── middleware/
│   │   └── auth.middleware.js
│   └── server.js
├── package.json
└── .env
```

### package.json

```json
{
  "name": "lojinha-kaka-backend",
  "version": "1.0.0",
  "scripts": {
    "start": "node src/server.js",
    "dev": "nodemon src/server.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "dotenv": "^16.3.1",
    "mongoose": "^8.0.0",
    "bcryptjs": "^2.4.3",
    "jsonwebtoken": "^9.0.2"
  },
  "devDependencies": {
    "nodemon": "^3.0.1"
  }
}
```

### server.js

```javascript
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const productRoutes = require('./routes/product.routes');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Rotas
app.use('/api/products', productRoutes);

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
```

### routes/product.routes.js

```javascript
const express = require('express');
const router = express.Router();
const productController = require('../controllers/product.controller');
const authMiddleware = require('../middleware/auth.middleware');

// Rotas públicas
router.get('/', productController.getAllProducts);
router.get('/:id', productController.getProductById);

// Rotas protegidas (admin)
router.post('/', authMiddleware, productController.createProduct);
router.patch('/:id', authMiddleware, productController.updateProduct);
router.delete('/:id', authMiddleware, productController.deleteProduct);

module.exports = router;
```

### controllers/product.controller.js

```javascript
const Product = require('../models/product.model');

exports.getAllProducts = async (req, res) => {
  try {
    const products = await Product.find();
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ error: 'Produto não encontrado' });
    }
    res.json(product);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.createProduct = async (req, res) => {
  try {
    const product = new Product(req.body);
    await product.save();
    res.status(201).json(product);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.updateProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!product) {
      return res.status(404).json({ error: 'Produto não encontrado' });
    }
    res.json(product);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) {
      return res.status(404).json({ error: 'Produto não encontrado' });
    }
    res.json({ message: 'Produto deletado com sucesso' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
```

### models/product.model.js (MongoDB/Mongoose)

```javascript
const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  nome: { type: String, required: true },
  qtd: { type: Number, required: true, min: 0, default: 0 },
  preco: { type: String, required: true },
  imagem: { type: String, required: true }
}, {
  timestamps: true
});

module.exports = mongoose.model('Product', productSchema);
```

### middleware/auth.middleware.js

```javascript
const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ error: 'Token não fornecido' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userData = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Autenticação falhou' });
  }
};
```

### .env

```
PORT=3000
MONGODB_URI=mongodb://localhost:27017/lojinha-kaka
JWT_SECRET=seu-segredo-super-secreto-aqui
```

## 🔐 Sistema de Autenticação

Para implementar autenticação JWT completa, você precisará:

1. **Criar modelo de usuário**
2. **Endpoints de login/registro**
3. **Guardar token no frontend**
4. **Interceptor HTTP para adicionar token**

### AuthService (Frontend)

```typescript
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';

interface AuthResponse {
  token: string;
  user: any;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private tokenSubject = new BehaviorSubject<string | null>(
    localStorage.getItem('token')
  );
  
  constructor(private http: HttpClient) {}

  login(password: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>('/api/auth/login', { password })
      .pipe(
        tap(response => {
          localStorage.setItem('token', response.token);
          this.tokenSubject.next(response.token);
        })
      );
  }

  logout(): void {
    localStorage.removeItem('token');
    this.tokenSubject.next(null);
  }

  getToken(): string | null {
    return this.tokenSubject.value;
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }
}
```

### HTTP Interceptor

```typescript
import { HttpInterceptorFn } from '@angular/common/http';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = localStorage.getItem('token');
  
  if (token) {
    req = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }
  
  return next(req);
};
```

Adicione no `app.config.ts`:

```typescript
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { authInterceptor } from './interceptors/auth.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    // ... outros providers
    provideHttpClient(withInterceptors([authInterceptor]))
  ]
};
```

## 📊 Banco de Dados Recomendado

### Opção 1: MongoDB (NoSQL)
- Ideal para dados flexíveis
- Fácil escalabilidade horizontal
- Schema-less

### Opção 2: PostgreSQL (SQL)
- Ideal para dados relacionais
- ACID compliant
- Excelente performance

### Opção 3: Firebase/Supabase
- Backend-as-a-Service
- Setup rápido
- Realtime capabilities

## 🚀 Deploy

### Frontend (Vercel/Netlify)
```bash
npm run build
# Upload pasta dist/ para Vercel/Netlify
```

### Backend (Heroku/Railway/Render)
```bash
git push heroku main
```

## ✅ Checklist de Produção

- [ ] Variáveis de ambiente configuradas
- [ ] HTTPS habilitado
- [ ] CORS configurado corretamente
- [ ] Rate limiting implementado
- [ ] Logs configurados
- [ ] Monitoramento ativo
- [ ] Backup automático do banco
- [ ] Testes automatizados
- [ ] CI/CD configurado

---

Este guia fornece uma base sólida para integrar o frontend Angular com um backend robusto e escalável! 🚀

