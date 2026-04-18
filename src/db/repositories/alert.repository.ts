import type { Database } from 'better-sqlite3'
import type { Alert } from '../../types'

export class AlertRepository {
  constructor(private db: Database) {}

  getAll(userId: string): Alert[] {
    const rows = this.db.prepare('SELECT * FROM alerts WHERE user_id = ? ORDER BY created_at DESC').all(userId) as any[]
    
    return rows.map(row => ({
      id: row.id,
      type: row.type as any,
      severity: row.severity as any,
      title: row.title,
      message: row.message,
      date: row.created_at,
      isRead: Boolean(row.is_read)
    }))
  }

  markAsRead(id: string): void {
    this.db.prepare('UPDATE alerts SET is_read = 1 WHERE id = ?').run(id)
  }

  markAllAsRead(userId: string): void {
    this.db.prepare('UPDATE alerts SET is_read = 1 WHERE user_id = ?').run(userId)
  }

  create(userId: string, alert: Partial<Alert>): void {
    const stmt = this.db.prepare(`
      INSERT INTO alerts (id, user_id, type, severity, title, message, is_read)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `)
    stmt.run(
      alert.id || undefined,
      userId,
      alert.type,
      alert.severity,
      alert.title,
      alert.message,
      alert.isRead ? 1 : 0
    )
  }
}
