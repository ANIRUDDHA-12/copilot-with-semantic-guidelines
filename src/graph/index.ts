import { StateGraph } from "@langchain/langgraph";
import { GraphState,  } from "./state.js";
import { routerNode } from "./nodes/router.js";
import { retrieveNode } from "./nodes/retrieve.js";
import {generateNode} from "./nodes/generate.js"


function routeAfterCategorization(state: typeof GraphState.State): "retrieve" | "__end__" {
    console.log(`[CIRCUIT BOARD] Evaluating routing for category: ${state.category}`);
    if (state.category === "Tech_Support" || state.category === "Billing") {
        return "retrieve";
    }
    return "__end__"
}


 const workflow = new StateGraph(GraphState)
    .addNode("router", routerNode)
    .addNode("retrieve", retrieveNode)
    .addNode("generate", generateNode)
    .addEdge("__start__", "router")
    .addConditionalEdges("router", routeAfterCategorization)
    .addEdge("retrieve", "generate")
    .addEdge("generate","__end__")

  export  const graph = workflow.compile()

