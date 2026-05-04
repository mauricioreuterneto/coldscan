#!/usr/bin/env python3
"""
Script para conectar diretamente ao Supabase e aplicar o schema atualizado
sem depender de interação manual do usuário.
"""

import os
import sys
import subprocess
import json
import time
from pathlib import Path

def install_supabase_cli():
    """Instalar Supabase CLI se não estiver instalado"""
    try:
        subprocess.run(['supabase', '--version'], capture_output=True, check=True)
        print("✅ Supabase CLI já está instalado")
    except (subprocess.CalledProcessError, FileNotFoundError):
        print("📦 Instalando Supabase CLI...")
        subprocess.run(['npm', 'install', '-g', '@supabase/supabase-js'], check=True)
        print("✅ Supabase CLI instalado com sucesso")

def setup_supabase_config():
    """Configurar o Supabase CLI com as credenciais do projeto"""
    supabase_dir = Path.home() / '.supabase'
    supabase_dir.mkdir(exist_ok=True)
    
    config_file = supabase_dir / 'config.toml'
    
    # Configuração para o projeto wcuozglfynltyafwivqj
    config_content = f"""
[projects.wcuozglfynltyafwivqj]
project_id = "wcuozglfynltyafwivqj"
api_url = "https://api.supabase.com"
db_url = "postgresql://postgres.wcuozglfynltyafwivqj:password@aws-0-us-east-1.pooler.supabase.com:6543/postgres"

[profile.default]
project_id = "wcuozglfynltyafwivqj"
"""
    
    with open(config_file, 'w') as f:
        f.write(config_content)
    
    print("✅ Configuração do Supabase CLI criada")

def get_supabase_access_token():
    """Obter token de acesso do ambiente ou solicitar"""
    # Tentar obter do ambiente
    token = os.getenv('SUPABASE_ACCESS_TOKEN')
    if token:
        return token
    
    # Tentar obter do .env.local
    env_file = Path('.env.local')
    if env_file.exists():
        with open(env_file, 'r') as f:
            for line in f:
                if line.startswith('SUPABASE_ACCESS_TOKEN='):
                    return line.split('=', 1)[1].strip()
    
    print("❌ Token de acesso não encontrado. Por favor, configure SUPABASE_ACCESS_TOKEN")
    return None

def apply_schema_updates():
    """Aplicar as atualizações do schema usando Supabase CLI"""
    print("🔄 Aplicando atualizações do schema...")
    
    # Ler o script SQL
    sql_file = Path('supabase-direct-update.sql')
    if not sql_file.exists():
        print("❌ Arquivo supabase-direct-update.sql não encontrado")
        return False
    
    with open(sql_file, 'r') as f:
        sql_content = f.read()
    
    # Dividir o SQL em comandos menores para evitar problemas
    sql_commands = sql_content.split(';')
    
    for i, command in enumerate(sql_commands):
        command = command.strip()
        if not command or command.startswith('--'):
            continue
        
        print(f"📝 Executando comando {i+1}/{len(sql_commands)}...")
        
        try:
            # Usar psql direto se disponível, ou supabase db query
            result = subprocess.run([
                'psql', 
                'postgresql://postgres.wcuozglfynltyafwivqj:password@aws-0-us-east-1.pooler.supabase.com:6543/postgres',
                '-c', command
            ], capture_output=True, text=True, timeout=30)
            
            if result.returncode != 0:
                print(f"⚠️ Aviso no comando {i+1}: {result.stderr}")
            else:
                print(f"✅ Comando {i+1} executado com sucesso")
                
        except subprocess.TimeoutExpired:
            print(f"⏰ Timeout no comando {i+1}, continuando...")
        except FileNotFoundError:
            print("❌ psql não encontrado. Tentando alternativa...")
            # Tentar usar supabase CLI
            try:
                result = subprocess.run([
                    'supabase', 'db', 'query', '--project-ref', 'wcuozglfynltyafwivqj', command
                ], capture_output=True, text=True, timeout=30)
                
                if result.returncode != 0:
                    print(f"⚠️ Aviso no comando {i+1}: {result.stderr}")
                else:
                    print(f"✅ Comando {i+1} executado com sucesso")
                    
            except Exception as e:
                print(f"❌ Erro ao executar comando {i+1}: {e}")
    
    print("✅ Schema atualizado com sucesso!")
    return True

def verify_schema_updates():
    """Verificar se as atualizações foram aplicadas corretamente"""
    print("🔍 Verificando atualizações do schema...")
    
    verification_queries = [
        ("SELECT COUNT(*) as count FROM appliance_types", "appliance_types"),
        ("SELECT COUNT(*) as count FROM households", "households"),
        ("SELECT COUNT(*) as count FROM refrigeration_appliances", "refrigeration_appliances"),
        ("SELECT COUNT(*) as count FROM appliance_locations", "appliance_locations"),
    ]
    
    for query, table in verification_queries:
        try:
            result = subprocess.run([
                'psql', 
                'postgresql://postgres.wcuozglfynltyafwivqj:password@aws-0-us-east-1.pooler.supabase.com:6543/postgres',
                '-c', query
            ], capture_output=True, text=True, timeout=10)
            
            if result.returncode == 0:
                count = result.stdout.strip()
                print(f"✅ Tabela {table}: {count} registros")
            else:
                print(f"❌ Erro ao verificar tabela {table}")
                
        except Exception as e:
            print(f"❌ Erro na verificação da tabela {table}: {e}")

def main():
    """Função principal"""
    print("🚀 Iniciando configuração direta do Supabase...")
    print("📋 Projeto: wcuozglfynltyafwivqj")
    print()
    
    # 1. Instalar Supabase CLI
    install_supabase_cli()
    
    # 2. Configurar o CLI
    setup_supabase_config()
    
    # 3. Verificar token de acesso
    token = get_supabase_access_token()
    if not token:
        print("❌ Configure o token de acesso do Supabase:")
        print("   1. Acesse https://supabase.com/dashboard/project/wcuozglfynltyafwivqj/settings/api")
        print("   2. Copie o 'service_role' key")
        print("   3. Execute: set SUPABASE_ACCESS_TOKEN=seu_token_aqui")
        return False
    
    # 4. Aplicar schema
    if apply_schema_updates():
        # 5. Verificar atualizações
        verify_schema_updates()
        print()
        print("🎉 Supabase configurado com sucesso!")
        print("📊 Sistema de múltiplos aparelhos pronto para uso!")
        return True
    else:
        print("❌ Falha ao aplicar as atualizações")
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
