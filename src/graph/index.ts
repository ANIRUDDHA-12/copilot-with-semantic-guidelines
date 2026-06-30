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
      "You are an expert document retrieval assistant with access to a 'search' tool. " +
    "CRITICAL SEARCH RULE: When using the search tool, do not search using full sentences or conversational questions. " +
    "Instead, extract only the core technical keywords, acronyms, or specific phrases from the user's request and search using those terms. " +
    "CORE RULES: " +
    "1. Read tool results carefully and ignore OCR noise (e.g., '72F4X237'). " +
    "2. If the answer is found in the retrieved text, provide a short, direct answer. " +
    "3. If the retrieved text does not contain the answer, reply exactly: 'I cannot find the answer in the uploaded documents.'"
    )
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
