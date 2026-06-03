import multer from 'multer'
import express from 'express'
import fs from 'fs/promises'
import os from 'os'
import { pdfQueue } from '../../workers/pdfWorker.js'
// import pdf from '@cedrugs/pdf-parse'
// import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters'
// import {pipeline} from '@xenova/transformers'
import { authenticateToken } from '../auth.js'
import path from 'path'
// import { dbPool } from '../../db/pool.js'
// import { pdfQueue } from '../../workers/pdfWorker.js'


const uploadRouter = express.Router()
const upload = multer({
    storage:multer.memoryStorage()
})

// let embedder: any = null;
// async function getEmbedder() {
//     if (!embedder) {
//         embedder = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
//     }
//     return embedder;
// }

uploadRouter.post('/pdf',authenticateToken,upload.single('document'),async(req,res)=>{
    try{
        const file = req.file
        const userId=req.user?.user_id

        if(!file){
            return res.status(400).json({ error: "No file uploaded." })
        }

        console.log(`File Recieved ,${file.originalname},${file.size} bytes`)

        const tempFilePath = path.join(os.tmpdir(),`${Date.now()}-${file.size}bytes`)
        await fs.writeFile(tempFilePath,file.buffer)

        const job = await pdfQueue.add('pdf-processing-queue',{
            filePath:tempFilePath,
            originalName:file.originalname,
            userId:userId
        })  

        return res.status(202).json({
            message:"PDF Uploaded Sucessfully,Worker working in Background",
            jobId:job.id
        })

        // const result = await pdf(file.buffer)
        // const rawText = result.text.replace(/\x00/g, '').trim()
        // const rawText= result.text

    }catch(error){
        console.log(`[API] ERROR`,error)
        return res.status(500).json({error:"Failed to Queue the Pdf"})
    }
})

uploadRouter.get('/status/:jobId', authenticateToken, async (req, res) => {
    try {
        const { jobId }  = req.params;

        if(!jobId || typeof jobId !== 'string'){
            return res.status(400).json({ error: "Invalid or missing Job ID." })
        }

        // 1. Ask Redis to find the exact job ticket
        const job = await pdfQueue.getJob(jobId);

        if (!job) {
            return res.status(404).json({ error: "Job not found in queue." });
        }

        // 2. Extract the current status of the job
        const state = await job.getState(); // e.g., 'waiting', 'active', 'completed', 'failed'
        const progress = job.progress;      // The percentage we set in the worker!
        const failedReason = job.failedReason; // If it crashed, tell the UI why

        // 3. Send the status back to the frontend
        return res.status(200).json({
            jobId: job.id,
            state: state,
            progress: progress,
            error: failedReason || null
        });

    } catch (error) {
        console.error(`[API] Error fetching job status:`, error);
        return res.status(500).json({ error: "Failed to fetch job status." });
    }
})
export default uploadRouter


