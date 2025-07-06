-- Script pour ajouter des données de démonstration réalistes
-- À exécuter dans l'éditeur SQL de Supabase

-- 1. Mettre à jour l'utilisateur pour lui assigner une company
UPDATE users 
SET company_id = (SELECT id FROM companies LIMIT 1)
WHERE id = '05abd360-84e0-44a9-b708-1537ec50b6cc';

-- 2. Créer des entreprises supplémentaires
INSERT INTO companies (id, name, email, phone, address) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'Arcadis Tech Solutions', 'contact@arcadis.tech', '+221 77 123 45 67', 'Dakar, Sénégal'),
('550e8400-e29b-41d4-a716-446655440002', 'Digital Innovation Hub', 'info@dihub.sn', '+221 78 987 65 43', 'Thiès, Sénégal'),
('550e8400-e29b-41d4-a716-446655440003', 'TechCorp Africa', 'hello@techcorp.africa', '+221 76 555 12 34', 'Saint-Louis, Sénégal')
ON CONFLICT (id) DO NOTHING;

-- 3. Ajouter des projets réalistes
INSERT INTO projects (id, name, description, client_company_id, status, start_date, end_date, budget) VALUES
('proj-001', 'Système de gestion RH', 'Développement d''un système complet de gestion des ressources humaines', '550e8400-e29b-41d4-a716-446655440001', 'in_progress', '2024-01-15', '2024-08-30', 15000000),
('proj-002', 'Application mobile e-commerce', 'Création d''une application mobile pour le commerce électronique', '550e8400-e29b-41d4-a716-446655440002', 'in_progress', '2024-03-01', '2024-10-15', 25000000),
('proj-003', 'Migration Cloud AWS', 'Migration de l''infrastructure vers AWS', '550e8400-e29b-41d4-a716-446655440001', 'planning', '2024-07-01', '2024-12-31', 8000000),
('proj-004', 'Site vitrine corporate', 'Refonte du site web corporate', '550e8400-e29b-41d4-a716-446655440003', 'completed', '2023-11-01', '2024-02-29', 3500000),
('proj-005', 'IA pour la finance', 'Implémentation d''outils IA pour l''analyse financière', '550e8400-e29b-41d4-a716-446655440002', 'in_progress', '2024-04-15', '2024-09-30', 12000000)
ON CONFLICT (id) DO NOTHING;

-- 4. Ajouter des tâches réalistes
INSERT INTO tasks (id, project_id, title, description, status, priority, estimated_hours) VALUES
('task-001', 'proj-001', 'Analyse des besoins RH', 'Analyse complète des besoins en gestion RH', 'done', 'high', 40),
('task-002', 'proj-001', 'Conception base de données', 'Conception du schéma de base de données', 'done', 'high', 32),
('task-003', 'proj-001', 'Développement interface utilisateur', 'Développement de l''interface web', 'in_progress', 'high', 80),
('task-004', 'proj-001', 'Intégration API', 'Intégration des APIs externes', 'todo', 'medium', 24),
('task-005', 'proj-002', 'Maquettage mobile', 'Création des maquettes pour l''application mobile', 'done', 'high', 16),
('task-006', 'proj-002', 'Développement iOS', 'Développement version iOS', 'in_progress', 'high', 120),
('task-007', 'proj-002', 'Développement Android', 'Développement version Android', 'in_progress', 'high', 120),
('task-008', 'proj-002', 'Tests utilisateurs', 'Tests avec les utilisateurs finaux', 'todo', 'medium', 32),
('task-009', 'proj-003', 'Audit infrastructure', 'Audit de l''infrastructure actuelle', 'todo', 'high', 24),
('task-010', 'proj-005', 'Formation équipe IA', 'Formation de l''équipe sur les outils IA', 'in_progress', 'medium', 16)
ON CONFLICT (id) DO NOTHING;

-- 5. Ajouter des devis réalistes
INSERT INTO devis (id, number, company_id, object, amount, status, valid_until, notes) VALUES
('devis-001', 'DEV-2024-001', '550e8400-e29b-41d4-a716-446655440001', 'Développement système RH complet', 15000000, 'accepted', '2024-12-31', 'Devis pour système RH avec modules paie et congés'),
('devis-002', 'DEV-2024-002', '550e8400-e29b-41d4-a716-446655440002', 'Application mobile e-commerce', 25000000, 'sent', '2024-08-31', 'Includes iOS and Android development'),
('devis-003', 'DEV-2024-003', '550e8400-e29b-41d4-a716-446655440003', 'Refonte site web', 3500000, 'accepted', '2024-06-30', 'Site responsive avec CMS'),
('devis-004', 'DEV-2024-004', '550e8400-e29b-41d4-a716-446655440001', 'Migration Cloud AWS', 8000000, 'pending', '2024-09-30', 'Migration complète avec formation équipe'),
('devis-005', 'DEV-2024-005', '550e8400-e29b-41d4-a716-446655440002', 'Outils IA Finance', 12000000, 'sent', '2024-10-31', 'IA pour prédiction et analyse financière')
ON CONFLICT (id) DO NOTHING;

