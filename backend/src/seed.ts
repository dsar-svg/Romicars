import { query } from './database';
import bcrypt from 'bcryptjs';

async function seed() {
  try {
    const email = 'admin@romicars.com';
    const password = 'Admin123!';

    const existente = await query('SELECT id FROM agentes WHERE email = ?', [email]) as any[];
    if (existente.length > 0) {
      console.log('Superadmin ya existe');
      process.exit(0);
    }

    const password_hash = await bcrypt.hash(password, 10);
    await query(
      'INSERT INTO agentes (nombre, email, password_hash, rol_id) VALUES (?, ?, ?, ?)',
      ['Super Admin', email, password_hash, 1]
    );

    console.log('Superadmin creado:');
    console.log('  Email: ' + email);
    console.log('  Password: ' + password);
  } catch (error) {
    console.error('Error creando superadmin:', error);
  }
  process.exit(0);
}

seed();
