import { ChatGroq } from "@langchain/groq";
import { SystemMessage, HumanMessage } from "@langchain/core/messages";
import { GraphState } from "../state.js";

const groq = new ChatGroq({
    model:"llama-3.1-8b-instant",
    temperature:0.3
})
/**
 * The Generation Node: Synthesizes retrieved data into a grounded answer.
 * @param state - The current short-term memory of the graph
 */

 export async function generateNode(state: typeof GraphState.State){
    console.log("[GENERATE] Drafting response based on retrieved context...")

    const lastMessage = state.messages[state.messages.length - 1]
    if (!lastMessage || typeof lastMessage.content !== "string") {
        throw new Error("[GENERATE ERROR] No user message found.")
    }

    const contextString = state.retrieve_docs
        .map(doc => `--- ${doc.title} ---\n${doc.content}`)
        .join("\n\n")

    console.log("\n=== WHAT THE LLM IS READING ===");
    console.log(contextString);
    console.log("===============================\n")    

    const systemPrompt = `You are a highly professional Enterprise Support Agent.
Your task is to answer the user's question using ONLY the retrieved context provided below.

<context>
${contextString || "No relevant documents were found in the database."}
</context>

RULES:
1. If the answer is not contained in the context, you MUST say "I do not have enough information to answer that."
2. Do not hallucinate or make up policies.
3. Keep your response clear, concise, and polite.`

const messages = [
        new SystemMessage(systemPrompt),
        new HumanMessage(lastMessage.content)
    ]

    const response = await groq.invoke(messages)

    console.log("[GENERATE] Draft complete.");

    return {
        messages: [response] 
    }



}