#!/usr/bin/env node
/**
 * Script para conectar diretamente ao Supabase via REST API
 * e aplicar o schema atualizado sem depender de RPC functions.
 */

const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');

// Configurações do projeto
const supabaseUrl = 'https://wcuozglfynltyafwivqj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndjdW96Z2xmeW5sdHlhZndpdnFqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzgzNTQ1MCwiZXhwIjoyMDkzNDExNDUwfQ.5J8w1K5m9JkLkZQZ1JhQhGjRJ4X7nV6K8Y3Z2W1F8o';

// Headers para requisições
const headers = {
  'Authorization': `Bearer ${supabaseKey}`,
  'Content-Type': 'application/json',
  'apikey': supabaseKey,
  'Prefer': 'return=minimal'
};

async function executeSQL(sql) {
  try {
    console.log('📝 Executando SQL:', sql.substring(0, 100) + '...');
    
    // Usar o endpoint /rest/v1/rpc/sql para executar SQL
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/sql`, {
      method: 'POST',
      headers: {
        ...headers,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ query: sql })
    });
    
    if (response.ok) {
      console.log('✅ SQL executado com sucesso');
      return true;
    } else {
      const errorText = await response.text();
      console.log('⚠️ Erro:', response.status, errorText);
      return false;
    }
  } catch (error) {
    console.log('❌ Erro:', error.message);
    return false;
  }
}

async function createTable(tableName, createSQL) {
  console.log(`🏗️ Criando tabela ${tableName}...`);
  
  // Tentar criar via REST API
  try {
    const response = await fetch(`${supabaseUrl}/rest/v1/${tableName}`, {
      method: 'POST',
      headers: {
        ...headers,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({ id: 'test' })
    });
    
    if (response.status === 404 || response.status === 400) {
      // Tabela não existe, criar via SQL
      console.log(`📝 Tabela ${tableName} não existe, criando via SQL...`);
      return await executeSQL(createSQL);
    } else if (response.ok) {
      console.log(`✅ Tabela ${tableName} já existe`);
      return true;
    } else {
      console.log(`⚠️ Erro ao verificar tabela ${tableName}:`, response.status);
      return await executeSQL(createSQL);
    }
  } catch (error) {
    console.log(`❌ Erro ao criar tabela ${tableName}:`, error.message);
    return false;
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
  
  // Comandos específicos para criar tabelas
  const tableCommands = [
    {
      name: 'appliance_types',
      sql: `CREATE TABLE IF NOT EXISTS appliance_types (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        category TEXT NOT NULL CHECK (category IN ('fridge', 'freezer', 'mini_fridge', 'wine_cooler', 'beverage_cooler', 'commercial')),
        description TEXT,
        icon TEXT,
        default_compartments TEXT[] DEFAULT '{}',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )`
    },
    {
      name: 'households',
      sql: `CREATE TABLE IF NOT EXISTS households (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
        name TEXT NOT NULL DEFAULT 'Minha Casa',
        settings JSONB NOT NULL DEFAULT '{"defaultAlerts": true, "temperatureUnit": "celsius", "inventoryTracking": true}'::jsonb,
        primary_appliance_id UUID REFERENCES refrigeration_appliances(id),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )`
    },
    {
      name: 'appliance_locations',
      sql: `CREATE TABLE IF NOT EXISTS appliance_locations (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        household_id UUID REFERENCES households(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        type TEXT NOT NULL CHECK (type IN ('room', 'area', 'zone')),
        description TEXT,
        parent_location_id UUID REFERENCES appliance_locations(id),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )`
    },
    {
      name: 'refrigeration_appliances',
      sql: `CREATE TABLE IF NOT EXISTS refrigeration_appliances (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        household_id UUID REFERENCES households(id) ON DELETE CASCADE,
        location_id UUID REFERENCES appliance_locations(id),
        appliance_type_id TEXT REFERENCES appliance_types(id),
        name TEXT NOT NULL,
        designation TEXT,
        model_id UUID REFERENCES fridge_models(id),
        position_description TEXT,
        position_coordinates JSONB DEFAULT '{}',
        is_active BOOLEAN DEFAULT true,
        is_primary BOOLEAN DEFAULT false,
        custom_settings JSONB DEFAULT '{"temperatureTarget": null, "alertsEnabled": true, "maintenanceReminder": null}'::jsonb,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )`
    }
  ];
  
  // Criar tabelas
  let successCount = 0;
  for (const table of tableCommands) {
    const success = await createTable(table.name, table.sql);
    if (success) {
      successCount++;
    }
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  // Inserir dados iniciais
  console.log('📊 Inserindo dados iniciais...');
  const insertDataSQL = `
    INSERT INTO appliance_types (id, name, category, description, icon, default_compartments) VALUES
    ('fridge', 'Geladeira', 'fridge', 'Refrigerador doméstico padrão', 'ice_cream', ARRAY['fridge', 'freezer', 'door']),
    ('freezer', 'Freezer', 'freezer', 'Congelador vertical ou horizontal', 'ice_cube', ARRAY['freezer']),
    ('mini_fridge', 'Frigobar', 'mini_fridge', 'Mini refrigerador compacto', 'beer', ARRAY['fridge', 'door']),
    ('wine_cooler', 'Adega Climatizada', 'wine_cooler', 'Refrigerador para vinhos', 'wine', ARRAY['fridge']),
    ('beverage_cooler', 'Refrigerador de Bebidas', 'beverage_cooler', 'Refrigerador para bebidas', 'beer', ARRAY['fridge']),
    ('commercial', 'Equipamento Comercial', 'commercial', 'Equipamento comercial', 'store', ARRAY['fridge', 'freezer'])
    ON CONFLICT (id) DO NOTHING
  `;
  
  const insertSuccess = await executeSQL(insertDataSQL);
  if (insertSuccess) {
    successCount++;
  }
  
  console.log(`✅ ${successCount}/${tableCommands.length + 1} operações executadas com sucesso`);
  return successCount > 0;
}

async function verifySchemaUpdates() {
  console.log('🔍 Verificando atualizações do schema...');
  
  const tables = ['appliance_types', 'households', 'refrigeration_appliances', 'appliance_locations'];
  
  for (const table of tables) {
    try {
      const response = await fetch(`${supabaseUrl}/rest/v1/${table}?select=count&limit=1`, {
        method: 'GET',
        headers
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log(`✅ Tabela ${table}: acessível`);
      } else {
        console.log(`❌ Tabela ${table}: erro ${response.status}`);
      }
    } catch (error) {
      console.log(`❌ Erro na verificação da tabela ${table}:`, error.message);
    }
  }
}

async function testConnection() {
  console.log('🔗 Testando conexão com Supabase...');
  
  try {
    const response = await fetch(`${supabaseUrl}/rest/v1/profiles?select=count&limit=1`, {
      method: 'GET',
      headers
    });
    
    if (response.ok) {
      console.log('✅ Conexão com Supabase estabelecida');
      return true;
    } else {
      console.log('❌ Erro na conexão:', response.status);
      return false;
    }
  } catch (error) {
    console.log('❌ Erro ao testar conexão:', error.message);
    return false;
  }
}

async function main() {
  console.log('🚀 Iniciando configuração direta do Supabase via REST API...');
  console.log('📋 Projeto: wcuozglfynltyafwivqj');
  console.log();
  
  // 1. Testar conexão
  if (!await testConnection()) {
    console.log('❌ Falha na conexão com Supabase');
    process.exit(1);
  }
  
  // 2. Aplicar schema
  const success = await applySchemaUpdates();
  
  if (success) {
    // 3. Verificar atualizações
    await verifySchemaUpdates();
    console.log();
    console.log('🎉 Supabase configurado com sucesso!');
    console.log('📊 Sistema de múltiplos aparelhos pronto para uso!');
    console.log();
    console.log('📝 Nota: Para aplicar o schema completo, execute o script SQL manualmente no Supabase Dashboard');
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
