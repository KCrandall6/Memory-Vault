// electron/database.cjs - Updated version
const { app } = require('electron');
const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');

// Initialize database connection
let db;
try {
  // Get database path - adjust to use app data folder
  const appDataPath = app.getPath('userData');
  const dbDir = path.join(appDataPath, 'MemoryVault', 'Database');
  const dbPath = path.join(dbDir, 'memory-vault.db');
  
  console.log(`Database path: ${dbPath}`);
  
  // Create database directory if it doesn't exist
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }
  
  // Open database connection
  db = new Database(dbPath);
  db.pragma('foreign_keys = ON');
  
  // Initialize the database with required tables if they don't exist
  const sqlPath = path.join(process.cwd(), 'resources', 'create-database.sql');
  if (fs.existsSync(sqlPath)) {
    const sqlScript = fs.readFileSync(sqlPath, 'utf8');
    db.exec(sqlScript);
    console.log('Database schema initialized');
  }
  
  // Initialize with default values if tables are empty
  initializeDefaultValues();
  
  console.log('Database connection established successfully');
} catch (error) {
  console.error('Error connecting to database:', error);
  db = null;
}

// Initialize default values in lookup tables if they're empty
function initializeDefaultValues() {
  try {
    if (!db) return;
    
    // Check and populate MediaTypes
    const mediaTypesCount = db.prepare('SELECT COUNT(*) as count FROM MediaTypes').get().count;
    if (mediaTypesCount === 0) {
      const mediaTypes = [
        'Image',
        'Video',
        'Document',
        'Audio'
      ];
      
      const insertStmt = db.prepare('INSERT INTO MediaTypes (name) VALUES (?)');
      mediaTypes.forEach(name => insertStmt.run(name));
      console.log('Initialized default media types');
    }
    
    // Check and populate SourceTypes
    const sourceTypesCount = db.prepare('SELECT COUNT(*) as count FROM SourceTypes').get().count;
    if (sourceTypesCount === 0) {
      const sourceTypes = [
        'Digital Camera',
        'Phone',
        'Scanned Photo',
        'Scanned Document',
        'Internet',
        'Other'
      ];
      
      const insertStmt = db.prepare('INSERT INTO SourceTypes (name) VALUES (?)');
      sourceTypes.forEach(name => insertStmt.run(name));
      console.log('Initialized default source types');
    }
    
    // Create a default collection if none exists
    const collectionsCount = db.prepare('SELECT COUNT(*) as count FROM Collections').get().count;
    if (collectionsCount === 0) {
      db.prepare('INSERT INTO Collections (name, description) VALUES (?, ?)')
        .run('General', 'Default collection for uncategorized media');
      console.log('Created default collection');
    }
  } catch (error) {
    console.error('Error initializing default values:', error);
  }
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

// Search media by various criteria
function searchMedia(criteria) {
  try {
    if (!db) return [];
    
    let query = `
      SELECT m.*, mt.name as media_type, st.name as source_type, c.name as collection_name
      FROM Media m
      LEFT JOIN MediaTypes mt ON m.media_type_id = mt.id
      LEFT JOIN SourceTypes st ON m.source_type_id = st.id
      LEFT JOIN Collections c ON m.collection_id = c.id
      WHERE 1=1
    `;
    
    const params = [];
    
    if (criteria.searchTerm) {
      query += ` AND (
        m.title LIKE ? OR
        m.description LIKE ? OR
        m.location LIKE ?
      )`;
      const searchTerm = `%${criteria.searchTerm}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }
    
    if (criteria.mediaTypeId) {
      query += ` AND m.media_type_id = ?`;
      params.push(criteria.mediaTypeId);
    }
    
    if (criteria.sourceTypeId) {
      query += ` AND m.source_type_id = ?`;
      params.push(criteria.sourceTypeId);
    }
    
    if (criteria.collectionId) {
      query += ` AND m.collection_id = ?`;
      params.push(criteria.collectionId);
    }
    
    if (criteria.startDate) {
      query += ` AND m.capture_date >= ?`;
      params.push(criteria.startDate);
    }
    
    if (criteria.endDate) {
      query += ` AND m.capture_date <= ?`;
      params.push(criteria.endDate);
    }
    
    if (criteria.tagIds && criteria.tagIds.length > 0) {
      const placeholders = criteria.tagIds.map(() => '?').join(',');
      query += `
        AND m.id IN (
          SELECT media_id
          FROM MediaTags
          WHERE tag_id IN (${placeholders})
          GROUP BY media_id
          HAVING COUNT(DISTINCT tag_id) = ?
        )
      `;
      params.push(...criteria.tagIds, criteria.tagIds.length);
    }
    
    if (criteria.personIds && criteria.personIds.length > 0) {
      const placeholders = criteria.personIds.map(() => '?').join(',');
      query += `
        AND m.id IN (
          SELECT media_id
          FROM MediaPeople
          WHERE person_id IN (${placeholders})
          GROUP BY media_id
          HAVING COUNT(DISTINCT person_id) = ?
        )
      `;
      params.push(...criteria.personIds, criteria.personIds.length);
    }
    
    query += ` ORDER BY m.created_at DESC`;
    
    if (criteria.limit) {
      query += ` LIMIT ?`;
      params.push(criteria.limit);
    }
    
    if (criteria.offset) {
      query += ` OFFSET ?`;
      params.push(criteria.offset);
    }
    
    const stmt = db.prepare(query);
    return stmt.all(...params);
  } catch (error) {
    console.error('Error searching media:', error);
    return [];
  }
}

// Get a single media record by ID
function getMediaById(id) {
  try {
    if (!db) return null;
    
    const stmt = db.prepare(`
      SELECT m.*, mt.name as media_type, st.name as source_type, c.name as collection_name
      FROM Media m
      LEFT JOIN MediaTypes mt ON m.media_type_id = mt.id
      LEFT JOIN SourceTypes st ON m.source_type_id = st.id
      LEFT JOIN Collections c ON m.collection_id = c.id
      WHERE m.id = ?
    `);
    
    return stmt.get(id);
  } catch (error) {
    console.error('Error getting media by ID:', error);
    return null;
  }
}

// Get media tags by media ID
function getMediaTags(mediaId) {
  try {
    if (!db) return [];
    
    const stmt = db.prepare(`
      SELECT t.*
      FROM Tags t
      JOIN MediaTags mt ON t.id = mt.tag_id
      WHERE mt.media_id = ?
      ORDER BY t.name
    `);
    
    return stmt.all(mediaId);
  } catch (error) {
    console.error('Error getting media tags:', error);
    return [];
  }
}

// Get media people by media ID
function getMediaPeople(mediaId) {
  try {
    if (!db) return [];
    
    const stmt = db.prepare(`
      SELECT p.*
      FROM People p
      JOIN MediaPeople mp ON p.id = mp.person_id
      WHERE mp.media_id = ?
      ORDER BY p.name
    `);
    
    return stmt.all(mediaId);
  } catch (error) {
    console.error('Error getting media people:', error);
    return [];
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

// Add a new collection
function addCollection(name, description = '') {
  try {
    if (!db) throw new Error('Database not initialized');
    
    // Check if collection exists
    const existingCollection = db.prepare('SELECT id FROM Collections WHERE name = ?').get(name);
    if (existingCollection) {
      return existingCollection.id;
    }
    
    // Create new collection
    const stmt = db.prepare('INSERT INTO Collections (name, description) VALUES (?, ?)');
    const info = stmt.run(name, description);
    return info.lastInsertRowid;
  } catch (error) {
    console.error('Error adding collection:', error);
    throw error;
  }
}

// Update media record
function updateMedia(id, mediaData) {
  try {
    if (!db) throw new Error('Database not initialized');
    
    const stmt = db.prepare(`
      UPDATE Media SET
        title = ?,
        description = ?,
        media_type_id = ?,
        source_type_id = ?,
        capture_date = ?,
        location = ?,
        collection_id = ?
      WHERE id = ?
    `);
    
    const info = stmt.run(
      mediaData.title,
      mediaData.description,
      mediaData.media_type_id,
      mediaData.source_type_id,
      mediaData.capture_date,
      mediaData.location,
      mediaData.collection_id,
      id
    );
    
    return info.changes > 0;
  } catch (error) {
    console.error('Error updating media:', error);
    throw error;
  }
}

// Delete media record
function deleteMedia(id) {
  try {
    if (!db) throw new Error('Database not initialized');
    
    // Begin transaction
    db.prepare('BEGIN TRANSACTION').run();
    
    try {
      // Delete related tags
      db.prepare('DELETE FROM MediaTags WHERE media_id = ?').run(id);
      
      // Delete related people
      db.prepare('DELETE FROM MediaPeople WHERE media_id = ?').run(id);
      
      // Delete related comments
      db.prepare('DELETE FROM Comments WHERE media_id = ?').run(id);
      
      // Delete the media record
      const stmt = db.prepare('DELETE FROM Media WHERE id = ?');
      const info = stmt.run(id);
      
      // Commit transaction
      db.prepare('COMMIT').run();
      
      return info.changes > 0;
    } catch (error) {
      // Rollback transaction in case of error
      db.prepare('ROLLBACK').run();
      throw error;
    }
  } catch (error) {
    console.error('Error deleting media:', error);
    throw error;
  }
}

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