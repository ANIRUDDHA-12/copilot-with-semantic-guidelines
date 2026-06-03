import {type Request,type Response, type NextFunction} from 'express'

interface Bucket{
    tokens:number,
    lastRefill:number
}

const rateLimitCache = new Map<string,Bucket>()

const BUCKET_CAPACITY=5
const REFILL_RATE_MS=10000

export function bucketRateLimiter(req:Request,res:Response,next:NextFunction){
    const userId = req.user?.user_id || req.ip || "anonymous"

    const now = Date.now()

    if(!rateLimitCache.has(userId)){
        console.log(`[RATE LIMIT]  Creating NEW bucket for user: ${userId}`)
        rateLimitCache.set(userId,{tokens:BUCKET_CAPACITY,lastRefill:now})  
    }
    const userBucket = rateLimitCache.get(userId)!

    const timePassed = now - userBucket.lastRefill
    const tokensEarned = Math.floor(timePassed/REFILL_RATE_MS)

    console.log(`[RATE LIMIT]  User: ${userId} | Tokens Before: ${userBucket.tokens} | Earned Just Now: ${tokensEarned}`)

    if(tokensEarned>0){
        userBucket.tokens=Math.min(BUCKET_CAPACITY,userBucket.tokens+tokensEarned)
       userBucket.lastRefill+=tokensEarned*REFILL_RATE_MS
    }

    if(userBucket.tokens>0){
        userBucket.tokens-=1
        console.log(`[RATE LIMIT]  Passing request to LangGraph. Tokens left: ${userBucket.tokens}`)
        return next()
    }
    else{
        console.log(`[RATE LIMIT]  BLOCKING REQUEST! Bucket empty.`)
        return res.status(429).json({error:"Too many Request Please Wait"})
    }

}

