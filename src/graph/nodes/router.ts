import {z} from 'zod'
import {  GraphState } from '../state.js'
import { ChatGroq } from '@langchain/groq'


/**
 * @param state - The current short-term memory of the graph
 */

const groq = new ChatGroq({
    model:"llama-3.3-70b-versatile",
    temperature:0
})

export async function routerNode(state:  typeof GraphState.State){
    const runTimeCategories = ["Tech_Support","Billing","General"] as const

    const routingSchema = z.object({
        category:z.enum(runTimeCategories).describe("Categorize the user's request into one of these exact types.")})
    
    const structuredLLM = groq.withStructuredOutput(routingSchema)

    const lastMessage = state.messages[state.messages.length-1]

     if(!lastMessage){
        throw new Error("[ROUTER ERROR] Cannot route because the message history is empty.")
    }

    const answer = await structuredLLM.invoke([lastMessage])

    return{
        category:answer.category
    }
}

