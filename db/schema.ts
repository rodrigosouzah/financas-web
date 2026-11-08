import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
export const workspaces = sqliteTable('finance_workspaces', {
 userId:text('user_id').primaryKey().notNull(),
 revision:integer('revision').notNull(),
 payload:text('payload').notNull(),
 updatedAt:text('updated_at').notNull(),
});

// Device credentials contain no financial records and can be revoked separately.
export const nativeDevices = sqliteTable('finance_native_devices', {
 id:text('id').primaryKey().notNull(),
 tokenHash:text('token_hash').notNull(),
 userId:text('user_id').notNull(),
 displayName:text('display_name').notNull(),
 createdAt:integer('created_at').notNull(),
 expiresAt:integer('expires_at').notNull(),
});
