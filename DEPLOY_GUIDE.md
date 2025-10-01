# 🌐 Guia de Deploy - Lojinha do Kaka

## 🚀 Opções de Hospedagem

### 1. Vercel (Recomendado - Mais Fácil)

#### Vantagens
- ✅ Deploy automático com Git
- ✅ HTTPS gratuito
- ✅ CDN global
- ✅ Preview de PRs
- ✅ Suporte nativo para Angular

#### Passos

**Via Dashboard Web:**
1. Acesse [vercel.com](https://vercel.com)
2. Faça login com GitHub
3. Clique em "New Project"
4. Importe o repositório
5. Configure:
   - Framework Preset: `Angular`
   - Root Directory: `lojinha-kaka-app`
   - Build Command: `npm run build`
   - Output Directory: `dist/lojinha-kaka-app/browser`
6. Clique em "Deploy"

**Via CLI:**
```bash
# Instalar Vercel CLI
npm i -g vercel

# No diretório do projeto
cd lojinha-kaka-app
vercel

# Para produção
vercel --prod
```

---

### 2. Netlify

#### Vantagens
- ✅ Interface amigável
- ✅ Forms nativos (útil para contato)
- ✅ Serverless functions
- ✅ Split testing

#### Passos

**Via Dashboard:**
1. Acesse [netlify.com](https://netlify.com)
2. Clique em "Add new site" > "Import an existing project"
3. Conecte com GitHub
4. Configure:
   - Base directory: `lojinha-kaka-app`
   - Build command: `npm run build`
   - Publish directory: `dist/lojinha-kaka-app/browser`
5. Deploy

**Via CLI:**
```bash
# Instalar Netlify CLI
npm i -g netlify-cli

# Build local
npm run build

# Deploy
netlify deploy --prod --dir=dist/lojinha-kaka-app/browser
```

**netlify.toml** (adicionar na raiz):
```toml
[build]
  base = "lojinha-kaka-app"
  command = "npm run build"
  publish = "dist/lojinha-kaka-app/browser"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

---

### 3. Firebase Hosting

#### Vantagens
- ✅ Integração com outros serviços Firebase
- ✅ Ótimo para PWAs
- ✅ Gratuito até certo limite

#### Passos

```bash
# Instalar Firebase CLI
npm i -g firebase-tools

# Login
firebase login

# Inicializar no diretório do projeto
cd lojinha-kaka-app
firebase init hosting

# Configurar:
# - Public directory: dist/lojinha-kaka-app/browser
# - Single-page app: Yes
# - Automatic builds: No

# Build
npm run build

# Deploy
firebase deploy
```

**firebase.json:**
```json
{
  "hosting": {
    "public": "dist/lojinha-kaka-app/browser",
    "ignore": [
      "firebase.json",
      "**/.*",
      "**/node_modules/**"
    ],
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ]
  }
}
```

---

### 4. GitHub Pages

#### Vantagens
- ✅ Gratuito para repos públicos
- ✅ Integrado com GitHub
- ✅ Simples

#### Limitações
- ⚠️ Apenas sites estáticos
- ⚠️ Sem serverless functions

#### Passos

```bash
# Instalar angular-cli-ghpages
npm i -g angular-cli-ghpages

# Build com base href
ng build --base-href "https://seu-usuario.github.io/lojinha-kaka/"

# Deploy
npx angular-cli-ghpages --dir=dist/lojinha-kaka-app/browser
```

Ou adicione no `package.json`:
```json
{
  "scripts": {
    "deploy:gh": "ng build --base-href=/lojinha-kaka/ && npx angular-cli-ghpages --dir=dist/lojinha-kaka-app/browser"
  }
}
```

---

### 5. AWS S3 + CloudFront

#### Vantagens
- ✅ Controle total
- ✅ Altamente escalável
- ✅ Pode integrar com outros serviços AWS

#### Passos Básicos

```bash
# Build de produção
npm run build

# Instalar AWS CLI
# Depois configurar credenciais
aws configure

# Criar bucket S3
aws s3 mb s3://lojinha-kaka

# Configurar como site estático
aws s3 website s3://lojinha-kaka --index-document index.html --error-document index.html

# Upload de arquivos
aws s3 sync dist/lojinha-kaka-app/browser/ s3://lojinha-kaka --acl public-read

# (Opcional) Criar CloudFront distribution para CDN e HTTPS
```

---

## 🔧 Preparação para Deploy

### 1. Build de Produção

```bash
cd lojinha-kaka-app
npm run build
```

Isso gera arquivos otimizados em `dist/lojinha-kaka-app/browser/`

### 2. Testar Build Localmente

```bash
# Instalar http-server
npm i -g http-server

# Servir a pasta dist
cd dist/lojinha-kaka-app/browser
http-server -p 8080

# Acesse http://localhost:8080
```

### 3. Checklist Pré-Deploy

- [ ] Alterar senha do admin
- [ ] Verificar todas as rotas funcionam
- [ ] Testar em mobile
- [ ] Verificar imagens carregam
- [ ] Testar localStorage
- [ ] Verificar console por erros
- [ ] Minificar e otimizar imagens
- [ ] Configurar analytics (Google Analytics, etc.)
- [ ] Configurar SEO meta tags
- [ ] Adicionar favicon customizado

---

## 🔒 Configurações de Segurança

### Content Security Policy (CSP)

Adicione no `src/index.html`:

```html
<meta http-equiv="Content-Security-Policy" 
      content="default-src 'self'; 
               style-src 'self' 'unsafe-inline'; 
               script-src 'self' 'unsafe-inline' 'unsafe-eval';
               img-src 'self' data: https:;">
```

### Headers de Segurança

**Para Netlify (_headers file):**
```
/*
  X-Frame-Options: DENY
  X-Content-Type-Options: nosniff
  X-XSS-Protection: 1; mode=block
  Referrer-Policy: strict-origin-when-cross-origin
```

**Para Vercel (vercel.json):**
```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        }
      ]
    }
  ]
}
```

---

## 📊 Monitoramento e Analytics

### Google Analytics

1. Crie uma propriedade em [analytics.google.com](https://analytics.google.com)
2. Adicione o script no `src/index.html`:

```html
<!-- Google Analytics -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-XXXXXXXXXX');
</script>
```

### Sentry (Error Tracking)

```bash
npm install --save @sentry/angular
```

```typescript
// main.ts
import * as Sentry from "@sentry/angular";

Sentry.init({
  dsn: "https://sua-dsn@sentry.io/projeto",
  environment: environment.production ? 'production' : 'development'
});
```

---

## 🎯 Otimizações de Performance

### 1. Lazy Loading (futuro)

Quando o app crescer, implemente lazy loading de rotas:

```typescript
export const routes: Routes = [
  { 
    path: '', 
    loadComponent: () => import('./components/products/products.component')
      .then(m => m.ProductsComponent)
  },
  { 
    path: 'admin', 
    loadComponent: () => import('./components/admin/admin.component')
      .then(m => m.AdminComponent)
  }
];
```

### 2. Otimizar Imagens

```bash
# Instalar imagemin
npm i -g imagemin-cli imagemin-webp

# Converter e otimizar
imagemin public/images/*.webp --out-dir=public/images/optimized --plugin=webp
```

### 3. Service Worker (PWA)

```bash
ng add @angular/pwa
```

Isso adiciona:
- Service Worker para cache
- Manifest.json
- Ícones PWA
- Funcionalidade offline

---

## 🔄 CI/CD Pipeline

### GitHub Actions

Crie `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Vercel

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        working-directory: ./lojinha-kaka-app
        run: npm ci
      
      - name: Build
        working-directory: ./lojinha-kaka-app
        run: npm run build
      
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
          working-directory: ./lojinha-kaka-app
```

---

## 🌍 Domínio Customizado

### Configurar DNS

Para `www.lojinha-kaka.com`:

**Tipo A Record:**
```
@ -> IP do provedor
www -> IP do provedor
```

**Ou CNAME (Vercel/Netlify):**
```
www -> seu-projeto.vercel.app
```

### Configurar no Provedor

**Vercel:**
1. Vá em Settings > Domains
2. Adicione seu domínio
3. Configure DNS conforme instruções

**Netlify:**
1. Domain Settings > Add custom domain
2. Siga as instruções de DNS

---

## 📱 PWA (Progressive Web App)

### Adicionar suporte PWA

```bash
cd lojinha-kaka-app
ng add @angular/pwa
```

Isso cria:
- `manifest.webmanifest` - Metadados do app
- `ngsw-config.json` - Config do Service Worker
- Ícones em várias resoluções

### Customizar manifest

Edite `src/manifest.webmanifest`:

```json
{
  "name": "Lojinha do Kaka",
  "short_name": "Lojinha",
  "theme_color": "#38bdf8",
  "background_color": "#0f172a",
  "display": "standalone",
  "scope": "/",
  "start_url": "/",
  "icons": [...]
}
```

---

## ✅ Checklist Final de Deploy

- [ ] Build de produção funciona sem erros
- [ ] Todas as rotas acessíveis
- [ ] Imagens carregam corretamente
- [ ] Senha do admin alterada
- [ ] Analytics configurado
- [ ] Meta tags SEO adicionadas
- [ ] Favicon customizado
- [ ] Teste em diferentes browsers
- [ ] Teste em mobile
- [ ] HTTPS habilitado
- [ ] Domínio customizado (opcional)
- [ ] PWA configurado (opcional)
- [ ] Monitoramento de erros ativo
- [ ] Backups configurados

---

## 🎉 Pronto para Deploy!

Escolha uma das plataformas acima e siga os passos. Vercel é recomendado pela facilidade e features gratuitas.

**Boa sorte! 🚀**

