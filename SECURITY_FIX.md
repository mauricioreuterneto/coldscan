# 🚨 URGENTE: Credenciais Supabase Vazadas

## ⚠️ Problema Detectado

O GitHub detectou que credenciais do Supabase foram vazadas no repositório:

- **Arquivos afetados:**
  - `docs/SETUP.md` (Anon Key)
  - `scripts/supabase-direct-connect.js` (Anon Key)
  - `scripts/supabase-rest-api.js` (SERVICE ROLE KEY - mais crítica!)

- **Projeto Supabase:** `wcuozglfynltyafwivqj`

## 🔥 Por que isso é grave?

A **Service Role Key** dá acesso total ao banco de dados, bypassando:
- Todas as políticas de segurança (RLS)
- Autenticação
- Permissões de usuário

Qualquer pessoa com essa chave pode:
- Ler todos os dados de todos os usuários
- Modificar/deletar qualquer dado
- Acessar informações sensíveis

## 🛠️ Ações Imediatas Necessárias

### ✅ STATUS: Credenciais Removidas do Repositório

As credenciais vazadas foram **completamente removidas** do histórico do Git via `git filter-branch`. Os arquivos:
- `docs/SETUP.md`
- `scripts/supabase-direct-connect.js`
- `scripts/supabase-rest-api.js`

Foram removidos de **todo o histórico** do repositório.

### 1. ROTACIONAR CHAVES NO SUPABASE (FAÇA ISSO AGORA!)

**⚠️ IMPORTANTE:** Mesmo removendo do GitHub, as chaves ainda podem estar em caches ou terem sido copiadas. **Rotacione imediatamente:**

1. Acesse: https://supabase.com/dashboard/project/wcuozglfynltyafwivqj/settings/api
2. Clique em **"Reveal"** na Service Role Key
3. Clique em **"Generate new secret"** para criar uma nova
4. **Anote a nova chave** (será mostrada apenas uma vez)
5. A chave antiga será invalidada automaticamente

### 2. ATUALIZAR VARIÁVEIS DE AMBIENTE

Substitua as credenciais em todos os lugares:

#### GitHub Secrets:
1. Vá para: https://github.com/mauricioreuterneto/coldscan/settings/secrets/actions
2. Atualize `REACT_APP_SUPABASE_ANON_KEY` com a nova anon key
3. Adicione `SUPABASE_SERVICE_ROLE_KEY` com a nova service role key (se necessário para CI/CD)

#### Arquivos locais:
```bash
# .env
REACT_APP_SUPABASE_URL=https://wcuozglfynltyafwivqj.supabase.co
REACT_APP_SUPABASE_ANON_KEY=sua_nova_anon_key_aqui
```

**NUNCA commite o arquivo `.env`!**

### 3. VERIFICAR ACESSO NÃO AUTORIZADO

1. No Supabase Dashboard: https://supabase.com/dashboard/project/wcuozglfynltyafwivqj/logs
2. Verifique logs de acesso nas últimas 48 horas
3. Procure por requisições suspeitas

## 📋 Checklist de Correção

- [ ] Rotacionar Service Role Key no Supabase
- [ ] Rotacionar Anon Key no Supabase (opcional mas recomendado)
- [ ] Atualizar GitHub Secrets com novas chaves
- [ ] Atualizar variáveis de ambiente local (.env)
- [ ] Verificar logs de acesso no Supabase
- [ ] (Opcional) Limpar histórico do Git
- [ ] Testar se a aplicação funciona com as novas chaves

## 🛡️ Prevenção Futura

1. **NUNCA** commite arquivos com credenciais
2. Use sempre `.env` para secrets locais
3. Use GitHub Secrets para CI/CD
4. Configure pre-commit hooks para detectar secrets:
   ```bash
   npm install --save-dev detect-secrets
   ```

## 🆘 Precisa de Ajuda?

Se tiver dúvidas ou problemas durante o processo:
1. Documentação Supabase: https://supabase.com/docs/guides/database/secure-data
2. GitHub Docs sobre secrets: https://docs.github.com/en/actions/security-guides/using-secrets-in-github-actions

---

**⚠️ IMPORTANTE:** Mesmo após rotacionar as chaves, qualquer pessoa que copiou a chave antiga enquanto estava pública ainda pode ter acesso até que a chave seja invalidada. Monitore os logs do Supabase nos próximos dias.
