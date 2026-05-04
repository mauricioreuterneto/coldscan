# 🚀 Guia de Configuração - Fridge Scanner

## 📋 Pré-requisitos

- Node.js 18+ instalado
- Conta no Supabase
- Conta no GitHub
- Editor de código (VS Code recomendado)

## 🔧 Configuração do Supabase

### 1. Executar Script SQL

1. Acesse o painel do Supabase: https://supabase.com/dashboard
2. Selecione seu projeto: `wcuozglfynltyafwivqj`
3. Vá para **SQL Editor** → **New query**
4. Copie e cole o conteúdo do arquivo `supabase-setup.sql`
5. Clique em **Run** para executar

### 2. Verificar Configurações

Após executar o script, verifique se as tabelas foram criadas:
- **Database** → **Tables** → deve mostrar: `profiles`, `fridge_models`, `products`, `shopping_lists`
- **Storage** → deve mostrar o bucket `product-images`

## 🔧 Configuração do GitHub

### 1. Configurar Secrets

1. Vá para o repositório: https://github.com/mauricioreuterneto/coldscan
2. Clique em **Settings** → **Secrets and variables** → **Actions**
3. Clique em **New repository secret**
4. Adicione os seguintes secrets:

```
REACT_APP_SUPABASE_URL
https://wcuozglfynltyafwivqj.supabase.co

REACT_APP_SUPABASE_ANON_KEY
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndjdW96Z2xmeW5sdHlhZndpdnFqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc4MzU0NTAsImV4cCI6MjA5MzQxMTQ1MH0.kSgbxJX9cb0vB7MioU2muZh3uuiR0HgnjwzTFmBHlsM
```

### 2. Habilitar GitHub Pages

1. No repositório, vá para **Settings** → **Pages**
2. Em **Source**, selecione **GitHub Actions**
3. Salve as configurações

## 🚀 Executando Localmente

### 1. Instalar Dependências

```bash
npm install --legacy-peer-deps
```

### 2. Configurar Variáveis de Ambiente

O arquivo `.env` já está configurado com as credenciais do Supabase.

### 3. Iniciar o Servidor

```bash
npm start
```

O aplicativo estará disponível em `http://localhost:3000`

## 📱 Fluxo de Uso

### 1. Primeiro Acesso

1. Abra o aplicativo
2. Crie uma nova conta ou faça login
3. Selecione o modelo da sua geladeira
4. Comece a adicionar produtos

### 2. Adicionando Produtos

1. Clique no botão flutuante (+)
2. Preencha as informações do produto
3. Use o scanner de código de barras (opcional)
4. Tire uma foto (opcional)
5. Defina localização e validade

### 3. Gerenciamento

- **Home**: Visualização da geladeira com alertas
- **Produtos**: Lista completa com busca
- **Configurações**: Estatísticas e preferências

## 🔗 Links Importantes

- **Repositório GitHub**: https://github.com/mauricioreuterneto/coldscan
- **Painel Supabase**: https://supabase.com/dashboard/project/wcuozglfynltyafwivqj
- **Deploy (após configuração)**: https://mauricioreuterneto.github.io/coldscan

## 🐛 Solução de Problemas

### Problemas Comuns

1. **Erro de autenticação**
   - Verifique se as credenciais no `.env` estão corretas
   - Confirme se o script SQL foi executado

2. **Erro de build no GitHub**
   - Verifique se os secrets foram configurados corretamente
   - Confirme se o GitHub Pages está habilitado

3. **Scanner não funciona**
   - Verifique se o navegador tem permissão para usar a câmera
   - Use HTTPS (localhost já é seguro)

### Logs e Debug

- **Console do navegador**: Verifique erros de JavaScript
- **Supabase Logs**: Dashboard → Logs
- **GitHub Actions**: Actions → Verificar workflow

## 🚀 Deploy Automático

Após configurar os secrets no GitHub, cada push para a branch `main` irá:

1. Rodar testes automáticos
2. Buildar o aplicativo
3. Fazer deploy para GitHub Pages
4. Atualizar o site em: https://mauricioreuterneto.github.io/coldscan

## 📞 Suporte

Se encontrar problemas:

1. Verifique este guia de solução de problemas
2. Abra uma issue no repositório GitHub
3. Consulte os logs do navegador e Supabase

---

**Parabéns! 🎉 Seu Fridge Scanner está configurado e pronto para usar!**
