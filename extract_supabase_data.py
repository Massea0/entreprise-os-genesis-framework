#!/usr/bin/env python3
"""
Script pour extraire les données Supabase en JSON
Usage: python extract_supabase_data.py
"""

import os
import json
from supabase import create_client, Client

# Configuration Supabase (à modifier avec vos vraies clés)
SUPABASE_URL = "https://your-project.supabase.co"
SUPABASE_KEY = "your-anon-key"

def main():
    try:
        # Initialiser le client Supabase
        supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
        
        # Tables à vérifier
        tables = ['projects', 'employees', 'tasks', 'devis', 'invoices']
        
        results = {}
        
        for table in tables:
            try:
                print(f"📊 Extraction de la table '{table}'...")
                
                # Récupérer les données
                response = supabase.table(table).select("*").limit(10).execute()
                
                results[table] = {
                    'count': len(response.data),
                    'data': response.data
                }
                
                print(f"   ✅ {len(response.data)} enregistrements trouvés")
                
            except Exception as e:
                print(f"   ❌ Erreur pour la table '{table}': {str(e)}")
                results[table] = {
                    'error': str(e),
                    'count': 0,
                    'data': []
                }
        
        # Récupérer les utilisateurs (auth.users)
        try:
            print("👤 Extraction des utilisateurs...")
            auth_response = supabase.auth.admin.list_users()
            results['users'] = {
                'count': len(auth_response.users) if auth_response.users else 0,
                'data': [
                    {
                        'id': user.id,
                        'email': user.email,
                        'role': user.role,
                        'user_metadata': user.user_metadata,
                        'created_at': str(user.created_at)
                    } for user in (auth_response.users or [])
                ]
            }
            print(f"   ✅ {results['users']['count']} utilisateurs trouvés")
            
        except Exception as e:
            print(f"   ❌ Erreur pour les utilisateurs: {str(e)}")
            results['users'] = {
                'error': str(e),
                'count': 0,
                'data': []
            }
        
        # Sauvegarder les résultats
        output_file = 'supabase_data_extract.json'
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(results, f, indent=2, ensure_ascii=False, default=str)
        
        print(f"\n📄 Données extraites et sauvegardées dans '{output_file}'")
        
        # Afficher un résumé
        print("\n📊 RÉSUMÉ:")
        for table, data in results.items():
            if 'error' in data:
                print(f"   {table}: ❌ {data['error']}")
            else:
                print(f"   {table}: ✅ {data['count']} enregistrements")
        
        return results
        
    except Exception as e:
        print(f"❌ Erreur générale: {str(e)}")
        return None

if __name__ == "__main__":
    print("🔍 Extraction des données Supabase...")
    print("=" * 50)
    main()
