import { adminAuth, adminDb } from '@/src/firebase/admin';

async function setupSuperAdmin() {
  try {
    const email = 'roldan.eng.software@gmail.com';
    const password = '1RE2gis3*';
    const displayName = 'Roldan';

    console.log('Creating superadmin user...');

    const userRecord = await adminAuth.createUser({
      email,
      password,
      displayName,
      emailVerified: true,
    });

    console.log(`✓ Firebase Auth user created: ${userRecord.uid}`);

    const now = new Date();
    await adminDb.collection('users').doc(userRecord.uid).set({
      displayName,
      email,
      roleId: 'administrator',
      status: 'active',
      createdAt: now,
      createdBy: 'system',
      updatedAt: now,
      updatedBy: 'system',
    });

    console.log('✓ Firestore user profile created');
    console.log('');
    console.log('Superadmin criado com sucesso!');
    console.log(`  Email: ${email}`);
    console.log(`  UID: ${userRecord.uid}`);
    console.log(`  Role: administrator`);
  } catch (error: any) {
    if (error.code === 'auth/email-already-exists') {
      console.log('Usuário já existe no Firebase Auth.');

      const userRecord = await adminAuth.getUserByEmail('roldan.eng.software@gmail.com');
      console.log(`UID existente: ${userRecord.uid}`);

      const userDoc = await adminDb.collection('users').doc(userRecord.uid).get();
      if (!userDoc.exists) {
        const now = new Date();
        await adminDb.collection('users').doc(userRecord.uid).set({
          displayName: 'Roldan',
          email: 'roldan.eng.software@gmail.com',
          roleId: 'administrator',
          status: 'active',
          createdAt: now,
          createdBy: 'system',
          updatedAt: now,
          updatedBy: 'system',
        });
        console.log('✓ Perfil Firestore criado para usuário existente');
      } else {
        console.log('✓ Perfil Firestore já existe');
      }
    } else {
      console.error('Erro:', error);
      process.exit(1);
    }
  }
}

setupSuperAdmin();
