import { sqliteTable, text, integer, index } from 'drizzle-orm/sqlite-core';

export const user = sqliteTable('user', {
  id: text('id').primaryKey(), name: text('name').notNull(), email: text('email').notNull().unique(),
  emailVerified: integer('emailVerified', { mode: 'boolean' }).notNull(), image: text('image'),
  createdAt: integer('createdAt', { mode: 'timestamp_ms' }).notNull(), updatedAt: integer('updatedAt', { mode: 'timestamp_ms' }).notNull(),
  role: text('role'), banned: integer('banned', { mode: 'boolean' }), banReason: text('banReason'), banExpires: integer('banExpires', { mode: 'timestamp_ms' }),
});
export const session = sqliteTable('session', {
  id: text('id').primaryKey(), expiresAt: integer('expiresAt', { mode: 'timestamp_ms' }).notNull(), token: text('token').notNull().unique(),
  createdAt: integer('createdAt', { mode: 'timestamp_ms' }).notNull(), updatedAt: integer('updatedAt', { mode: 'timestamp_ms' }).notNull(),
  ipAddress: text('ipAddress'), userAgent: text('userAgent'), userId: text('userId').notNull().references(() => user.id, { onDelete: 'cascade' }), impersonatedBy: text('impersonatedBy'),
});
export const account = sqliteTable('account', {
  id: text('id').primaryKey(), accountId: text('accountId').notNull(), providerId: text('providerId').notNull(),
  userId: text('userId').notNull().references(() => user.id, { onDelete: 'cascade' }),
  accessToken: text('accessToken'), refreshToken: text('refreshToken'), idToken: text('idToken'),
  accessTokenExpiresAt: integer('accessTokenExpiresAt', { mode: 'timestamp_ms' }), refreshTokenExpiresAt: integer('refreshTokenExpiresAt', { mode: 'timestamp_ms' }),
  scope: text('scope'), password: text('password'), createdAt: integer('createdAt', { mode: 'timestamp_ms' }).notNull(), updatedAt: integer('updatedAt', { mode: 'timestamp_ms' }).notNull(),
});
export const verification = sqliteTable('verification', {
  id: text('id').primaryKey(), identifier: text('identifier').notNull(), value: text('value').notNull(),
  expiresAt: integer('expiresAt', { mode: 'timestamp_ms' }).notNull(), createdAt: integer('createdAt', { mode: 'timestamp_ms' }).notNull(), updatedAt: integer('updatedAt', { mode: 'timestamp_ms' }).notNull(),
});
export const rateLimit = sqliteTable('rateLimit', {
  id: text('id').primaryKey(), key: text('key').unique().notNull(), count: integer('count').notNull(), lastRequest: integer('lastRequest').notNull(),
});
export const drafts = sqliteTable('drafts', {
  id: text('id').primaryKey(), content: text('content').notNull(), active: integer('active').notNull(), revision: integer('revision').notNull(),
  editor: text('editor').notNull(), editedAt: text('edited_at').notNull(),
});
export const releases = sqliteTable('releases', {
  id: integer('id').primaryKey(), token: text('token').notNull(), articles: text('articles').notNull(), changes: text('changes').notNull(),
  summary: text('summary').notNull(), publisher: text('publisher').notNull(), publishedAt: text('published_at').notNull(),
});
export const media = sqliteTable('media', {
  key: text('key').primaryKey(), contentType: text('content_type').notNull(), published: integer('published').notNull(),
});
export const setupLock = sqliteTable('setup_lock', {
  id: text('id').primaryKey(), createdAt: text('created_at').notNull(),
});
export const feedback = sqliteTable('feedback', {
  id:text('id').primaryKey(),title:text('title').notNull(),body:text('body').notNull(),contact:text('contact').notNull().default(''),
  articleId:text('article_id').notNull().default(''),status:text('status').notNull().default('new'),revision:integer('revision').notNull().default(1),
  createdAt:text('created_at').notNull(),updatedAt:text('updated_at').notNull(),
},table=>[index('feedback_status_created_idx').on(table.status,table.createdAt)]);
export const feedbackLimits = sqliteTable('feedback_limits', {
  key:text('key').primaryKey(),count:integer('count').notNull(),expiresAt:integer('expires_at').notNull(),
});
