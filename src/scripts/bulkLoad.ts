import dotenv from 'dotenv'
import { pipeline } from "@xenova/transformers";
import { dbPool } from "../db/pool.js";

dotenv.config({override:true})

const externalDataset = [
    {
        title: "Advanced Encryption Standard",
        content: "AES is a symmetric encryption algorithm widely used across the globe to secure data. It operates on blocks of 128 bits and uses key sizes of 128, 192, or 256 bits. It is fundamentally different from asymmetric algorithms like RSA.",
        metadata: { subject: "Cryptography", type: "Concept" }
    },
    {
        title: "A* Search Algorithm",
        content: "A* is a graph traversal and path search algorithm. It is heavily used in computer science due to its completeness, optimality, and optimal efficiency. It uses a heuristic to guide its search, making it faster than standard Dijkstra's algorithm.",
        metadata: { subject: "Artificial Intelligence", type: "Algorithm" }
    },
    {
        title: "SME IPO Regulations",
        content: "Small and Medium Enterprises (SMEs) can list on dedicated stock exchanges. Recent regulatory frameworks require a minimum post-issue paid-up capital and strict fundamental accounting practices to ensure market stability.",
        metadata: { subject: "Financial Markets", type: "Policy" }
    }
]

async function bulkLoad(){
    console.log(`Starting the server Pipeline`)

    const embedder = await pipeline('feature-extraction','Xenova/all-MiniLM-L6-v2')

    for(let i =0;i<externalDataset.length;i++){
        const item = externalDataset[i]!
        console.log(`Processing [${i + 1}/${externalDataset.length}]: ${item.title}`)

        try{
            const docResult = await dbPool.query(
                `INSERT INTO documents (filename, metadata) 
                 VALUES ($1, $2) RETURNING id`,
                [item.title, item.metadata]
            )
            const documentId = docResult.rows[0].id

            const output = await embedder(item.content, { pooling: 'mean', normalize: true });
            const vectorString = `[${Array.from(output.data).join(",")}]`

            await dbPool.query(
                `INSERT INTO knowledge_base (document_id, chunk_index, title, content, embedding) 
                 VALUES ($1, $2, $3, $4, $5::vector)`,
                [documentId, 1, item.title, item.content, vectorString]
            )

            console.log(`Loading sucessfull ${item?.title}`)
        }catch(error){
            console.log(`Failed to load`,error)
        }
    }
    console.log(`Bulk load complete`)
        process.exit(0)
}
bulkLoad()