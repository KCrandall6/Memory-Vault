// electron/db-test.ts
import { app } from 'electron';
import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';

// ES module compatible dirname (replaces __dirname)
const currentFilePath = import.meta.url;
const currentDir = path.dirname(fileURLToPath(currentFilePath));

// Simple function to test database connectivity
export async function testDatabase() {
  try {
    // Log environment details to help debug
    console.log('Process cwd:', process.cwd());
    console.log('Current directory:', currentDir);
    
    // Import better-sqlite3 dynamically
    const SQLite3Module = await import('better-sqlite3');
    const SQLite3 = SQLite3Module.default;
    
    // Define database path - try multiple approaches for reliability
    // First approach: relative to cwd
    // const dbPath = path.resolve(process.cwd(), '..', 'Database', 'memory-vault.db');
    
    // Second approach: more explicit path based on the file structure
    const dbPath = path.resolve(currentDir, '..', '..', '..', 'Database', 'memory-vault.db');
    
    console.log(`Testing database at: ${dbPath}`);
    
    // Check if database file exists
    try {
      const stats = await fs.stat(dbPath);
      console.log('Database file exists, size:', stats.size);
    } catch (err) {
      console.log('Database file does not exist, will create it');
      
      // Ensure directory exists
      try {
        await fs.mkdir(path.dirname(dbPath), { recursive: true });
        console.log('Created database directory');
      } catch (err) {
        if (err.code !== 'EEXIST') {
          console.error('Failed to create database directory:', err);
          throw err;
        }
      }
    }
    
    // Try to open the database
    const db = new SQLite3(dbPath);
    console.log('Database connection established successfully');
    
    // Enable foreign keys
    db.pragma('foreign_keys = ON');
    
    // Test a simple query
    try {
      const result = db.prepare('SELECT COUNT(*) as count FROM sqlite_master').get();
      console.log('Database query successful:', result);
      
      // Check if we need to create tables
      if (result.count === 0) {
        console.log('Database is empty, creating tables...');
        try {
          // Read SQL file
          const sqlPath = path.resolve(currentDir, '..', '..', 'resources', 'create-database.sql');
          console.log('Looking for SQL file at:', sqlPath);
          
          const sql = await fs.readFile(sqlPath, 'utf8');
          console.log('SQL file loaded, length:', sql.length);
          
          // Execute SQL to create tables
          db.exec(sql);
          console.log('Database tables created successfully');
        } catch (err) {
          console.error('Failed to create database tables:', err);
        }
      }
    } catch (err) {
      console.error('Query failed:', err);
    }
    
    return true;
  } catch (error) {
    console.error('Database test failed:', error);
    return false;
  }
}