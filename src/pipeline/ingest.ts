import {pipeline} from "@xenova/transformers"
import { chunkMarkdownByHeaders } from "./chunker.js"
import { insertKnowledgeChunk } from "../db/pool.js"

async function runIngestion(){
    console.log("1.Shredding the document")
    const chunks = await chunkMarkdownByHeaders('./test.md')

    console.log(`[INGEST] Found ${chunks.length} chunks. Loading AI model (this takes a few seconds on first run)...`)
    const generateEmbedding = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2')

    for (const chunk of chunks) {
        console.log(`Procesing output`)

        const output = await generateEmbedding(chunk.content, { pooling: 'mean', normalize: true })

        const embeddingArray = Array.from(output.data)

        await insertKnowledgeChunk(chunk.title,chunk.content,embeddingArray)
    }

    console.log("ingestion is complete,data should be live on postgress")
    process.exit(0)
}
runIngestion().catch(console.error)