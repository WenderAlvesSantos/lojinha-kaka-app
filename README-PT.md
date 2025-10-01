# 🍎 Lojinha do Kaka - Sistema de Gerenciamento de Estoque

Uma aplicação Angular moderna para gerenciar o estoque de frutas de jogo (Blox Fruits).

## 📋 Funcionalidades

- **Página de Produtos**: Visualização pública do catálogo de frutas com estoque e preços
- **Painel Admin**: Interface administrativa protegida por senha para gerenciar o estoque
- **Persistência Local**: Os dados são salvos no localStorage do navegador
- **Design Responsivo**: Interface moderna e responsiva que funciona em todos os dispositivos
- **Atualizações em Tempo Real**: Mudanças no estoque são refletidas imediatamente

## 🚀 Como Executar

### Pré-requisitos

- Node.js (versão 18 ou superior recomendada)
- npm

### Instalação

```bash
# Navegar para o diretório do projeto
cd lojinha-kaka-app

# Instalar dependências
npm install

# Iniciar o servidor de desenvolvimento
npm start
```

A aplicação estará disponível em `http://localhost:4200`

### Build para Produção

```bash
npm run build
```

Os arquivos de produção estarão na pasta `dist/lojinha-kaka-app/browser`

## 🔐 Acesso Admin

- **URL**: `/admin`
- **Senha padrão**: `kaka123`

⚠️ **Importante**: Em produção, altere a senha no arquivo `src/app/components/admin/admin.component.ts`

## 📁 Estrutura do Projeto

```
src/
├── app/
│   ├── components/
│   │   ├── products/          # Página de produtos
│   │   └── admin/             # Painel administrativo
│   ├── models/
│   │   └── product.model.ts   # Interface Product
│   ├── services/
│   │   └── inventory.service.ts  # Serviço de gerenciamento de estoque
│   ├── app.component.*        # Componente raiz com navegação
│   ├── app.routes.ts          # Configuração de rotas
│   └── app.config.ts          # Configuração da aplicação
└── styles.scss                # Estilos globais
```

## 🎨 Recursos Técnicos

- **Framework**: Angular 18
- **Standalone Components**: Arquitetura moderna sem módulos
- **RxJS**: Gerenciamento reativo de estado
- **SCSS**: Estilização avançada
- **TypeScript**: Tipagem forte e segurança
- **LocalStorage**: Persistência de dados no navegador

## 🔄 Próximos Passos Sugeridos

1. **Backend API**: Integrar com um backend real (Node.js/Express, NestJS, etc.)
2. **Autenticação JWT**: Implementar autenticação mais robusta
3. **Histórico de Mudanças**: Adicionar log de alterações no estoque
4. **Upload de Imagens**: Permitir adicionar novos produtos via interface
5. **Relatórios**: Dashboard com estatísticas de vendas e estoque
6. **Multi-usuário**: Sistema de permissões e múltiplos administradores
7. **Notificações**: Alertas quando estoque estiver baixo
8. **Carrinho de Compras**: Funcionalidade de e-commerce completa

## 🛠️ Escalabilidade e Manutenibilidade

### Arquitetura

O projeto foi estruturado seguindo boas práticas do Angular:

- **Separação de Responsabilidades**: Componentes, serviços e modelos em pastas distintas
- **Serviço Centralizado**: `InventoryService` gerencia todo o estado do inventário
- **Observables**: Uso de RxJS para programação reativa
- **Standalone Components**: Reduz complexidade e melhora tree-shaking

### Preparação para Backend

O `InventoryService` foi projetado para facilitar a migração para uma API:

```typescript
// Exemplo de como adicionar chamadas HTTP no futuro
import { HttpClient } from '@angular/common/http';

constructor(private http: HttpClient) { }

getProducts(): Observable<Product[]> {
  return this.http.get<Product[]>('/api/products');
}
```

### Boas Práticas Implementadas

- Tipagem forte com TypeScript
- Interface `Product` bem definida
- Tratamento de erros em operações de storage
- Componentização adequada
- Estilos encapsulados por componente
- Acessibilidade (aria-labels nos botões)

## 📝 Licença

Este projeto foi criado para fins educacionais e comerciais.

## 👨‍💻 Desenvolvido por

Migrado para Angular com arquitetura moderna e escalável.

