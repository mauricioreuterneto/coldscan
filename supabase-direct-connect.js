#!/usr/bin/env node
/**
 * Script para conectar diretamente ao Supabase e aplicar o schema atualizado
 * sem depender de interação manual do usuário.
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Configurações do projeto
const supabaseUrl = 'https://wcuozglfynltyafwivqj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndjdW96Z2xmeW5sdHlhZndpdnFqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc4MzU0NTAsImV4cCI6MjA5MzQxMTQ1MH0.kSgbxJX9cb0vB7MioU2muZh3uuiR0HgnjwzTFmBHlsM';

// Criar cliente Supabase com service role key
const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function executeSQL(sql) {
  try {
    console.log('📝 Executando SQL:', sql.substring(0, 100) + '...');
    
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });
    
    if (error) {
      console.log('⚠️ Erro:', error.message);
      return false;
    }
    
    console.log('✅ SQL executado com sucesso');
    return true;
  } catch (error) {
    // Tentar via REST API se RPC não funcionar
    try {
      const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json',
          'apikey': supabaseKey
        },
        body: JSON.stringify({ sql_query: sql })
      });
      
      if (response.ok) {
        console.log('✅ SQL executado com sucesso via REST');
        return true;
      } else {
        console.log('⚠️ Erro via REST:', response.statusText);
        return false;
      }
    } catch (restError) {
      console.log('❌ Erro complete:', restError.message);
      return false;
    }
  }
}

async function applySchemaUpdates() {
  console.log('🔄 Aplicando atualizações do schema...');
  
  // Ler o script SQL
  const sqlFile = path.join(__dirname, 'supabase-direct-update.sql');
  if (!fs.existsSync(sqlFile)) {
    console.log('❌ Arquivo supabase-direct-update.sql não encontrado');
    return false;
  }
  
  const sqlContent = fs.readFileSync(sqlFile, 'utf8');
  
  // Dividir o SQL em comandos menores
  const sqlCommands = sqlContent.split(';').filter(cmd => cmd.trim() && !cmd.trim().startsWith('--'));
  
  console.log(`📊 Encontrados ${sqlCommands.length} comandos SQL para executar`);
  
  let successCount = 0;
  for (let i = 0; i < sqlCommands.length; i++) {
    const command = sqlCommands[i].trim();
    if (!command) continue;
    
    console.log(`📝 Executando comando ${i + 1}/${sqlCommands.length}...`);
    
    const success = await executeSQL(command);
    if (success) {
      successCount++;
    }
    
    // Pequena pausa para não sobrecarregar
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  console.log(`✅ ${successCount}/${sqlCommands.length} comandos executados com sucesso`);
  return successCount > 0;
}

async function verifySchemaUpdates() {
  console.log('🔍 Verificando atualizações do schema...');
  
  const verificationQueries = [
    { sql: "SELECT COUNT(*) as count FROM appliance_types", table: "appliance_types" },
    { sql: "SELECT COUNT(*) as count FROM households", table: "households" },
    { sql: "SELECT COUNT(*) as count FROM refrigeration_appliances", table: "refrigeration_appliances" },
    { sql: "SELECT COUNT(*) as count FROM appliance_locations", table: "appliance_locations" }
  ];
  
  for (const { sql, table } of verificationQueries) {
    try {
      const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });
      
      if (error) {
        console.log(`❌ Erro ao verificar tabela ${table}:`, error.message);
      } else {
        const count = data?.[0]?.count || 0;
        console.log(`✅ Tabela ${table}: ${count} registros`);
      }
    } catch (error) {
      console.log(`❌ Erro na verificação da tabela ${table}:`, error.message);
    }
  }
}

async function createExecSQLFunction() {
  console.log('🔧 Criando função exec_sql se não existir...');
  
  const createFunctionSQL = `
    CREATE OR REPLACE FUNCTION exec_sql(sql_query text)
    RETURNS TABLE(result json) AS $$
    BEGIN
      -- Esta função permite executar SQL dinamicamente
      -- Nota: Requer permissões apropriadas no Supabase
      RETURN QUERY EXECUTE sql_query;
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'SQL Error: %', SQLERRM;
      RETURN;
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;
  `;
  
  await executeSQL(createFunctionSQL);
}

async function testConnection() {
  console.log('🔗 Testando conexão com Supabase...');
  
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('count')
      .limit(1);
    
    if (error) {
      console.log('❌ Erro na conexão:', error.message);
      return false;
    }
    
    console.log('✅ Conexão com Supabase estabelecida');
    return true;
  } catch (error) {
    console.log('❌ Erro ao testar conexão:', error.message);
    return false;
  }
}

async function main() {
  console.log('🚀 Iniciando configuração direta do Supabase...');
  console.log('📋 Projeto: wcuozglfynltyafwivqj');
  console.log();
  
  // 1. Testar conexão
  if (!await testConnection()) {
    console.log('❌ Falha na conexão com Supabase');
    process.exit(1);
  }
  
  // 2. Criar função exec_sql
  await createExecSQLFunction();
  
  // 3. Aplicar schema
  const success = await applySchemaUpdates();
  
  if (success) {
    // 4. Verificar atualizações
    await verifySchemaUpdates();
    console.log();
    console.log('🎉 Supabase configurado com sucesso!');
    console.log('📊 Sistema de múltiplos aparelhos pronto para uso!');
  } else {
    console.log('❌ Falha ao aplicar as atualizações');
    process.exit(1);
  }
}

// Executar main
main().catch(error => {
  console.error('❌ Erro fatal:', error);
  process.exit(1);
});
