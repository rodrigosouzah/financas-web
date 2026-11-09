import { sqliteTable, text, integer, primaryKey } from 'drizzle-orm/sqlite-core';
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

// Daily assistant request counters; never stores prompts or proposed expenses.
export const aiUsage = sqliteTable('finance_ai_usage', {
 scope:text('scope').notNull(),
 day:text('day').notNull(),
 count:integer('count').notNull(),
}, t=>[primaryKey({columns:[t.scope,t.day]})]);

// Server-only authorization registry; idempotently initialized by the role resolver.
export const superuserRoles=sqliteTable('finance_roles',{userId:text('user_id').primaryKey().notNull(),role:text('role').notNull(),bootstrapKey:text('bootstrap_key').unique()});

export const accountAccess=sqliteTable('finance_access',{userId:text('user_id').primaryKey().notNull(),email:text('email').notNull(),name:text('name').notNull(),status:text('status').notNull(),requestedAt:text('requested_at').notNull(),reviewedAt:text('reviewed_at'),reviewedBy:text('reviewed_by')});
