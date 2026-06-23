// Seed script for demo data
// Run with: npx tsx scripts/seed-demo-data.ts
// Requires: FIREBASE_ADMIN_SDK_KEY env var set

import { adminDb, adminAuth } from '@/src/firebase/admin';

const DEFAULT_PASSWORD = 'Demo@123456';

const USER_IDS = {
  admin: 'demo-admin-001',
  coordinator: 'demo-coord-001',
  collaborator1: 'demo-collab-001',
  collaborator2: 'demo-collab-002',
  reader: 'demo-reader-001',
};

const DEMO_USERS = [
  { id: USER_IDS.admin, displayName: 'Admin Demo', email: 'admin@demo.com', roleId: 'administrator', status: 'active' },
  { id: USER_IDS.coordinator, displayName: 'Ana Coordenadora', email: 'coordenador@demo.com', roleId: 'coordinator', status: 'active' },
  { id: USER_IDS.collaborator1, displayName: 'Carlos Colaborador', email: 'colaborador1@demo.com', roleId: 'collaborator', status: 'active' },
  { id: USER_IDS.collaborator2, displayName: 'Maria Colaboradora', email: 'colaborador2@demo.com', roleId: 'collaborator', status: 'active' },
  { id: USER_IDS.reader, displayName: 'Pedro Leitor', email: 'leitor@demo.com', roleId: 'internal_reader', status: 'active' },
];

const now = new Date();
const daysAgo = (d: number) => new Date(now.getTime() - d * 86400000);
const daysFromNow = (d: number) => new Date(now.getTime() + d * 86400000);

function makeTask(overrides: Record<string, unknown>) {
  return {
    title: '',
    description: '',
    category: 'contratos',
    priority: 'normal',
    stageId: 'entrada',
    responsibleUserId: USER_IDS.collaborator1,
    participantIds: [],
    confidentialityLevel: 'interno',
    archived: false,
    createdAt: now,
    updatedAt: now,
    dueDate: null,
    completedAt: null,
    archivedAt: null,
    internalNotes: '',
    ...overrides,
  };
}

const DEMO_TASKS = [
  makeTask({
    title: 'Análise de contrato de prestação de serviços',
    description: 'Revisar cláusulas contratuais do novo fornecedor de TI.',
    category: 'contratos', priority: 'alta', stageId: 'analise',
    responsibleUserId: USER_IDS.collaborator1,
    dueDate: daysFromNow(2), createdAt: daysAgo(5), updatedAt: daysAgo(1),
  }),
  makeTask({
    title: 'Ação trabalhista - Reclamação 004/2026',
    description: 'Preparar defesa para audiência inicial.',
    category: 'trabalhista', priority: 'urgente', stageId: 'andamento',
    responsibleUserId: USER_IDS.collaborator2,
    dueDate: daysFromNow(1), createdAt: daysAgo(10), updatedAt: daysAgo(1),
  }),
  makeTask({
    title: 'Registro de marca "TarAJ" no INPI',
    description: 'Acompanhar processo de registro de marca.',
    category: 'propriedade_intelectual', priority: 'normal', stageId: 'aguardando_docs',
    responsibleUserId: USER_IDS.collaborator1,
    dueDate: daysFromNow(15), createdAt: daysAgo(20), updatedAt: daysAgo(3),
  }),
  makeTask({
    title: 'Parecer sobre alteração estatutária',
    description: 'Elaborar parecer sobre proposta de alteração do estatuto social.',
    category: 'societario', priority: 'normal', stageId: 'entrada',
    responsibleUserId: USER_IDS.collaborator2,
    dueDate: daysFromNow(7), createdAt: daysAgo(1), updatedAt: daysAgo(1),
  }),
  makeTask({
    title: 'Contestação - Processo 1234-56',
    description: 'Redigir contestação para processo cível.',
    category: 'litigios', priority: 'alta', stageId: 'revisao',
    responsibleUserId: USER_IDS.collaborator1,
    dueDate: daysAgo(2), createdAt: daysAgo(15), updatedAt: daysAgo(1),
  }),
  makeTask({
    title: 'Auditoria de compliance anual',
    description: 'Levantar documentos para auditoria de compliance.',
    category: 'compliance', priority: 'normal', stageId: 'andamento',
    responsibleUserId: USER_IDS.collaborator2,
    dueDate: daysFromNow(30), createdAt: daysAgo(7), updatedAt: daysAgo(2),
  }),
  makeTask({
    title: 'Contrato de locação comercial',
    description: 'Elaborar minuta de contrato de locação.',
    category: 'imobiliario', priority: 'normal', stageId: 'entrada',
    responsibleUserId: USER_IDS.collaborator1,
    dueDate: daysFromNow(10), createdAt: daysAgo(1), updatedAt: daysAgo(1),
  }),
  makeTask({
    title: 'Recurso administrativo - Multa ambiental',
    description: 'Protocolizar recurso contra auto de infração.',
    category: 'regulatorio', priority: 'urgente', stageId: 'analise',
    responsibleUserId: USER_IDS.collaborator2,
    dueDate: daysAgo(1), createdAt: daysAgo(3), updatedAt: daysAgo(1),
  }),
  makeTask({
    title: 'Processo de divórcio consensual',
    description: 'Acompanhar processo de divórcio.',
    category: 'familia_successoes', priority: 'normal', stageId: 'concluida',
    responsibleUserId: USER_IDS.collaborator1,
    completedAt: daysAgo(3), dueDate: daysAgo(5), createdAt: daysAgo(30), updatedAt: daysAgo(3),
  }),
  makeTask({
    title: 'Notificação extrajudicial',
    description: 'Redigir e enviar notificação extrajudicial.',
    category: 'consultivo', priority: 'baixa', stageId: 'concluida',
    responsibleUserId: USER_IDS.collaborator2,
    completedAt: daysAgo(10), dueDate: daysAgo(15), createdAt: daysAgo(40), updatedAt: daysAgo(10),
  }),
  makeTask({
    title: 'Análise de risco contratual',
    description: 'Análise de riscos em contrato de fornecimento internacional.',
    category: 'contratos', priority: 'normal', stageId: 'analise',
    responsibleUserId: USER_IDS.collaborator1,
    dueDate: daysFromNow(5), createdAt: daysAgo(4), updatedAt: daysAgo(2),
  }),
];

