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
            created_at TEXT NOT NULL
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
            date TEXT NOT NULL
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
        con.commit()