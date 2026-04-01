import sqlite3 as sq

def create_tables():
    with sq.connect("database.db") as con:
        cursor = con.cursor()
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT NOT NULL UNIQUE,
            password TEXT NOT NULL,
            balance REAL NOT NULL DEFAULT 0 ,
            created_at TEXT NOT NULL,
            promo_code TEXT,
            withdrawed REAL NOT NULL DEFAULT 0,
            withdraw_available REAL NOT NULL DEFAULT 0
        )
        """)
        con.commit()

        cursor.execute("""
        CREATE TABLE IF NOT EXISTS transactions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            payment_id TEXT NOT NULL UNIQUE,
            email TEXT NOT NULL,
            amount REAL NOT NULL,
            credited BOOLEAN NOT NULL DEFAULT 0,
            type TEXT NOT NULL,
            date TEXT NOT NULL,
            promo_code TEXT
        )
        """)
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS vpn_keys (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT NOT NULL,
            vpn_key TEXT NOT NULL,
            duration INTEGER NOT NULL,
            country TEXT NOT NULL,
            created_at TEXT NOT NULL,
            expires_at TEXT
        )
        """)
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS referral_codes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT NOT NULL UNIQUE,
            code TEXT NOT NULL UNIQUE,
            created_at TEXT NOT NULL
        )
        """)
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS payment_contexts (
            payment_id TEXT NOT NULL UNIQUE,
            email TEXT NOT NULL,
            promo_code TEXT,
            created_at TEXT NOT NULL
        )
        """)

        # Backward-compatible migration for existing DBs.
        cursor.execute("PRAGMA table_info(users)")
        user_cols = {row[1] for row in cursor.fetchall()}
        if "promo_code" not in user_cols:
            cursor.execute("ALTER TABLE users ADD COLUMN promo_code TEXT")
        if "withdrawed" not in user_cols:
            cursor.execute("ALTER TABLE users ADD COLUMN withdrawed REAL NOT NULL DEFAULT 0")
        if "withdraw_available" not in user_cols:
            cursor.execute("ALTER TABLE users ADD COLUMN withdraw_available REAL NOT NULL DEFAULT 0")

        # Backward-compatible migration for existing DBs.
        cursor.execute("PRAGMA table_info(transactions)")
        existing_cols = {row[1] for row in cursor.fetchall()}
        if "promo_code" not in existing_cols:
            cursor.execute("ALTER TABLE transactions ADD COLUMN promo_code TEXT")

        con.commit()