# Fridge Scanner - Aplicativo de Gestão de Geladeira

Um aplicativo completo de scan e gestão para geladeira que permite identificar o modelo da sua geladeira, visualizar seu interior em detalhes e gerenciar todos os produtos e alimentos de forma inteligente.

## 🚀 Funcionalidades Principais

### 📱 Sistema de Scan e Reconhecimento
- **Scan de Código de Barras**: Identifique produtos automaticamente usando a câmera
- **Seleção de Modelo**: Escolha entre modelos populares de geladeiras (Brastemp, Consul, Samsung)
- **Visualização Detalhada**: Veja o interior da sua geladeira com compartimentos precisos

### 🏠 Visualização da Geladeira
- **Layout 2D Interativo**: Visualização clara dos compartimentos (geladeira, freezer, porta)
- **Prateleiras Detalhadas**: Cada compartimento com suas prateleiras e capacidades
- **Indicadores de Ocupação**: Barras de progresso mostrando o uso de cada espaço
- **Cores Intuitivas**: Diferentes cores para geladeira (azul), freezer (ciano) e porta (amarelo)

### 📦 Gestão de Produtos
- **Cadastro Completo**: Adicione produtos com foto, validade, quantidade e localização
- **Scan Automático**: Use o código de barras para preencher informações rapidamente
- **Categorias Inteligentes**: Organize produtos por categorias (Laticínios, Carnes, Frutas, etc.)
- **Localização Precisa**: Defina exatamente onde cada produto está na geladeira

### ⚠️ Sistema de Alertas
- **Validade Próxima**: Alertas visuais para produtos vencendo em breve
- **Produtos Vencidos**: Identificação clara de itens que já venceram
- **Estoque Baixo**: Avisos quando produtos estão acabando
- **Cores de Alerta**: Vermelho (vencido), amarelo (vencendo), azul (estoque baixo)

### 🔍 Busca e Filtros
- **Busca Rápida**: Encontre produtos por nome, categoria ou observações
- **Filtros Inteligentes**: Filtre por categoria, validade ou localização
- **Visualização Completa**: Lista detalhada de todos os produtos com informações relevantes

### 📊 Estatísticas e Configurações
- **Dashboard Informativo**: Veja estatísticas importantes sobre sua geladeira
- **Configurações Flexíveis**: Ajuste alertas e preferências conforme necessário
- **Dados Persistentes**: Todas as informações são salvas localmente no navegador

## 🛠️ Tecnologias Utilizadas

- **React 19** com TypeScript
- **Tailwind CSS** para estilização moderna
- **HTML5-QRCode** para funcionalidade de scan
- **Lucide React** para ícones elegantes
- **LocalStorage** para persistência de dados
- **@dnd-kit** para funcionalidades de drag & drop (futuro)

## 📋 Pré-requisitos

- Node.js 16+ instalado
- NPM ou Yarn
- Navegador moderno com suporte a WebRTC (para câmera)

## 🚀 Instalação e Execução

1. **Clone o repositório**:
```bash
git clone <repositório-url>
cd fridge-scanner
```

2. **Instale as dependências**:
```bash
npm install --legacy-peer-deps
```

3. **Inicie o servidor de desenvolvimento**:
```bash
npm start
```

4. **Abra o aplicativo**:
   - Acesse `http://localhost:3000` no seu navegador
   - Se a porta 3000 estiver ocupada, use outra porta como `PORT=3001 npm start`

## 📱 Como Usar

### 1. Configuração Inicial
- Ao abrir o aplicativo pela primeira vez, selecione o modelo da sua geladeira
- Use a busca para encontrar seu modelo ou escaneie a etiqueta
- Confirme a seleção para continuar

### 2. Adicionando Produtos
- Clique no botão flutuante (+) para adicionar um novo produto
- Preencha as informações manualmente ou use o scanner de código de barras
- Tire uma foto do produto (opcional)
- Defina a localização exata (compartimento e prateleira)
- Configure validade e quantidade

### 3. Visualizando a Geladeira
- Na tela principal, veja o layout completo da sua geladeira
- Clique nos compartimentos para ver detalhes
- Visualize produtos organizados por prateleira
- Monitore a ocupação com as barras de progresso

### 4. Gerenciando Produtos
- Acesse a aba "Produtos" para ver todos os itens
- Use a busca para encontrar produtos específicos
- Clique em qualquer produto para editar suas informações
- Receba alertas visuais sobre validade e estoque

## 🎯 Funcionalidades Futuras

- [ ] **Drag & Drop**: Arrastar produtos entre compartimentos
- [ ] **Lista de Compras**: Geração automática baseada no estoque
- [ ] **Receitas**: Sugestões baseadas nos ingredientes disponíveis
- [ ] **Relatórios**: Análise de consumo e desperdício
- [ ] **Sincronização**: Backup na nuvem e sincronização entre dispositivos
- [ ] **Modo Offline**: Funcionalidade completa sem internet
- [ ] **Notificações Push**: Alertas mesmo com o app fechado

## 🏗️ Estrutura do Projeto

```
src/
├── components/          # Componentes React reutilizáveis
│   ├── BarcodeScanner.tsx
│   ├── FridgeModelSelector.tsx
│   ├── FridgeViewer.tsx
│   └── ProductForm.tsx
├── hooks/              # Hooks personalizados
│   ├── useLocalStorage.ts
│   ├── useFridgeModel.ts
│   └── useProducts.ts
├── types/              # Definições TypeScript
│   └── index.ts
├── utils/              # Funções utilitárias
│   └── index.ts
└── pages/              # Páginas principais
    └── App.tsx
```

## 🤝 Contribuição

Contribuições são bem-vindas! Por favor:

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/nova-funcionalidade`)
3. Commit suas mudanças (`git commit -m 'Adiciona nova funcionalidade'`)
4. Push para a branch (`git push origin feature/nova-funcionalidade`)
5. Abra um Pull Request

## 📝 Licença

Este projeto está licenciado sob a MIT License.

## 🐛 Problemas e Sugestões

Encontrou um problema ou tem uma sugestão? Por favor, abra uma issue no GitHub com detalhes sobre:

- Descrição do problema
- Passos para reproduzir
- Comportamento esperado
- Screenshots (se aplicável)

## 📞 Suporte

Para suporte ou dúvidas, entre em contato através das issues do GitHub.

---

**Fridge Scanner** - Transformando a gestão da sua geladeira em uma experiência simples e eficiente! 🧊✨
