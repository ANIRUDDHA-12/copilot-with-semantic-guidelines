import 'dotenv/config';
import express from 'express';
import { HumanMessage } from '@langchain/core/messages';
import { dbPool } from '../../db/pool.js';
import { graph } from '../../graph/index.js';
import { authenticateToken } from '../auth.js';
import { bucketRateLimiter } from '../rateLimiter.js';
import { pipeline } from "@xenova/transformers"

export const chatRouter = express.Router()

let embedderPipeline: any = null

chatRouter.post('/',authenticateToken,bucketRateLimiter,async(req,res)=>{
     try {
            const userId = req.user?.user_id
                console.log(`[AUTH] Request authorized for User ID: ${userId}`)
    
    
            const userMessage = req.body.message;
            if (!userMessage) {
                return res.status(400).json({ error: "Missing message" });
            }
    
            if(!embedderPipeline){
                console.log("Initializing extraction pipeline")
                embedderPipeline = await pipeline('feature-extraction','Xenova/all-MiniLM-L6-v2')
            }
    
            console.log("Generating vector for semantic chunk")
            const output = await embedderPipeline(userMessage,{pooling:'mean',normalize:'true'})
            const vectorString = `[${Array.from(output.data).join(',')}]`
    
            const cacheResult = await dbPool.query(
                `SELECT ai_response FROM semantic_cache 
                 WHERE prompt_embedding <=> $1::vector < 0.05 
                 ORDER BY prompt_embedding <=> $1::vector ASC LIMIT 1;`,
                [vectorString]
            )
    
            if(cacheResult.rows.length>0){
                console.log(`Cached Response Found ,Bypassing Langgraph`)
                res.setHeader('Content-Type','text/stream')
                res.setHeader('Cache-Control','no-cache')
                res.setHeader('Connection','keep-alive')
    
                res.write(`data:${JSON.stringify({token:cacheResult.rows[0].ai_response})}\n\n`)
                res.write(`data:[DONE]\n\n`)
                return res.end()
            }
    
            console.log(`No available Cached Data,Routing to Langgraph`)
    
            const initialState = { 
                messages: [new HumanMessage(userMessage)],
                user_id:userId
            }
    
            const eventStream = graph.streamEvents(initialState,{version:"v2"})
            let streamInitialized = false
            let isGeneratingAnswer = false
            let fullAiResponse = ""
    
            for await(const event of eventStream){
                console.log(`[DEBUG] Event: ${event.event} | Name: ${event.name} | Node: ${event.metadata?.langgraph_node}`)
                if(event.event === "on_node_end" && event.name === 'guardrail'){
                    const output=event.data.output
    
                    if(output && output.safety_error){
                        return res.status(400).json({error:output.safety_error})
                    }
                }
    
                if(!streamInitialized){
                    res.setHeader('Content-Type','text/event-stream')
                    res.setHeader('Cache-Control','no-cache')
                    res.setHeader('Connection','keep-alive')
                    streamInitialized=true
                }
                if(event.event === "on_chat_model_stream" && event.metadata?.langgraph_node === "agent"){
                    isGeneratingAnswer = true
                }
    
                if (event.event === "on_chat_model_stream" && isGeneratingAnswer) {
                    const text = event.data.chunk?.content;
                    if (text) {
                        fullAiResponse+=text
                        res.write(`data: ${JSON.stringify({ token: text })}\n\n`);
                    }
                }
            }
            res.write("data:[DONE]\n\n")
           
    
            if(fullAiResponse.length>0){
                await dbPool.query(
                    `INSERT INTO semantic_cache (user_prompt, prompt_embedding, ai_response) 
                     VALUES ($1, $2, $3)`,
                    [userMessage, vectorString, fullAiResponse]
                )
                console.log(`New Response Saved To Cache`)
            }
        res.end()
        } catch (error) {
            console.error("Streaming Error",error);
            if(!res.headersSent){
                  return res.status(500).json({ error: "Internal Server Error" });
            }
            res.end()
        }
})


