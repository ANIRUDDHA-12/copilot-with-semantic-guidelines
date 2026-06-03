import {TavilySearch} from '@langchain/tavily'


export const webSearchTool = new TavilySearch({
    maxResults: 2,
    description: "Use this tool to search the live internet for current events, news, live prices, or any information you cannot find in the internal database."
});