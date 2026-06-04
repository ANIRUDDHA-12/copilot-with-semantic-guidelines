import {Queue,Worker} from 'bullmq'
import {Redis} from 'ioredis'
import { dbPool } from '../db/pool.js'
import pdf from '@cedrugs/pdf-parse'
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters'
import {pipeline} from '@xenova/transformers'
import fs from 'fs/promises'



 let embedder: any = null;
async function getEmbedder() {
    if (!embedder) {
        embedder = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
    }
    return embedder;
}

const redisConnection = new Redis(process.env.REDIS_URL!,{
    maxRetriesPerRequest:null
})

export const pdfQueue = new Queue('pdf-processing-queue',{
    connection:redisConnection as any
})

 const pdfWorker = new Worker('pdf-processing-queue',async(job)=>{
        const {filePath,originalName,userId}= job.data
        console.log(`\n[WORKER] Picked up new document: ${originalName}`)

        try{
            const fileBuffer = await fs.readFile(filePath)

            const result = await pdf(fileBuffer)
            const rawText = result.text.replace(/\x00/g, '').trim()

            const pdfInfo = result.info || {};
        const documentTitle = pdfInfo.Title || originalName

            // const documentTitle = result.info?.Title || originalName

            const documentMetadata = {
            title: documentTitle,
            author: pdfInfo.Author || 'Unknown',
            creator: pdfInfo.Creator || 'Unknown',
            pageCount: result.numpages || 0, // pdf-parse gives us the total pages!
            source: "API Upload"
        }

            if (!rawText || rawText.length === 0) {
            throw new Error("Extraction Failed: Image or scanned document without readable text.");
        }

        const splitter = new RecursiveCharacterTextSplitter({chunkSize:1000,chunkOverlap:200})
        const chunks = await splitter.splitText(rawText)
        console.log(`[WORKER] Text split into ${chunks.length} distinct chunks.`)

        const generateEmbedding = await getEmbedder()
        console.log(`[WORKER] Attempting to save document to Neon...`)
        const safeUserId = userId || null


        const docResult = await dbPool.query(
            `
            INSERT INTO documents (user_id, filename,metadata) VALUES ($1, $2, $3) RETURNING *
            `,
            [safeUserId,originalName,documentMetadata]
        )
        console.log(`[DEBUG] Raw Database Row:`, docResult.rows[0])
        const documentId = docResult.rows[0]?.id || docResult.rows[0]?.documentId || docResult.rows[0]?.uuid

        if (!documentId) {
            console.error("[CRITICAL FATAL] The database returned this:", docResult.rows);
            throw new Error("Database failed to return a valid document ID.")
        }

        // 5. Generate Vectors and Insert (The Advanced Batching Loop)
        const BATCH_SIZE = 10; // Process 10 chunks at a time
        const totalBatches = Math.ceil(chunks.length / BATCH_SIZE);

        for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
            // Slice out 10 chunks for this batch
            const batch = chunks.slice(i, i + BATCH_SIZE);
            const currentBatchNum = Math.floor(i / BATCH_SIZE) + 1;
            
            console.log(`[WORKER] Processing batch ${currentBatchNum} of ${totalBatches}...`);

            // Process the batch concurrently for speed
            await Promise.all(batch.map(async (chunkText, index) => {
                const globalChunkIndex = i + index;
                
                // 1. Generate the Xenova embedding
                const output = await generateEmbedding(chunkText, { pooling: "mean", normalize: true });
                const vectorString = `[${Array.from(output.data).join(',')}]`;

                // 2. Save to Neon Database
                await dbPool.query(
                    'INSERT INTO knowledge_base (document_id, chunk_index,title, content, embedding) VALUES ($1, $2, $3, $4,$5)',
                    [documentId, globalChunkIndex,documentTitle, chunkText, vectorString]
                );
            }));

            // CRITICAL STEP: Let the Node.js event loop breathe!
            // This 100ms delay prevents CPU locking and allows BullMQ to check the worker status.
            await new Promise(resolve => setTimeout(resolve, 100));

            // OPTIONAL BUT AWESOME: Update the job progress
            // (Later, your React UI can read this to show a live progress bar!)
            const progress = Math.round(((i + batch.length) / chunks.length) * 100);
            await job.updateProgress(progress);
        }

        console.log(`[WORKER]  Complete! Saved all ${chunks.length} vectors to database.`);
            await fs.unlink(filePath).catch((err) => {
    // If the error is simply "File already gone" (ENOENT), ignore it!
    if (err.code !== 'ENOENT') {
        console.error(`[WORKER] Minor cleanup warning: Could not delete temp file:`, err.message);
    }
})
        }catch(error){
            console.log(`Error executing process by worker`,error)
           await fs.unlink(filePath).catch((err) => {
    // If the error is simply "File already gone" (ENOENT), ignore it!
    if (err.code !== 'ENOENT') {
        console.error(`[WORKER] Minor cleanup warning: Could not delete temp file:`, err.message);
    }
}) 
            throw error
        }

 },{connection:redisConnection as any})

 pdfWorker.on('failed',(job,err)=>{
    console.log(`Job Failed With  ${job?.id} and Error ${err.message}`)
 })