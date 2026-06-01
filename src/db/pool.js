import dotenv from 'dotenv';
import pg from 'pg';
dotenv.config();
const { Pool } = pg;
export const dbPool = new Pool({
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    host: process.env.DB_PASSWORD,
    port: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 5432,
    database: process.env.DB_NAME,
    max: 20,
    idleTimeoutMillis: 30000,
});
export async function inserKnowledgeChunk(documentName, text, embedding) {
    const query = `
    Insert Into kknowledge_chunks (document_name,text,embedding)
    VALUES($1,$2,$3)
    `;
    const values = [documentName, text, JSON.stringify(embedding)];
    try {
        await dbPool.query(query, values);
        console.log(`[DB] Successfully inserted chunk from ${documentName}`);
    }
    catch (error) {
        console.error('[DB] Database insertion failed:', error);
        throw error;
    }
}
