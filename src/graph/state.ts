import { Annotation } from "@langchain/langgraph"
import { BaseMessage } from "@langchain/core/messages"

export interface IGraphState {
    messages: BaseMessage[]
    category: string
    standalone_query: string
    api_retries: number
    retrieved_docs:{
        title:string,
        content:string
    }[];
};

// 2. The Annotation Root (The LangGraph Engine)
// This tells LangGraph HOW to update the memory when a node passes new data.
export const GraphState = Annotation.Root({
    
    // Reducer: (x, y) => x.concat(y) means we APPEND new messages to the history
    messages: Annotation<BaseMessage[]>({
        reducer: (x, y) => x.concat(y),
        default: () => [],
    }),
    
    // Reducer: (x, y) => y means we OVERWRITE the old category with the new one
    category: Annotation<string>({
        reducer: (x, y) => y,
        default: () => "General_Support"
    }),
    
    standalone_query: Annotation<string>({
        reducer: (x, y) => y,
        default: () => ""
    }),
    
    api_retries: Annotation<number>({
        reducer: (x, y) => y,
        default: () => 0
    }),

    retrieve_docs:Annotation<{title:string,content:string}[]>({
        reducer:(x,y)=>y,
        default : ()=>[]

    })
});