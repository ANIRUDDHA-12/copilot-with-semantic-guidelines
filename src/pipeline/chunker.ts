import {promises as fs} from 'fs'

export interface SemanticChunk{
    title:string,
    content:string
}
/** 
    ** @params filePath
    * @return

 */

export async function chunkMarkdownByHeaders(filePath:string):Promise<SemanticChunk[]>{
        const rawText = await fs.readFile(filePath,'utf-8')

        const rawBlocks = rawText.split(/^##\s+/m)

        const processedChunks :SemanticChunk[]=[]

        for(let i =0 ;i<rawBlocks.length;i++){
            const block = rawBlocks[i]?.trim()

            if(!block) continue

            if(i==0 && !rawText.trimStart().startsWith('##')){
                processedChunks.push({
                    title:'Document Preamble',
                    content:block
                })
                continue
            }
            const lines = block.split('\n')
            const title = lines[0]?.trim() || "Undefined Section"

            const content = lines.slice(1).join('\n').trim()

            processedChunks.push({
            title: title,
            content: content
        })
        }
        return processedChunks
}   

// chunkMarkdownByHeaders('./test.md').then(console.log).catch(console.error);
