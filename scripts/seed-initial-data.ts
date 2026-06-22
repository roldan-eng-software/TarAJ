// Seed script for initial data setup
// Run with: npm run seed

import { adminDb } from '@/src/firebase/admin';
import { seedDefaultAlertConfigs } from '@/src/domain/notifications/alert-config-service';

const INITIAL_ROLES = [
  {
    id: 'administrator',
    name: 'administrator',
    label: 'Administrador',
    description: 'Full system access, user management, configuration',
    permissions: [
      'view_all_tasks',
      'create_task',
      'edit_task',
      'move_task',
      'comment_task',
      'attach_task',
      'archive_task',
      'restore_task',
      'view_audit',
      'manage_users',
      'manage_roles',
      'configure_workflow',
    ],
    active: true,
  },
  {
    id: 'coordinator',
    name: 'coordinator',
    label: 'Coordenador',
    description: 'Create and manage tasks, move stages, view audit',
    permissions: [
      'view_own_tasks',
      'create_task',
      'edit_task',
      'move_task',
      'comment_task',
      'attach_task',
      'archive_task',
      'restore_task',
      'view_own_audit',
    ],
    active: true,
  },
  {
    id: 'collaborator',
    name: 'collaborator',
    label: 'Colaborador',
    description: 'View assigned tasks, comment, attach, limited stage movement',
    permissions: [
      'view_assigned_tasks',
      'edit_assigned_task',
      'move_task',
      'comment_task',
      'attach_task',
      'view_own_audit',
    ],
    active: true,
  },
  {
    id: 'internal_reader',
    name: 'internal_reader',
    label: 'Leitor Interno',
    description: 'Read-only access to tasks and audit logs',
    permissions: ['view_all_tasks', 'view_audit'],
    active: true,
  },
];

const INITIAL_STAGES = [
  { id: 'entrada', name: 'Entrada', order: 1, isArchived: false },
  { id: 'analise', name: 'Em análise', order: 2, isArchived: false },
  {
    id: 'aguardando_docs',
    name: 'Aguardando documentos',
    order: 3,
    isArchived: false,
  },
  { id: 'andamento', name: 'Em andamento', order: 4, isArchived: false },
  { id: 'revisao', name: 'Em revisão', order: 5, isArchived: false },
  { id: 'concluida', name: 'Concluída', order: 6, isArchived: false },
  { id: 'arquivada', name: 'Arquivada', order: 7, isArchived: true },
];

async function seedDatabase() {
  try {
    console.log('Starting database seeding...');

    // Seed roles
    for (const role of INITIAL_ROLES) {
      await adminDb.collection('roles').doc(role.id).set(role);
      console.log(`✓ Created role: ${role.label}`);
    }

    // Seed workflow stages
    for (const stage of INITIAL_STAGES) {
      await adminDb.collection('workflowStages').doc(stage.id).set(stage);
      console.log(`✓ Created stage: ${stage.name}`);
    }

    // Seed default categories
    const INITIAL_CATEGORIES = [
      { name: 'Contratos', order: 1 },
      { name: 'Litígios', order: 2 },
      { name: 'Regulatório', order: 3 },
      { name: 'Societário', order: 4 },
      { name: 'Trabalhista', order: 5 },
      { name: 'Tributário', order: 6 },
      { name: 'Consultivo', order: 7 },
      { name: 'Compliance', order: 8 },
      { name: 'Propriedade Intelectual', order: 9 },
      { name: 'Família / Sucessões', order: 10 },
      { name: 'Consumidor', order: 11 },
      { name: 'Imobiliário', order: 12 },
    ];

    for (const cat of INITIAL_CATEGORIES) {
      const slug = cat.name
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_|_$/g, '');

      const existing = await adminDb.collection('taskCategories').doc(slug).get();
      if (!existing.exists) {
        await adminDb.collection('taskCategories').doc(slug).set({
          name: cat.name,
          slug,
          order: cat.order,
          active: true,
          createdAt: new Date(),
          updatedAt: new Date(),
          createdBy: 'seed-script',
        });
        console.log(`✓ Created category: ${cat.name}`);
      }
    }

    // Seed default alert configs
    const alertConfigsSeeded = await seedDefaultAlertConfigs('seed-script');
    console.log(`✓ Created ${alertConfigsSeeded} default alert configurations`);

    console.log('Database seeding completed successfully!');
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
}

seedDatabase();
