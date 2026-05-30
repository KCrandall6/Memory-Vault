// electron/database.cjs - Updated version
const { app } = require('electron');
const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');
const { pathToFileURL } = require('url');
const storageRoot = require('./storage-root.cjs');

const {
  ensureStorageRoot,
  ensureArchiveDirectory,
  getDatabasePath,
  resolveArchiveFilePath
} = storageRoot;

const SYSTEM_COLLECTION_NAMES = ['general', 'unfiled memories', 'ungrouped memories'];
const UNGROUPED_COLLECTION_ID = 'ungrouped';
const UNGROUPED_COLLECTION_NAME = 'Ungrouped Memories';
const UNGROUPED_COLLECTION_DESCRIPTION = 'Memories without a collection.';

function normalizeCollectionName(name) {
  return String(name || '').trim().toLowerCase();
}

function isSystemCollectionName(name) {
  return SYSTEM_COLLECTION_NAMES.includes(normalizeCollectionName(name));
}

function systemCollectionPlaceholders() {
  return SYSTEM_COLLECTION_NAMES.map(() => '?').join(',');
}

function resolveMediaAbsolutePath(filePath) {
  return resolveArchiveFilePath(filePath);
}

function resolveSchemaPath() {
  const candidatePaths = [
    path.join(process.cwd(), 'resources', 'create-database.sql'),
    path.join(app.getAppPath(), 'resources', 'create-database.sql'),
    path.join(process.resourcesPath || '', 'create-database.sql')
  ];

  for (const candidate of candidatePaths) {
    if (candidate && fs.existsSync(candidate)) {
      return candidate;
    }
  }

  return null;
}

// Initialize database connection
let db;
try {
  ensureStorageRoot();
  ensureArchiveDirectory();
  const dbPath = getDatabasePath();
  const dbDir = path.dirname(dbPath);
  
  console.log(`Database path: ${dbPath}`);
  
  // Create database directory if it doesn't exist
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }
  
  // Open database connection
  db = new Database(dbPath);
  db.pragma('foreign_keys = ON');
  
  // Initialize the database with required tables if they don't exist
  const sqlPath = resolveSchemaPath();
  if (sqlPath) {
    const sqlScript = fs.readFileSync(sqlPath, 'utf8');
    db.exec(sqlScript);
    console.log('Database schema initialized');
  } else {
    console.warn('Database schema file not found. Skipping initialization script.');
  }
  
  // Initialize with default values if tables are empty
  initializeDefaultValues();
  
  console.log('Database connection established successfully');
} catch (error) {
  console.error('Error connecting to database:', error);
  db = null;
}