-- 6. Ajouter des factures réalistes
INSERT INTO invoices (id, number, company_id, amount, status, due_date, object, currency) VALUES
('inv-001', 'FAC-2024-001', '550e8400-e29b-41d4-a716-446655440001', 5000000, 'paid', '2024-02-29', 'Acompte système RH - 1ère tranche', 'XOF'),
('inv-002', 'FAC-2024-002', '550e8400-e29b-41d4-a716-446655440003', 3500000, 'paid', '2024-03-31', 'Site web corporate - Paiement final', 'XOF'),
('inv-003', 'FAC-2024-003', '550e8400-e29b-41d4-a716-446655440001', 7500000, 'sent', '2024-08-31', 'Système RH - 2ème tranche', 'XOF'),
('inv-004', 'FAC-2024-004', '550e8400-e29b-41d4-a716-446655440002', 8000000, 'sent', '2024-09-15', 'App mobile - Acompte 50%', 'XOF'),
('inv-005', 'FAC-2024-005', '550e8400-e29b-41d4-a716-446655440002', 4000000, 'pending', '2024-07-31', 'IA Finance - Acompte 30%', 'XOF')
ON CONFLICT (id) DO NOTHING;

-- 7. Ajouter des employés réalistes
INSERT INTO employees (id, user_id, employee_number, first_name, last_name, work_email, branch_id, department_id, position_id, hire_date, start_date, employment_status, current_salary) VALUES
('emp-001', '05abd360-84e0-44a9-b708-1537ec50b6cc', 'EMP001', 'Mamadou', 'Diouf', 'mdiouf@arcadis.tech', (SELECT id FROM branches LIMIT 1), (SELECT id FROM departments LIMIT 1), (SELECT id FROM positions LIMIT 1), '2023-01-15', '2023-01-15', 'active', 850000),
('emp-002', NULL, 'EMP002', 'Fatou', 'Ba', 'fba@arcadis.tech', (SELECT id FROM branches LIMIT 1), (SELECT id FROM departments LIMIT 1), (SELECT id FROM positions LIMIT 1), '2023-03-01', '2023-03-01', 'active', 750000),
('emp-003', NULL, 'EMP003', 'Moussa', 'Sow', 'msow@arcadis.tech', (SELECT id FROM branches LIMIT 1), (SELECT id FROM departments LIMIT 1), (SELECT id FROM positions LIMIT 1), '2023-06-15', '2023-06-15', 'active', 680000),
('emp-004', NULL, 'EMP004', 'Aissatou', 'Diallo', 'adiallo@arcadis.tech', (SELECT id FROM branches LIMIT 1), (SELECT id FROM departments LIMIT 1), (SELECT id FROM positions LIMIT 1), '2023-09-01', '2023-09-01', 'active', 720000),
('emp-005', NULL, 'EMP005', 'Omar', 'Fall', 'ofall@arcadis.tech', (SELECT id FROM branches LIMIT 1), (SELECT id FROM departments LIMIT 1), (SELECT id FROM positions LIMIT 1), '2024-01-10', '2024-01-10', 'active', 650000)
ON CONFLICT (id) DO NOTHING;

-- 8. Vérifier les données insérées
SELECT 'PROJECTS' as table_name, COUNT(*) as count FROM projects
UNION ALL
SELECT 'TASKS' as table_name, COUNT(*) as count FROM tasks
UNION ALL
SELECT 'EMPLOYEES' as table_name, COUNT(*) as count FROM employees
UNION ALL
SELECT 'DEVIS' as table_name, COUNT(*) as count FROM devis
UNION ALL
SELECT 'INVOICES' as table_name, COUNT(*) as count FROM invoices
UNION ALL
SELECT 'COMPANIES' as table_name, COUNT(*) as count FROM companies
ORDER BY table_name;

-- 9. Afficher un résumé des données pour l'utilisateur connecté
SELECT 
  'USER_CONTEXT_SUMMARY' as info,
  u.id as user_id,
  u.email,
  u.role,
  u.company_id,
  c.name as company_name
FROM users u
LEFT JOIN companies c ON u.company_id = c.id
WHERE u.id = '05abd360-84e0-44a9-b708-1537ec50b6cc';