async function seedDemoData() {
  console.log('Seeding demo data...\n');

  for (const user of DEMO_USERS) {
    const existingDoc = await adminDb.collection('users').doc(user.id).get();

    if (!existingDoc.exists) {
      await adminDb.collection('users').doc(user.id).set({
        displayName: user.displayName,
        email: user.email,
        roleId: user.roleId,
        status: user.status,
        createdAt: now,
        updatedAt: now,
        lastLoginAt: daysAgo(1),
      });
      console.log(`✓ Created Firestore user: ${user.displayName} (${user.email})`);
    } else {
      console.log(`→ Firestore user already exists: ${user.displayName}`);
    }

    try {
      await adminAuth.getUserByEmail(user.email);
      console.log(`→ Firebase Auth user already exists: ${user.email}`);
    } catch {
      await adminAuth.createUser({
        uid: user.id,
        email: user.email,
        password: DEFAULT_PASSWORD,
        displayName: user.displayName,
        disabled: false,
      });
      console.log(`✓ Created Firebase Auth: ${user.email} (password: ${DEFAULT_PASSWORD})`);
    }
  }

  for (const task of DEMO_TASKS) {
    const ref = adminDb.collection('tasks').doc();
    await ref.set(task);
    console.log(`✓ Created task: ${task.title} [${ref.id}]`);

    await adminDb.collection('tasks').doc(ref.id).collection('history').add({
      eventType: 'task_created',
      actor: 'Sistema',
      actorId: 'seed-script',
      fromStage: null,
      toStage: task.stageId,
      occurredAt: task.createdAt,
      metadata: { source: 'demo-seed' },
    });
    console.log(`  └ History: created`);
  }

  const alerts = [
    { userId: USER_IDS.collaborator1, taskTitle: 'Ação trabalhista', message: 'Prazo vencido para a tarefa "Ação trabalhista".', eventType: 'due_overdue' },
    { userId: USER_IDS.collaborator2, taskTitle: 'Recurso administrativo', message: 'Prazo vencido para a tarefa "Recurso administrativo".', eventType: 'due_overdue' },
    { userId: USER_IDS.collaborator1, taskTitle: 'Análise de contrato', message: 'Prazo próximo para a tarefa "Análise de contrato".', eventType: 'due_upcoming' },
    { userId: USER_IDS.collaborator2, taskTitle: 'Parecer sobre alteração', message: 'Você foi designado responsável pela tarefa "Parecer sobre alteração".', eventType: 'task_assigned' },
    { userId: USER_IDS.coordinator, taskTitle: 'Ação trabalhista', message: 'Tarefa "Ação trabalhista" está com prazo vencido.', eventType: 'due_overdue' },
  ];

  for (const alert of alerts) {
    await adminDb.collection('alerts').add({
      eventType: alert.eventType,
      taskId: 'demo-task',
      recipientId: alert.userId,
      actorName: 'Sistema',
      message: alert.message,
      readAt: null,
      createdAt: now,
      dedupeKey: `demo-${alert.eventType}-${alert.userId}`,
    });
    console.log(`✓ Created alert for ${alert.userId}: ${alert.message}`);
  }

  await adminDb.collection('auditLogs').add({
    actor: 'admin@demo.com',
    actorRole: 'administrator',
    action: 'view',
    resourceType: 'user',
    result: 'success',
    occurredAt: daysAgo(1),
    requestId: 'demo-seed',
  });

  console.log('\n✓ Demo data seeding completed!');
  console.log('─'.repeat(50));
  console.log('Credentials for login:');
  for (const user of DEMO_USERS) {
    console.log(`  ${user.email} / ${DEFAULT_PASSWORD}  (${user.displayName})`);
  }
  console.log('─'.repeat(50));
}

seedDemoData().catch((e) => {
  console.error('Seed failed:', e);
  process.exit(1);
});
