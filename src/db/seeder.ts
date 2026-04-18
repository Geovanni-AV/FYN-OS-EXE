import type { Database } from 'better-sqlite3'

/**
 * Seeder limpio para producción.
 * Ya no inyectamos datos de prueba.
 */
export function seedDatabase(db: Database): void {
  // Solo verificamos si la base de datos está respondiendo.
  // No insertamos registros para que el usuario comience desde cero.
  console.log('Database ready for user data.')
}
