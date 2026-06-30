import { StateGraph } from "@langchain/langgraph";
import { END,START } from "@langchain/langgraph";
import { ToolNode } from "@langchain/langgraph/prebuilt";
import { ChatGroq } from "@langchain/groq";
import { postgresRetrieverTool } from "../tools/retrieverTool.js";
import { GraphState } from "./state.js";
import { SystemMessage } from "@langchain/core/messages";
import { webSearchTool } from "../tools/webSearchTools.js";

const tools =[postgresRetrieverTool,webSearchTool] as any[]

const llm = new ChatGroq({
    model:"llama-3.3-70b-versatile",
    temperature:0
}) 

// const llmWithTools= llm.bindTools(tools,{
//     parallel_tool_calls:false
// })

const toolNode = new ToolNode(tools)

async function callModel(state: typeof GraphState.State) {
    console.log("[GRAPH]  Groq Agent is thinking...")

    const systemPrompt = new SystemMessage(
    "You are an expert assistant with access to an internal 'search' tool and a web search tool. " +
    "CRITICAL RULES: " +
    "1. ALWAYS use the 'search' tool first if the user asks about specific projects, companies, proper nouns, or acronyms (e.g., 'Aegis AI', 'CoolCity AI', etc.). " +
    "2. If the user asks about internal company policies, uploaded PDFs, or specific rules, use the 'search' tool. " +
    "3. When using the internal search tool, extract ONLY the core technical keywords (e.g., search for 'CoolCity AI', not 'What is CoolCity AI'). " +
    "4. If the user asks about real-time events outside the documents, use the web search tool. " +
    "5. ABSOLUTE FORMATTING RULE: You must use the provided JSON tool calling API. NEVER output raw XML tags like <function>."
);
    const messagesWithSystem = [systemPrompt, ...state.messages]
    
    // Pass the message history straight to the model
    const response = await llm.invoke(messagesWithSystem);
    
    // Return the updated state
    return { messages: [response] };
}

// 6. Conditional Edge: The Router Logic
function shouldContinue(state: typeof GraphState.State) {
    const messages = state.messages;
    const lastMessage = messages[messages.length - 1];

    // Check if Groq appended a 'tool_calls' array to its message payload
    if (lastMessage && (lastMessage as any).tool_calls && (lastMessage as any).tool_calls.length > 0) {
        const toolName = (lastMessage as any).tool_calls[0].name;
        console.log(`[GRAPH]  Groq requested tool execution: "${toolName}"`);
        return "tools";
    }
    
    // No tool calls requested? The answer is complete!
    console.log("[GRAPH]  Response finalized. Routing to END.");
    return END;
}

// 7. Wire up the Agentic Circuit
const workflow = new StateGraph(GraphState)
    .addNode("agent", callModel)
    .addNode("tools", toolNode)
    
    .addEdge(START, "agent")
    .addConditionalEdges("agent", shouldContinue) // Split path here
    .addEdge("tools", "agent"); // Always loop back to the brain after running a tool

export const graph = workflow.compile();
