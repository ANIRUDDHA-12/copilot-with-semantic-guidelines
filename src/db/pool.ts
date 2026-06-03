import dotenv from 'dotenv'
import pg from 'pg'

dotenv.config()

const {Pool} = pg

export const dbPool = new Pool({
    // user:process.env.DB_USER,
    // password:process.env.DB_PASSWORD,
    // host:process.env.DB_HOST,
    // port:process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 5432,
    // database:process.env.DB_NAME,
    // max:20,
    // idleTimeoutMillis: 30000,
    connectionString: process.env.DATABASE_URL,
    ssl:{
        rejectUnauthorized:false
    }
})

export async function insertKnowledgeChunk(
    documentName:string,
    text:string,
    embedding:number[]
):Promise<void>
{
    const query = `
    Insert Into knowledge_chunks (document_name,chunk_text,embedding)
    VALUES($1,$2,$3)
    `
    const values = [documentName, text, JSON.stringify(embedding)]

        try {
        await dbPool.query(query, values);
        console.log(`[DB] Successfully inserted chunk from ${documentName}`);
    } catch (error) {
        console.error('[DB] Database insertion failed:', error);
        throw error;
    }
}

