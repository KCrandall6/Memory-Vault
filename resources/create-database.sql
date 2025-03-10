CREATE TABLE IF NOT EXISTS MediaTypes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS SourceTypes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS Collections (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT
);

CREATE TABLE IF NOT EXISTS Media (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    file_name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    thumbnail_path TEXT, -- Path for small preview images
    title TEXT,
    description TEXT,
    media_type_id INTEGER NOT NULL,
    source_type_id INTEGER,
    capture_date TEXT, -- Stored as ISO 8601 format: "YYYY-MM-DD HH:MM:SS"
    location TEXT,
    collection_id INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (collection_id) REFERENCES Collections(id),
    FOREIGN KEY (media_type_id) REFERENCES MediaTypes(id),
    FOREIGN KEY (source_type_id) REFERENCES SourceTypes(id)
);

CREATE TABLE IF NOT EXISTS People (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS MediaPeople (
    media_id INTEGER,
    person_id INTEGER,
    PRIMARY KEY (media_id, person_id),
    FOREIGN KEY (media_id) REFERENCES Media(id),
    FOREIGN KEY (person_id) REFERENCES People(id)
);

CREATE TABLE IF NOT EXISTS Tags (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS MediaTags (
    media_id INTEGER,
    tag_id INTEGER,
    PRIMARY KEY (media_id, tag_id),
    FOREIGN KEY (media_id) REFERENCES Media(id),
    FOREIGN KEY (tag_id) REFERENCES Tags(id)
);

CREATE TABLE IF NOT EXISTS Comments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    media_id INTEGER,
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (media_id) REFERENCES Media(id)
);

-- Indexes for faster search performance
CREATE INDEX IF NOT EXISTS idx_media_date ON Media (capture_date);
CREATE INDEX IF NOT EXISTS idx_media_location ON Media (location);
CREATE INDEX IF NOT EXISTS idx_media_collection ON Media (collection_id);