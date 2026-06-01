import { dbPool } from "./pool.js";

const initSchema = `
    -- Enable the vector extension
    CREATE EXTENSION IF NOT EXISTS vector;

    -- Drop table if it exists (for a clean slate during development)
    DROP TABLE IF EXISTS knowledge_chunks;

    -- Create the table
    CREATE TABLE knowledge_chunks (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        document_name VARCHAR(255) NOT NULL,
        chunk_text TEXT NOT NULL,
        search_vector TSVECTOR GENERATED ALWAYS AS (to_tsvector('english', chunk_text)) STORED,
        embedding vector(384) 
    );

    -- Index for Full-Text Search (Lexical matching)
    CREATE INDEX idx_search_vector ON knowledge_chunks USING GIN (search_vector);

    -- Index for Semantic Search (Vector similarity using HNSW)
    CREATE INDEX idx_embedding ON knowledge_chunks USING hnsw (embedding vector_cosine_ops);
`

async function runMigration(){
    console.log(`[MIGRATION] CONNECTING TO THE DATABASE `)
    try {
        await dbPool.query(initSchema);
        console.log('[MIGRATION] Tables and specialized indexes created successfully!');
    } catch (error) {
        console.error('[MIGRATION] Execution failed:', error);
    } finally {
        await dbPool.end();
        console.log('[MIGRATION] Connection closed.');
    }
}

runMigration()