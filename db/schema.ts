import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
export const workspaces = sqliteTable('finance_workspaces', {
 userId:text('user_id').primaryKey().notNull(),
 revision:integer('revision').notNull(),
 payload:text('payload').notNull(),
 updatedAt:text('updated_at').notNull(),
});
