-- Script pour extraire toutes les données des tables en JSON
-- À exécuter dans l'éditeur SQL de Supabase

-- 1. Lister toutes les tables disponibles
SELECT 
  schemaname,
  tablename,
  tableowner
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;

-- 2. Compter les enregistrements dans chaque table
SELECT 
  'projects' as table_name,
  COUNT(*) as record_count
FROM projects
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'projects' AND table_schema = 'public')

UNION ALL

SELECT 
  'employees' as table_name,
  COUNT(*) as record_count
FROM employees
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'employees' AND table_schema = 'public')

UNION ALL

SELECT 
  'tasks' as table_name,
  COUNT(*) as record_count
FROM tasks
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'tasks' AND table_schema = 'public')

UNION ALL

SELECT 
  'devis' as table_name,
  COUNT(*) as record_count
FROM devis
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'devis' AND table_schema = 'public')

UNION ALL

SELECT 
  'invoices' as table_name,
  COUNT(*) as record_count
FROM invoices
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'invoices' AND table_schema = 'public')

UNION ALL

SELECT 
  'users' as table_name,
  COUNT(*) as record_count
FROM auth.users

ORDER BY table_name;

-- 3. Extraire un échantillon de données de chaque table (si elles existent)

-- PROJECTS
SELECT 'PROJECTS_DATA' as data_type, json_agg(
  json_build_object(
    'id', id,
    'name', name,
    'status', status,
    'start_date', start_date,
    'end_date', end_date,
    'company_id', company_id,
    'created_at', created_at
  )
) as data
FROM (
  SELECT * FROM projects LIMIT 5
) projects_sample
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'projects' AND table_schema = 'public');

-- EMPLOYEES
SELECT 'EMPLOYEES_DATA' as data_type, json_agg(
  json_build_object(
    'id', id,
    'first_name', first_name,
    'last_name', last_name,
    'email', email,
    'employment_status', employment_status,
    'company_id', company_id,
    'created_at', created_at
  )
) as data
FROM (
  SELECT * FROM employees LIMIT 5
) employees_sample
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'employees' AND table_schema = 'public');

-- TASKS
SELECT 'TASKS_DATA' as data_type, json_agg(
  json_build_object(
    'id', id,
    'title', title,
    'status', status,
    'project_id', project_id,
    'assigned_to', assigned_to,
    'created_at', created_at
  )
) as data
FROM (
  SELECT * FROM tasks LIMIT 5
) tasks_sample
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'tasks' AND table_schema = 'public');

-- DEVIS
SELECT 'DEVIS_DATA' as data_type, json_agg(
  json_build_object(
    'id', id,
    'numero', numero,
    'status', status,
    'amount', amount,
    'company_id', company_id,
    'created_at', created_at
  )
) as data
FROM (
  SELECT * FROM devis LIMIT 5
) devis_sample
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'devis' AND table_schema = 'public');

-- INVOICES
SELECT 'INVOICES_DATA' as data_type, json_agg(
  json_build_object(
    'id', id,
    'numero', numero,
    'status', status,
    'amount', amount,
    'company_id', company_id,
    'created_at', created_at
  )
) as data
FROM (
  SELECT * FROM invoices LIMIT 5
) invoices_sample
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'invoices' AND table_schema = 'public');

-- USERS
SELECT 'USERS_DATA' as data_type, json_agg(
  json_build_object(
    'id', id,
    'email', email,
    'role', role,
    'raw_user_meta_data', raw_user_meta_data,
    'created_at', created_at
  )
) as data
FROM (
  SELECT * FROM auth.users LIMIT 3
) users_sample;

-- 4. Vérifier la structure des tables
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name IN ('projects', 'employees', 'tasks', 'devis', 'invoices')
ORDER BY table_name, ordinal_position;
