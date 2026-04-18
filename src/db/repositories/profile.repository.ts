import type { Database } from 'better-sqlite3'
import type { UserProfile } from '../../types'

export class ProfileRepository {
  constructor(private db: Database) {}

  getProfile(): UserProfile | null {
    const row = this.db.prepare('SELECT * FROM profiles LIMIT 1').get() as any
    if (!row) return null

    return {
      id: row.id,
      name: row.name,
      email: row.email,
      currency: row.currency,
      theme: row.theme,
      onboardingDone: Boolean(row.onboarding_done)
    }
  }

  createProfile(profile: Partial<UserProfile>): string {
    const id = profile.id || undefined
    const name = profile.name || 'Usuario'
    const email = profile.email || ''
    const currency = profile.currency || 'MXN'
    const theme = profile.theme || 'dark'
    const onboardingDone = profile.onboardingDone ? 1 : 0

    const stmt = this.db.prepare(`
      INSERT INTO profiles (id, name, email, currency, theme, onboarding_done)
      VALUES (?, ?, ?, ?, ?, ?)
    `)

    const info = stmt.run(id, name, email, currency, theme, onboardingDone)
    return id || (info.lastInsertRowid as unknown as string)
  }

  updateProfile(profile: Partial<UserProfile>): void {
    if (!profile.id) return
    
    const fields: string[] = []
    const params: any[] = []

    if (profile.name) { fields.push('name = ?'); params.push(profile.name) }
    if (profile.email) { fields.push('email = ?'); params.push(profile.email) }
    if (profile.currency) { fields.push('currency = ?'); params.push(profile.currency) }
    if (profile.theme) { fields.push('theme = ?'); params.push(profile.theme) }
    if (profile.onboardingDone !== undefined) { 
      fields.push('onboarding_done = ?')
      params.push(profile.onboardingDone ? 1 : 0) 
    }

    if (fields.length === 0) return

    params.push(profile.id)
    const sql = `UPDATE profiles SET ${fields.join(', ')} WHERE id = ?`
    this.db.prepare(sql).run(...params)
  }
}
