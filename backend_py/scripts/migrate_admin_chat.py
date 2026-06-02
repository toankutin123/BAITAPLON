"""Migration script for Admin Chat tables

Run:
  python scripts/migrate_admin_chat.py

Notes:
- Uses same DB env vars as backend_py/config.py (DB_HOST/DB_PORT/DB_USER/DB_PASSWORD/DB_NAME)
- Creates tables:
  - admin_chat_conversations
  - admin_chat_messages
"""

import os
import psycopg2
import psycopg2.extras
from dotenv import load_dotenv

load_dotenv()

DB_CONFIG = {
    "host": os.getenv("DB_HOST", "localhost"),
    "port": int(os.getenv("DB_PORT", 5432)),
    "user": os.getenv("DB_USER", "postgres"),
    "password": os.getenv("DB_PASSWORD", ""),
    "dbname": os.getenv("DB_NAME", "postgres"),
}


def get_connection():
    return psycopg2.connect(cursor_factory=psycopg2.extras.RealDictCursor, **DB_CONFIG)


MIGRATION_SQL = """
-- =============================================
-- ADMIN CHAT (one conversation per user)
-- =============================================

CREATE TABLE IF NOT EXISTS admin_chat_conversations (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id)
);

CREATE TABLE IF NOT EXISTS admin_chat_messages (
    id SERIAL PRIMARY KEY,
    conversation_id INTEGER NOT NULL REFERENCES admin_chat_conversations(id) ON DELETE CASCADE,
    sender_role INTEGER NOT NULL, -- 0=user, 1=admin (aligned with system roles)
    sender_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_admin_chat_messages_conversation_created
    ON admin_chat_messages(conversation_id, created_at);

CREATE INDEX IF NOT EXISTS idx_admin_chat_messages_sender
    ON admin_chat_messages(sender_user_id, created_at);
"""


def run_migration():
    print("Running admin chat migration...")

    conn = get_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute(MIGRATION_SQL)
            conn.commit()

        print("Migration completed successfully!")
    except Exception as e:
        print(f"Migration failed: {e}")
        conn.rollback()
        raise
    finally:
        conn.close()


if __name__ == "__main__":
    run_migration()

