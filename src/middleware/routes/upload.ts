import express, { Router } from 'express'
import multer from 'multer'
import pdf from '@cedrugs/pdf-parse'
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters'
import {pipeline} from '@xenova/transformers'
import { authenticateToken } from '../auth.js'
import { dbPool } from '../../db/pool.js'
import { normalize } from 'node:path'
export const uploadRouter = express.Router()

const upload = multer({
    storage:multer.memoryStorage(),
    limits:{fileSize:10*1024*1024}
})

let embedder: any = null;
async function getEmbedder() {
    if (!embedder) {
        embedder = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
    }
    return embedder;
}

uploadRouter.post('/pdf',authenticateToken,upload.single('document'),async(req,res)=>{
    try{
        const file = req.file
        const userId=req.user?.user_id

        if(!file){
            return res.status(400).json({ error: "No file uploaded." })
        }

        console.log(`File Recieved ,${file.originalname},${file.size} bytes`)

        const result = await pdf(file.buffer)
        const rawText = result.text.replace(/\x00/g, '').trim()
        // const rawText= result.text

        if(!rawText || rawText.length ===0){
            return res.status(400).json({ 
                error: "Extraction Failed: This PDF appears to be an image or a scanned document without a readable text layer." 
            })
        }

        const splitter = new RecursiveCharacterTextSplitter({
            chunkSize:1000,
            chunkOverlap:200
        })

        const chunks = await splitter.splitText(rawText)

        console.log(`[ETL] Success! Text split into ${chunks.length} distinct chunks.`)
        const generateEmbedding = await getEmbedder()

        const docResult = await dbPool.query(
            'INSERT INTO documents (user_id, filename) VALUES ($1, $2) RETURNING id',
            [userId, file.originalname]
        )
        const documentId = docResult.rows[0].id

        for(let i =0;i<chunks.length;i++){
            const chunkText =chunks[i]

            const output =await generateEmbedding(chunkText,{pooling:"mean",normalize:true})
            const vectorArray = Array.from(output.data)

            const vectorString= `[${vectorArray.join(',')}]`

            await dbPool.query(
                'INSERT INTO knowledge_base (document_id, chunk_index, content, embedding) VALUES ($1, $2, $3, $4)',
                [documentId, i, chunkText, vectorString]
            )

        }
        console.log(`[ETL] Complete! Saved ${chunks.length} vectors to database.`)

        return res.status(200).json({
           message: "PDF parsed and chunked successfully!",
           documentId,
           totalChunks:chunks.length
        })
    }catch(error){
        console.log(`[ETL] ERROR`,error)
        return res.status(500).json({error:"Failed to Parse the PDF"})
    }
})


