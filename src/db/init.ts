import { dbPool } from "./pool.js";

const initSchema = `
    -- 1. Enable Required Extensions
    CREATE EXTENSION IF NOT EXISTS vector;
    CREATE EXTENSION IF NOT EXISTS pgcrypto; 

    -- 2. CLEAN SLATE: Drop everything to prevent collisions during migration
    DROP FUNCTION IF EXISTS match_documents_hybrid(text, vector, int, uuid);
    DROP FUNCTION IF EXISTS match_documents_hybrid(text, vector, int);
    DROP TABLE IF EXISTS semantic_cache CASCADE;
    DROP TABLE IF EXISTS knowledge_base CASCADE;
    DROP TABLE IF EXISTS documents CASCADE;
    DROP TABLE IF EXISTS users CASCADE;

    -- 3. TABLE 1: Users (Authentication Target)
    CREATE TABLE users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- 4. TABLE 2: Documents (The Parent File & Metadata)
    CREATE TABLE documents (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        filename TEXT NOT NULL,
        metadata JSONB DEFAULT '{}'::jsonb,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- 5. TABLE 3: Knowledge Base (The Hybrid Search Engine)
    CREATE TABLE knowledge_base (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
        chunk_index INTEGER,
        title TEXT, 
        content TEXT NOT NULL,
        embedding vector(384),          
        -- Auto-generates the lexical tokens so Node.js doesn't have to
        text_search_vector tsvector GENERATED ALWAYS AS (to_tsvector('english', content)) STORED
    );

    -- 6. TABLE 4: Semantic Cache (The LLM Speed Booster)
    CREATE TABLE semantic_cache (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_prompt TEXT NOT NULL,
        prompt_embedding vector(384), 
        ai_response TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- 7. Create Highly Optimized Indexes
    -- GIN Index for lightning-fast keyword searching
    CREATE INDEX idx_fts ON knowledge_base USING gin(text_search_vector);
    
    -- HNSW Indexes for ultra-fast vector math
    CREATE INDEX idx_kb_embedding ON knowledge_base USING hnsw (embedding vector_cosine_ops);
    CREATE INDEX idx_cache_embedding ON semantic_cache USING hnsw (prompt_embedding vector_cosine_ops);

    -- 8. The Hybrid Search RRF Function (Upgraded for User Isolation)
    CREATE OR REPLACE FUNCTION match_documents_hybrid(
        query_text TEXT,
        query_embedding vector(384),
        match_count INT DEFAULT 5,
        p_user_id UUID DEFAULT NULL
    ) RETURNS TABLE (
        id UUID,
        title TEXT,
        content TEXT,
        score FLOAT
    ) LANGUAGE plpgsql AS $$
    BEGIN
        RETURN QUERY
        WITH user_docs AS (
            -- SECURE: Isolate knowledge chunks to ONLY the requesting user
            SELECT kb.id, kb.embedding, kb.text_search_vector, kb.title, kb.content
            FROM knowledge_base kb
            JOIN documents d ON kb.document_id = d.id
            WHERE d.user_id = p_user_id
        ),
        semantic_search AS (
            SELECT ud.id, RANK() OVER (ORDER BY ud.embedding <=> query_embedding) AS rank
            FROM user_docs ud
            WHERE ud.embedding IS NOT NULL
            ORDER BY ud.embedding <=> query_embedding
            LIMIT 20
        ),
        keyword_search AS (
            SELECT ud.id, RANK() OVER (ORDER BY ts_rank(ud.text_search_vector, to_tsquery('english', replace(plainto_tsquery('english', query_text)::text, '&', '|'))) DESC) AS rank
            FROM user_docs ud
            WHERE ud.text_search_vector @@ to_tsquery('english', replace(plainto_tsquery('english', query_text)::text, '&', '|'))
            LIMIT 20
        )
        SELECT
            ud.id,
            ud.title,
            ud.content,
            (COALESCE(1.0 / (60 + ss.rank), 0.0) + COALESCE(1.0 / (60 + ks.rank), 0.0))::FLOAT AS rrf_score
        FROM user_docs ud
        LEFT JOIN semantic_search ss ON ud.id = ss.id
        LEFT JOIN keyword_search ks ON ud.id = ks.id
        WHERE ss.id IS NOT NULL OR ks.id IS NOT NULL
        ORDER BY rrf_score DESC
        LIMIT match_count;
    END;
    $$;
`;

async function runMigration() {
    console.log(`[MIGRATION] Connecting to the Neon database...`);
    try {
        await dbPool.query(initSchema);
        console.log('[MIGRATION] SUCCESS! Clean slate deployed with hybrid search and user isolation.');
    } catch (error) {
        console.error('[MIGRATION] Database architecture execution failed:', error);
    } finally {
        await dbPool.end();
        console.log('[MIGRATION] Connection wrapper safely closed.');
    }
}

runMigration();