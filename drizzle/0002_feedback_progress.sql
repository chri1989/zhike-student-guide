CREATE TABLE IF NOT EXISTS feedback_progress (
    feedback_id TEXT PRIMARY KEY NOT NULL REFERENCES feedback(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    summary TEXT NOT NULL,
    stage TEXT NOT NULL CHECK (stage IN ('received', 'following', 'referred', 'resolved')),
    guide_id TEXT NOT NULL DEFAULT '',
    revision INTEGER NOT NULL DEFAULT 1,
    updated_at TEXT NOT NULL
);
