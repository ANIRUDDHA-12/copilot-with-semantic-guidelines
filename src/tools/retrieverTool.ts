import { tool } from "@langchain/core/tools";
import {z} from 'zod'
import { pipeline } from "@xenova/transformers"
import { dbPool } from "../db/pool.js";
import { SystemMessage } from "@langchain/core/messages"

let embedderPipeline:any=null

export const postgresRetrieverTool = tool(
    async({query})=>{
        console.log(`[TOOL]  AI chose to search the database for: "${query}"`)

        if(!embedderPipeline){
            embedderPipeline = await pipeline('feature-extraction','Xenova/all-MiniLM-L6-v2')
        }

     try{

        

        const output = await embedderPipeline(query, { pooling: 'mean', normalize: true })
            const vectorString = `[${Array.from(output.data).join(",")}]`

            const dbResult = await dbPool.query(
                `SELECT kb.content, d.filename
                 FROM knowledge_base kb
                 JOIN documents d ON kb.document_id = d.id
                 ORDER BY kb.embedding <=> $1::text::vector(384) ASC
                 LIMIT 2`,
                [vectorString]
            )

            if (dbResult.rows.length === 0) {
                return "No relevant documents found in the database."
            }

            const formattedDocs = dbResult.rows
            .map((row,index)=>`Source: ${row.filename}\nContent:\n${row.content}\n---`)
            .join(`\n\n`)

            console.log(`[TOOL]  Found ${dbResult.rows.length} relevant PDF chunks.`)
            return formattedDocs

        } catch (error) {
            console.error(error);
            return "An error occurred while searching the database.";
        }
    },
    {
        name: "search_internal_documents",
        description: "Always use this tool first when a user asks about internal company policies, uploaded PDFs, or specific rules.",
        schema: z.object({
            query: z.string().describe("The specific search phrase to look up in the vector database.")
        })
    }
);