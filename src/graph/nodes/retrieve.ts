import { pipeline, Pipeline } from "@xenova/transformers";
import { dbPool } from "../../db/pool.js";
import { type IGraphState } from "../state.js";

/**
 * @param state - The current short-term memory of the graph
 */

export async function retrieveNode(state:IGraphState):Promise<Partial<IGraphState>>{
    const currentQuery = state.standalone_query || "sample query"

    if(!currentQuery || typeof currentQuery !== 'string'){
        throw new Error("No valid query found in the text")
    }

    const generateEmbedding = await pipeline('feature-extraction','Xenova/all-MiniLM-L6-v2')

    const output = await generateEmbedding(currentQuery,{pooling:'mean',normalize:true})

    const response = Array.from(output.data)

    const sql = `
        SELECT document_name,chunk_text
        from knowledge_chunks
        order by embedding <=> $1
        limit 3
    `

    const values = [JSON.stringify(response)]
    const result = await dbPool.query(sql,values)

    const FormattedDocs = result.rows.map((row)=>({
        title: row.document_name,
        content: row.chunk_text
    }))

    // 3. Return the state update object
    console.log(`[RETRIEVE] Successfully fetched ${FormattedDocs.length} relevant context chunks.`)
    return {
        retrieved_docs:FormattedDocs
    }

}