function migrateSystemCollectionsToUngrouped() {
  const placeholders = systemCollectionPlaceholders();
  const systemCollections = db.prepare(`
    SELECT id, name
    FROM Collections
    WHERE LOWER(TRIM(name)) IN (${placeholders})
  `).all(...SYSTEM_COLLECTION_NAMES);

  if (systemCollections.length === 0) return;

  const ids = systemCollections.map((collection) => collection.id);
  const idPlaceholders = ids.map(() => '?').join(',');

  db.prepare(`UPDATE Media SET collection_id = NULL WHERE collection_id IN (${idPlaceholders})`).run(...ids);
  db.prepare(`DELETE FROM Collections WHERE id IN (${idPlaceholders})`).run(...ids);
  console.log(`Migrated ${systemCollections.length} legacy default collection(s) to ungrouped media`);
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
    
    migrateSystemCollectionsToUngrouped();
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
function buildRelevanceClause({ searchTerm, titleTerm, locationTerm, peopleText, tagsText }) {
  const clauses = [];
  const params = [];

  if (searchTerm) {
    const like = `%${searchTerm}%`;
    clauses.push(`CASE WHEN LOWER(m.title) LIKE ? THEN 5 ELSE 0 END`);
    params.push(like);
    clauses.push(`CASE WHEN LOWER(m.description) LIKE ? THEN 3 ELSE 0 END`);
    params.push(like);
    clauses.push(`CASE WHEN LOWER(m.location) LIKE ? THEN 2 ELSE 0 END`);
    params.push(like);
  }

  if (titleTerm) {
    clauses.push(`CASE WHEN LOWER(m.title) LIKE ? THEN 4 ELSE 0 END`);
    params.push(`%${titleTerm}%`);
  }

  if (locationTerm) {
    clauses.push(`CASE WHEN LOWER(m.location) LIKE ? THEN 2 ELSE 0 END`);
    params.push(`%${locationTerm}%`);
  }

  if (peopleText) {
    clauses.push(`CASE WHEN EXISTS (SELECT 1 FROM MediaPeople mp JOIN People p ON p.id = mp.person_id WHERE mp.media_id = m.id AND LOWER(p.name) LIKE ?) THEN 3 ELSE 0 END`);
    params.push(`%${peopleText}%`);
    } else if (searchTerm) {
    const like = `%${searchTerm}%`;
    clauses.push(`CASE WHEN EXISTS (SELECT 1 FROM MediaPeople mp JOIN People p ON p.id = mp.person_id WHERE mp.media_id = m.id AND LOWER(p.name) LIKE ?) THEN 2 ELSE 0 END`);
    params.push(like);
  }

  if (tagsText) {
    clauses.push(`CASE WHEN EXISTS (SELECT 1 FROM MediaTags mt2 JOIN Tags t2 ON t2.id = mt2.tag_id WHERE mt2.media_id = m.id AND LOWER(t2.name) LIKE ?) THEN 2 ELSE 0 END`);
    params.push(`%${tagsText}%`);
  }

  const relevanceSql = clauses.length > 0 ? clauses.join(' + ') : '0';
  return { relevanceSql, relevanceParams: params };
}

function mapAggregates(row) {
  const absolutePath = resolveMediaAbsolutePath(row.file_path);
  const absoluteThumbnail = resolveMediaAbsolutePath(row.thumbnail_path);
  return {
    ...row,
    media_type: row.media_type,
    collection_name: row.collection_name,
    tags: row.tags ? row.tags.split('|').filter(Boolean) : [],
    people: row.people ? row.people.split('|').filter(Boolean) : [],
    file_path: absolutePath || row.file_path,
    file_url: absolutePath ? pathToFileURL(absolutePath).href : null,
    thumbnail_path: absoluteThumbnail || row.thumbnail_path,
    thumbnail_url: absoluteThumbnail ? pathToFileURL(absoluteThumbnail).href : null
  };
}

function searchMedia(criteria = {}) {
  try {
    if (!db) return [];

    const {
      text,
      title,
      location,
      mediaTypeIds = [],
      collectionIds = [],
      tagIds = [],
      personIds = [],
      dateFrom,
      dateTo,
      peopleText,
      tagsText,
      sort = 'newest',
      limit = 25,
      offset = 0
    } = criteria;

    const searchTerm = text ? text.toLowerCase().trim() : '';
    const titleTerm = title ? title.toLowerCase().trim() : '';
    const locationTerm = location ? location.toLowerCase().trim() : '';
    const peopleTerm = peopleText ? peopleText.toLowerCase().trim() : '';
    const tagsTerm = tagsText ? tagsText.toLowerCase().trim() : '';
    const selectedCollectionIds = Array.isArray(collectionIds) ? collectionIds.filter(Boolean).map(Number) : [];
    const ungroupedOnly = criteria.ungrouped === true;

    const { relevanceSql, relevanceParams } = buildRelevanceClause({
      searchTerm,
      titleTerm,
      locationTerm,
      peopleText: peopleTerm,
      tagsText: tagsTerm
    });

    let query = `
      SELECT
        m.id,
        m.title,
        m.description,
        m.capture_date,
        m.created_at,
        m.location,
        m.file_path,
        m.thumbnail_path,
        m.media_type_id,
        mt.name as media_type,
        c.name as collection_name,
        REPLACE(GROUP_CONCAT(DISTINCT t.name), ',', '|') as tags,
        REPLACE(GROUP_CONCAT(DISTINCT p.name), ',', '|') as people,
        ${relevanceSql} as relevance
      FROM Media m
      LEFT JOIN MediaTypes mt ON m.media_type_id = mt.id
      LEFT JOIN SourceTypes st ON m.source_type_id = st.id
      LEFT JOIN Collections c ON m.collection_id = c.id
      LEFT JOIN MediaTags mtg ON m.id = mtg.media_id
      LEFT JOIN Tags t ON mtg.tag_id = t.id
      LEFT JOIN MediaPeople mp ON m.id = mp.media_id
      LEFT JOIN People p ON mp.person_id = p.id
      WHERE 1=1
    `;

    const params = [...relevanceParams];

    if (searchTerm) {
      const like = `%${searchTerm}%`;
      query +=
        ` AND (LOWER(m.title) LIKE ? OR LOWER(m.description) LIKE ? OR LOWER(m.location) LIKE ? OR EXISTS (SELECT 1 FROM MediaPeople mp2 JOIN People p2 ON p2.id = mp2.person_id WHERE mp2.media_id = m.id AND LOWER(p2.name) LIKE ?))`;
      params.push(like, like, like, like);
    }

    if (titleTerm) {
      query += ` AND LOWER(m.title) LIKE ?`;
      params.push(`%${titleTerm}%`);
    }

    if (locationTerm) {
      query += ` AND LOWER(m.location) LIKE ?`;
      params.push(`%${locationTerm}%`);
    }

    if (mediaTypeIds.length > 0) {
      const placeholders = mediaTypeIds.map(() => '?').join(',');
      query += ` AND m.media_type_id IN (${placeholders})`;
      params.push(...mediaTypeIds);
    }

    if (ungroupedOnly) {
      query += ` AND (m.collection_id IS NULL OR LOWER(TRIM(c.name)) IN (${systemCollectionPlaceholders()}))`;
      params.push(...SYSTEM_COLLECTION_NAMES);
    } else if (selectedCollectionIds.length > 0) {
      const placeholders = selectedCollectionIds.map(() => '?').join(',');
      query += ` AND m.collection_id IN (${placeholders})`;
      params.push(...selectedCollectionIds);
    }

    if (dateFrom) {
      query += ` AND m.capture_date >= ?`;
      params.push(dateFrom);
    }

    if (dateTo) {
      query += ` AND m.capture_date <= ?`;
      params.push(dateTo);
    }

    if (tagIds.length > 0) {
      const placeholders = tagIds.map(() => '?').join(',');
      query += `
        AND m.id IN (
          SELECT media_id
          FROM MediaTags
          WHERE tag_id IN (${placeholders})
          GROUP BY media_id
          HAVING COUNT(DISTINCT tag_id) = ?
        )
      `;
      params.push(...tagIds, tagIds.length);
    }

    if (personIds.length > 0) {
      const placeholders = personIds.map(() => '?').join(',');
      query += `
        AND m.id IN (
          SELECT media_id
          FROM MediaPeople
          WHERE person_id IN (${placeholders})
          GROUP BY media_id
          HAVING COUNT(DISTINCT person_id) = ?
        )
      `;
      params.push(...personIds, personIds.length);
    }

    if (peopleTerm) {
      query += ` AND EXISTS (SELECT 1 FROM MediaPeople mp2 JOIN People p2 ON p2.id = mp2.person_id WHERE mp2.media_id = m.id AND LOWER(p2.name) LIKE ?)`;
      params.push(`%${peopleTerm}%`);
    }

    if (tagsTerm) {
      query += ` AND EXISTS (SELECT 1 FROM MediaTags mt2 JOIN Tags t2 ON t2.id = mt2.tag_id WHERE mt2.media_id = m.id AND LOWER(t2.name) LIKE ?)`;
      params.push(`%${tagsTerm}%`);
    }

    query += ' GROUP BY m.id';

    const sortClause = (() => {
      switch (sort) {
        case 'oldest':
          return 'CASE WHEN m.capture_date IS NULL THEN 1 ELSE 0 END, m.capture_date ASC, m.created_at ASC';
        case 'title':
          return 'LOWER(m.title) ASC';
        case 'type':
          return 'LOWER(mt.name) ASC, m.created_at DESC';
        case 'uploaded':
          return 'm.created_at DESC';
        default:
          return 'relevance DESC, CASE WHEN m.capture_date IS NULL THEN 1 ELSE 0 END, m.capture_date DESC, m.created_at DESC';
      }
    })();

    query += ` ORDER BY ${sortClause}`;
    query += ' LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const stmt = db.prepare(query);
    const rows = stmt.all(...params);
    return rows.map(mapAggregates);
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

function getMediaDetails(id) {
  try {
    if (!db) return null;

    const stmt = db.prepare(`
      SELECT
        m.id,
        m.title,
        m.description,
        m.capture_date,
        m.created_at,
        m.location,
        m.file_path,
        m.thumbnail_path,
        m.media_type_id,
        mt.name as media_type,
        c.name as collection_name,
        REPLACE(GROUP_CONCAT(DISTINCT t.name), ',', '|') as tags,
        REPLACE(GROUP_CONCAT(DISTINCT p.name), ',', '|') as people
      FROM Media m
      LEFT JOIN MediaTypes mt ON m.media_type_id = mt.id
      LEFT JOIN Collections c ON m.collection_id = c.id
      LEFT JOIN MediaTags mtg ON m.id = mtg.media_id
      LEFT JOIN Tags t ON mtg.tag_id = t.id
      LEFT JOIN MediaPeople mp ON m.id = mp.media_id
      LEFT JOIN People p ON mp.person_id = p.id
      WHERE m.id = ?
      GROUP BY m.id
    `);

    const row = stmt.get(id);
    if (!row) return null;
    return mapAggregates(row);
  } catch (error) {
    console.error('Error getting media details:', error);
    return null;
  }
}

function resolveCollectionId(collection) {
  if (collection === null || collection === undefined || collection === '') return null;
  if (typeof collection === 'number') return collection;
  if (isSystemCollectionName(collection)) return null;
  const existing = db.prepare('SELECT id FROM Collections WHERE LOWER(name) = LOWER(?)').get(collection);
  if (existing) return existing.id;
  return addCollection(collection, '');
}

function replaceMediaTags(mediaId, tags = []) {
  db.prepare('DELETE FROM MediaTags WHERE media_id = ?').run(mediaId);
  if (!tags || tags.length === 0) return;

  const linkStmt = db.prepare('INSERT OR IGNORE INTO MediaTags (media_id, tag_id) VALUES (?, ?)');
  tags.forEach((tagName) => {
    const tagId = addTag(tagName);
    linkStmt.run(mediaId, tagId);
  });
}

function replaceMediaPeople(mediaId, people = []) {
  db.prepare('DELETE FROM MediaPeople WHERE media_id = ?').run(mediaId);
  if (!people || people.length === 0) return;

  const linkStmt = db.prepare('INSERT OR IGNORE INTO MediaPeople (media_id, person_id) VALUES (?, ?)');
  people.forEach((personName) => {
    const personId = addPerson(personName);
    linkStmt.run(mediaId, personId);
  });
}

function updateMediaWithRelations(id, mediaData) {
  try {
    if (!db) throw new Error('Database not initialized');

    db.prepare('BEGIN').run();

    const collectionId = resolveCollectionId(mediaData.collection);

    const stmt = db.prepare(`
      UPDATE Media SET
        title = ?,
        description = ?,
        capture_date = ?,
        location = ?,
        collection_id = ?,
        media_type_id = COALESCE(?, media_type_id)
      WHERE id = ?
    `);

    stmt.run(
      mediaData.title,
      mediaData.description,
      mediaData.capture_date || null,
      mediaData.location || null,
      collectionId,
      mediaData.media_type_id || null,
      id
    );

    replaceMediaTags(id, mediaData.tags || []);
    replaceMediaPeople(id, mediaData.people || []);

    db.prepare('COMMIT').run();
    return getMediaDetails(id);
  } catch (error) {
    db?.prepare('ROLLBACK').run();
    console.error('Error updating media with relations:', error);
    throw error;
  }
}


function getDashboardSummary() {
  try {
    if (!db) {
      return {
        totalMedia: 0,
        collectionsCount: 0,
        peopleCount: 0,
        tagsCount: 0,
        mediaTypeCounts: {}
      };
    }

    const totalMedia = db.prepare('SELECT COUNT(*) as count FROM Media').get().count || 0;
    const collectionsCount = db.prepare('SELECT COUNT(*) as count FROM Collections').get().count || 0;
    const peopleCount = db.prepare('SELECT COUNT(*) as count FROM People').get().count || 0;
    const tagsCount = db.prepare('SELECT COUNT(*) as count FROM Tags').get().count || 0;
    const typeRows = db.prepare(`
      SELECT LOWER(mt.name) as media_type, COUNT(m.id) as count
      FROM MediaTypes mt
      LEFT JOIN Media m ON m.media_type_id = mt.id
      GROUP BY mt.id, mt.name
    `).all();

    const mediaTypeCounts = typeRows.reduce((counts, row) => {
      counts[row.media_type] = row.count || 0;
      return counts;
    }, {});

    return {
      totalMedia,
      collectionsCount,
      peopleCount,
      tagsCount,
      mediaTypeCounts
    };
  } catch (error) {
    console.error('Error getting dashboard summary:', error);
    return {
      totalMedia: 0,
      collectionsCount: 0,
      peopleCount: 0,
      tagsCount: 0,
      mediaTypeCounts: {}
    };
  }
}


function coverUrlsForRow(row) {
  const absoluteThumbnail = resolveMediaAbsolutePath(row.thumbnail_path);
  const absoluteFile = resolveMediaAbsolutePath(row.file_path);
  return {
    thumbnail_path: absoluteThumbnail || row.thumbnail_path || null,
    thumbnail_url: absoluteThumbnail ? pathToFileURL(absoluteThumbnail).href : null,
    file_path: absoluteFile || row.file_path || null,
    file_url: absoluteFile ? pathToFileURL(absoluteFile).href : null,
    media_type: row.media_type || null
  };
}

function getCollectionSummaries() {
  try {
    if (!db) return [];
    const systemPlaceholders = systemCollectionPlaceholders();
    const rows = db.prepare(`
      SELECT
        c.id,
        c.name,
        c.description,
        COUNT(m.id) as media_count,
        MIN(CASE WHEN m.capture_date IS NOT NULL AND m.capture_date != '' THEN strftime('%Y', m.capture_date) END) as start_year,
        MAX(CASE WHEN m.capture_date IS NOT NULL AND m.capture_date != '' THEN strftime('%Y', m.capture_date) END) as end_year,
        cover.file_path,
        cover.thumbnail_path,
        cover_type.name as media_type,
        0 as is_system_grouping
      FROM Collections c
      LEFT JOIN Media m ON m.collection_id = c.id
      LEFT JOIN Media cover ON cover.id = (
        SELECT m2.id
        FROM Media m2
        LEFT JOIN MediaTypes mt2 ON mt2.id = m2.media_type_id
        WHERE m2.collection_id = c.id
        ORDER BY CASE WHEN LOWER(mt2.name) = 'image' THEN 0 ELSE 1 END, m2.thumbnail_path IS NULL, m2.created_at DESC
        LIMIT 1
      )
      LEFT JOIN MediaTypes cover_type ON cover_type.id = cover.media_type_id
      WHERE LOWER(TRIM(c.name)) NOT IN (${systemPlaceholders})
      GROUP BY c.id
      ORDER BY c.name COLLATE NOCASE
    `).all(...SYSTEM_COLLECTION_NAMES);

    const ungrouped = db.prepare(`
      SELECT
        ? as id,
        ? as name,
        ? as description,
        COUNT(m.id) as media_count,
        MIN(CASE WHEN m.capture_date IS NOT NULL AND m.capture_date != '' THEN strftime('%Y', m.capture_date) END) as start_year,
        MAX(CASE WHEN m.capture_date IS NOT NULL AND m.capture_date != '' THEN strftime('%Y', m.capture_date) END) as end_year,
        cover.file_path,
        cover.thumbnail_path,
        cover_type.name as media_type,
        1 as is_system_grouping
      FROM Media m
      LEFT JOIN Collections c ON c.id = m.collection_id
      LEFT JOIN Media cover ON cover.id = (
        SELECT m2.id
        FROM Media m2
        LEFT JOIN Collections c2 ON c2.id = m2.collection_id
        LEFT JOIN MediaTypes mt2 ON mt2.id = m2.media_type_id
        WHERE m2.collection_id IS NULL OR LOWER(TRIM(c2.name)) IN (${systemPlaceholders})
        ORDER BY CASE WHEN LOWER(mt2.name) = 'image' THEN 0 ELSE 1 END, m2.thumbnail_path IS NULL, m2.created_at DESC
        LIMIT 1
      )
      LEFT JOIN MediaTypes cover_type ON cover_type.id = cover.media_type_id
      WHERE m.collection_id IS NULL OR LOWER(TRIM(c.name)) IN (${systemPlaceholders})
    `).get(
      UNGROUPED_COLLECTION_ID,
      UNGROUPED_COLLECTION_NAME,
      UNGROUPED_COLLECTION_DESCRIPTION,
      ...SYSTEM_COLLECTION_NAMES,
      ...SYSTEM_COLLECTION_NAMES
    );

    const normalizedRows = rows.map((row) => ({ ...row, ...coverUrlsForRow(row) }));
    if (ungrouped && ungrouped.media_count > 0) {
      normalizedRows.push({ ...ungrouped, ...coverUrlsForRow(ungrouped) });
    }

    return normalizedRows;
  } catch (error) {
    console.error('Error getting collection summaries:', error);
    return [];
  }
}

function getCollectionMedia(collectionId) {
  if (String(collectionId) === UNGROUPED_COLLECTION_ID) {
    return searchMedia({ ungrouped: true, sort: 'uploaded', limit: 1000, offset: 0 });
  }
  return searchMedia({ collectionIds: [Number(collectionId)], sort: 'uploaded', limit: 1000, offset: 0 });
}

function getPeopleSummaries() {
  try {
    if (!db) return [];
    const rows = db.prepare(`
      SELECT
        p.id,
        p.name,
        COUNT(DISTINCT m.id) as media_count,
        MIN(CASE WHEN m.capture_date IS NOT NULL AND m.capture_date != '' THEN strftime('%Y', m.capture_date) END) as start_year,
        MAX(CASE WHEN m.capture_date IS NOT NULL AND m.capture_date != '' THEN strftime('%Y', m.capture_date) END) as end_year,
        cover.file_path,
        cover.thumbnail_path,
        cover_type.name as media_type
      FROM People p
      LEFT JOIN MediaPeople mp ON mp.person_id = p.id
      LEFT JOIN Media m ON m.id = mp.media_id
      LEFT JOIN Media cover ON cover.id = (
        SELECT m2.id
        FROM MediaPeople mp2
        JOIN Media m2 ON m2.id = mp2.media_id
        LEFT JOIN MediaTypes mt2 ON mt2.id = m2.media_type_id
        WHERE mp2.person_id = p.id
        ORDER BY CASE WHEN LOWER(mt2.name) = 'image' THEN 0 ELSE 1 END, m2.thumbnail_path IS NULL, m2.created_at DESC
        LIMIT 1
      )
      LEFT JOIN MediaTypes cover_type ON cover_type.id = cover.media_type_id
      GROUP BY p.id
      HAVING media_count > 0
      ORDER BY p.name COLLATE NOCASE
    `).all();

    return rows.map((row) => ({ ...row, ...coverUrlsForRow(row) }));
  } catch (error) {
    console.error('Error getting people summaries:', error);
    return [];
  }
}

function getPersonMedia(personId) {
  return searchMedia({ personIds: [Number(personId)], sort: 'uploaded', limit: 1000, offset: 0 });
}

function getTagSummaries() {
  try {
    if (!db) return [];
    return db.prepare(`
      SELECT
        t.id,
        t.name,
        COUNT(DISTINCT mt.media_id) as media_count
      FROM Tags t
      LEFT JOIN MediaTags mt ON mt.tag_id = t.id
      GROUP BY t.id
      HAVING media_count > 0
      ORDER BY media_count DESC, t.name COLLATE NOCASE ASC
    `).all();
  } catch (error) {
    console.error('Error getting tag summaries:', error);
    return [];
  }
}

function getTagMedia(tagId) {
  return searchMedia({ tagIds: [Number(tagId)], sort: 'uploaded', limit: 1000, offset: 0 });
}

function getDateSummaries() {
  try {
    if (!db) return [];
    const rows = db.prepare(`
      SELECT
        strftime('%Y', m.capture_date) as year,
        COUNT(m.id) as media_count,
        MIN(m.capture_date) as start_date,
        MAX(m.capture_date) as end_date,
        cover.file_path,
        cover.thumbnail_path,
        cover_type.name as media_type
      FROM Media m
      LEFT JOIN Media cover ON cover.id = (
        SELECT m2.id
        FROM Media m2
        LEFT JOIN MediaTypes mt2 ON mt2.id = m2.media_type_id
        WHERE strftime('%Y', m2.capture_date) = strftime('%Y', m.capture_date)
          AND m2.capture_date IS NOT NULL
          AND m2.capture_date != ''
        ORDER BY CASE WHEN LOWER(mt2.name) = 'image' THEN 0 ELSE 1 END, m2.thumbnail_path IS NULL, m2.capture_date ASC
        LIMIT 1
      )
      LEFT JOIN MediaTypes cover_type ON cover_type.id = cover.media_type_id
      WHERE m.capture_date IS NOT NULL AND m.capture_date != ''
      GROUP BY year
      ORDER BY year DESC
    `).all();

    return rows.map((row) => ({ ...row, ...coverUrlsForRow(row) }));
  } catch (error) {
    console.error('Error getting date summaries:', error);
    return [];
  }
}

function getDateMedia(year) {
  return searchMedia({ dateFrom: `${year}-01-01`, dateTo: `${year}-12-31`, sort: 'oldest', limit: 1000, offset: 0 });
}


function updateCollectionDetails(id, { name, description = '' }) {
  try {
    if (!db) throw new Error('Database not initialized');
    if (String(id) === UNGROUPED_COLLECTION_ID) throw new Error('Ungrouped Memories is a system grouping and cannot be edited');
    const trimmedName = String(name || '').trim();
    if (!trimmedName) throw new Error('Collection name is required');
    if (isSystemCollectionName(trimmedName)) throw new Error('This name is reserved for ungrouped media');

    db.prepare('UPDATE Collections SET name = ?, description = ? WHERE id = ?')
      .run(trimmedName, description || '', Number(id));

    return db.prepare('SELECT * FROM Collections WHERE id = ?').get(Number(id));
  } catch (error) {
    console.error('Error updating collection details:', error);
    throw error;
  }
}

function deleteCollectionIfEmpty(id) {
  try {
    if (!db) throw new Error('Database not initialized');
    if (String(id) === UNGROUPED_COLLECTION_ID) {
      return { success: false, blocked: true, mediaCount: 0, error: 'Ungrouped Memories is a system grouping and cannot be deleted' };
    }
    const collectionId = Number(id);
    const mediaCount = db.prepare('SELECT COUNT(*) as count FROM Media WHERE collection_id = ?').get(collectionId).count;
    if (mediaCount > 0) {
      return { success: false, blocked: true, mediaCount };
    }

    const info = db.prepare('DELETE FROM Collections WHERE id = ?').run(collectionId);
    return { success: info.changes > 0, blocked: false, mediaCount: 0 };
  } catch (error) {
    console.error('Error deleting collection:', error);
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
    
    const stmt = db.prepare(`
      SELECT * FROM Collections
      WHERE LOWER(TRIM(name)) NOT IN (${systemCollectionPlaceholders()})
      ORDER BY name
    `);
    return stmt.all(...SYSTEM_COLLECTION_NAMES);
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

// Add a new collection with description
function addCollection(name, description = '') {
  try {
    if (!db) throw new Error('Database not initialized');
    if (isSystemCollectionName(name)) return null;
    
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
  searchMedia,
  getMediaDetails,
  getDashboardSummary,
  getCollectionSummaries,
  getCollectionMedia,
  getPeopleSummaries,
  getPersonMedia,
  getTagSummaries,
  getTagMedia,
  getDateSummaries,
  getDateMedia,
  updateCollectionDetails,
  deleteCollectionIfEmpty,
  getMediaTypes,
  getSourceTypes,
  getCollections,
  getTags,
  getPeople,
  addTag,
  addPerson,
  linkTagToMedia,
  linkPersonToMedia,
  addCollection,
  updateMediaWithRelations,
  deleteMedia
};