import { GraphState } from "../state.js";
import { AIMessage, ToolMessage } from "@langchain/core/messages";

export async function manageMemoryNode(state: typeof GraphState.State) {
    console.log(`[Memory Manager] Analyzing history, current message count: ${state.messages.length}`);
    const maxMessages = 6;

    if (state.messages.length <= maxMessages) {
        return {}; 
    }

    console.log(`[Memory Manager] Memory Limit exceeded, pruning older history safely...`);

    let prunedMessages = state.messages.slice(-maxMessages);

    
    while (prunedMessages.length > 0) {
        const firstMessage = prunedMessages[0];
        
        // Beautiful, type-safe check without any underscores!
        if (firstMessage && ToolMessage.isInstance(firstMessage)) {
            console.log("[Memory Manager]  Orphaned tool message detected. Dropping to maintain chain integrity.");
            prunedMessages.shift(); 
        } else {
            break; 
        }
    }

    if (prunedMessages.length > 0) {
        const currentFirstMessage = prunedMessages[0];
        
        // Using isAIMessage gives us type-safe access to .tool_calls without needing "as any"
        if (
            currentFirstMessage && 
            AIMessage.isInstance(currentFirstMessage) && 
            currentFirstMessage.tool_calls && 
            currentFirstMessage.tool_calls.length > 0
        ) {
            console.log("[Memory Manager]  Orphaned AI tool call detected. Dropping to maintain chain integrity.");
            prunedMessages.shift();
        }
    }

    return {
        messages: {
            _isOverride: true,
            messages: prunedMessages
        } as any 
    };
}