// electron/database.cjs
const { app } = require('electron');
const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');

// Initialize database connection
let db;
try {
  // Get database path - adjust this to match where your database is located
  const dbPath = path.resolve(process.cwd(), '..', 'Database', 'memory-vault.db');
  console.log(`Database path: ${dbPath}`);
  
  // Create database directory if it doesn't exist
  const dbDir = path.dirname(dbPath);
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }
  
  // Open database connection
  db = new Database(dbPath);
  db.pragma('foreign_keys = ON');
  
  console.log('Database connection established successfully');
} catch (error) {
  console.error('Error connecting to database:', error);
  db = null;
}

// Database operations
function getAllMedia() {
  try {
    if (!db) return [];
    
    const stmt = db.prepare(`
      SELECT m.*, mt.name as media_type, st.name as source_type, c.name as collection_name
      FROM Media m
      LEFT JOIN MediaTypes mt ON m.media_type_id = mt.id
      LEFT JOIN SourceTypes st ON m.source_type_id = st.id
      LEFT JOIN Collections c ON m.collection_id = c.id
      ORDER BY m.created_at DESC
    `);
    return stmt.all();
  } catch (error) {
    console.error('Error getting all media:', error);
    return [];
  }
}

// Add media to the database
function addMedia(mediaData) {
  try {
    if (!db) throw new Error('Database not initialized');
    
    const stmt = db.prepare(`
      INSERT INTO Media (
        file_name, file_path, thumbnail_path, title, description,
        media_type_id, source_type_id, capture_date, location, collection_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    const info = stmt.run(
      mediaData.file_name,
      mediaData.file_path,
      mediaData.thumbnail_path,
      mediaData.title,
      mediaData.description,
      mediaData.media_type_id,
      mediaData.source_type_id,
      mediaData.capture_date,
      mediaData.location,
      mediaData.collection_id
    );
    
    return info.lastInsertRowid;
  } catch (error) {
    console.error('Error adding media:', error);
    throw error;
  }
}

// Get all media types
function getMediaTypes() {
  try {
    if (!db) return [];
    
    const stmt = db.prepare('SELECT * FROM MediaTypes ORDER BY name');
    return stmt.all();
  } catch (error) {
    console.error('Error getting media types:', error);
    return [];
  }
}

// Get all source types
function getSourceTypes() {
  try {
    if (!db) return [];
    
    const stmt = db.prepare('SELECT * FROM SourceTypes ORDER BY name');
    return stmt.all();
  } catch (error) {
    console.error('Error getting source types:', error);
    return [];
  }
}

// Get all collections
function getCollections() {
  try {
    if (!db) return [];
    
    const stmt = db.prepare('SELECT * FROM Collections ORDER BY name');
    return stmt.all();
  } catch (error) {
    console.error('Error getting collections:', error);
    return [];
  }
}

// Get all tags
function getTags() {
  try {
    if (!db) return [];
    
    const stmt = db.prepare('SELECT * FROM Tags ORDER BY name');
    return stmt.all();
  } catch (error) {
    console.error('Error getting tags:', error);
    return [];
  }
}

// Get all people
function getPeople() {
  try {
    if (!db) return [];
    
    const stmt = db.prepare('SELECT * FROM People ORDER BY name');
    return stmt.all();
  } catch (error) {
    console.error('Error getting people:', error);
    return [];
  }
}

// Add a tag (if it doesn't exist) and return its ID
function addTag(name) {
  try {
    if (!db) throw new Error('Database not initialized');
    
    // Check if tag exists
    const existingTag = db.prepare('SELECT id FROM Tags WHERE name = ?').get(name);
    if (existingTag) {
      return existingTag.id;
    }
    
    // Create new tag
    const stmt = db.prepare('INSERT INTO Tags (name) VALUES (?)');
    const info = stmt.run(name);
    return info.lastInsertRowid;
  } catch (error) {
    console.error('Error adding tag:', error);
    throw error;
  }
}

// Add a person (if they don't exist) and return their ID
function addPerson(name) {
  try {
    if (!db) throw new Error('Database not initialized');
    
    // Check if person exists
    const existingPerson = db.prepare('SELECT id FROM People WHERE name = ?').get(name);
    if (existingPerson) {
      return existingPerson.id;
    }
    
    // Create new person
    const stmt = db.prepare('INSERT INTO People (name) VALUES (?)');
    const info = stmt.run(name);
    return info.lastInsertRowid;
  } catch (error) {
    console.error('Error adding person:', error);
    throw error;
  }
}

// Link a tag to a media item
function linkTagToMedia(mediaId, tagId) {
  try {
    if (!db) throw new Error('Database not initialized');
    
    const stmt = db.prepare('INSERT OR IGNORE INTO MediaTags (media_id, tag_id) VALUES (?, ?)');
    stmt.run(mediaId, tagId);
    return true;
  } catch (error) {
    console.error('Error linking tag to media:', error);
    throw error;
  }
}

// Link a person to a media item
function linkPersonToMedia(mediaId, personId) {
  try {
    if (!db) throw new Error('Database not initialized');
    
    const stmt = db.prepare('INSERT OR IGNORE INTO MediaPeople (media_id, person_id) VALUES (?, ?)');
    stmt.run(mediaId, personId);
    return true;
  } catch (error) {
    console.error('Error linking person to media:', error);
    throw error;
  }
}

// Export all functions
module.exports = {
  getAllMedia,
  addMedia,
  getMediaTypes,
  getSourceTypes,
  getCollections,
  getTags,
  getPeople,
  addTag,
  addPerson,
  linkTagToMedia,
  linkPersonToMedia
};