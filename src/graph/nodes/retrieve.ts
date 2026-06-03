import { pipeline } from "@xenova/transformers";
import { dbPool } from "../../db/pool.js";
import { GraphState } from "../state.js"; 


// Fix 1: Create a global variable to hold the AI model in memory
let embedderPipeline: any = null;

/**
 * @param state - The current short-term memory of the graph
 */
export async function retrieveNode(state: typeof GraphState.State) { 
    console.log("[RETRIEVE] Commencing Hybrid Search query execution...")

    // We grab the last message the user sent
    // const currentQuery = state.messages[state.messages.length - 1]?.content || "sample query";
    const lastMessage = state.messages[state.messages.length-1]

    if (!lastMessage) {
        throw new Error("No valid query found in the text");
    }
    const queryText = typeof lastMessage === 'string'?lastMessage:lastMessage.content
console.log(`[DEBUG RETRIEVE DRIVER] The actual string being searched is: "${queryText}"`);

    if(!queryText || typeof queryText!=='string'){
        throw new Error(`No valid query found in it`)
    }

    try{

        if (!embedderPipeline) {
            console.log("[RETRIEVE] Initializing local embedding model...");
            embedderPipeline = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
        }
        console.log("[RETRIEVE] Generating embedding vector...")
        const output = await embedderPipeline(queryText, { pooling: 'mean', normalize: true });
        const queryEmbedding = Array.from(output.data);
        const vectorString = `[${queryEmbedding.join(",")}]`

        const dbResult = await dbPool.query(
            "SELECT id, title, content, score FROM match_documents_hybrid($1, $2, $3)",
            [queryText, vectorString, 5])

            const rawRows = dbResult.rows
            console.log(`[RETRIEVE] Database returned ${rawRows.length} high-relevance matches via RRF.`)

            const formattedDocs = rawRows.map((row: any) => {
            return {
                title: row.title,
                content: row.content
            };
        });

        return {
            retrieve_docs: formattedDocs
        }

    }catch(error){
        console.error("[RETRIEVE NODE CRITICAL ERROR]:", error)
        throw error;
    }   
}

