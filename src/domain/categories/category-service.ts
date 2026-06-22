import { adminDb } from '@/src/firebase/admin';
import type { TaskCategory } from '@/src/types/domain';

function docToCategory(id: string, data: FirebaseFirestore.DocumentData): TaskCategory {
  return {
    id,
    name: data.name,
    slug: data.slug,
    order: data.order,
    active: data.active,
    createdAt: data.createdAt?.toDate?.() || data.createdAt,
    updatedAt: data.updatedAt?.toDate?.() || data.updatedAt,
  };
}

export async function getAllCategories(): Promise<TaskCategory[]> {
  const snapshot = await adminDb
    .collection('taskCategories')
    .orderBy('order', 'asc')
    .get();

  return snapshot.docs.map((doc) => docToCategory(doc.id, doc.data()));
}

export async function getActiveCategories(): Promise<TaskCategory[]> {
  const snapshot = await adminDb
    .collection('taskCategories')
    .where('active', '==', true)
    .orderBy('order', 'asc')
    .get();

  return snapshot.docs.map((doc) => docToCategory(doc.id, doc.data()));
}

export async function createCategory(
  data: { name: string; order: number },
  createdBy: string
): Promise<TaskCategory> {
  const slug = data.name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '');

  const docRef = adminDb.collection('taskCategories').doc(slug);
  const now = new Date();

  const category = {
    name: data.name,
    slug,
    order: data.order,
    active: true,
    createdAt: now,
    updatedAt: now,
    createdBy,
  };

  await docRef.set(category);
  return docToCategory(docRef.id, category);
}

export async function updateCategory(
  categoryId: string,
  data: { name?: string; order?: number; active?: boolean },
  updatedBy: string
): Promise<void> {
  const updates: Record<string, unknown> = {
    updatedAt: new Date(),
    updatedBy,
  };

  if (data.name !== undefined) updates.name = data.name;
  if (data.order !== undefined) updates.order = data.order;
  if (data.active !== undefined) updates.active = data.active;

  await adminDb.collection('taskCategories').doc(categoryId).update(updates);
}

export async function deleteCategory(categoryId: string): Promise<void> {
  await adminDb.collection('taskCategories').doc(categoryId).delete();
}
