import {  type Request,  type Response,  type NextFunction } from 'express'
import jwt from 'jsonwebtoken'

export interface tokenPayload{
    user_id:string,
    email:string
}

declare global{
    namespace Express{
        interface Request{
            user?:tokenPayload
        }
    }
}

export const authenticateToken = (req:Request,res:Response,next:NextFunction):void | any =>{
    const authHeader = req.headers['authorization']
    const token = authHeader && authHeader.split(' ')[1]

    if(!token){
        return res.status(401).json({error:"Acess denied.No token provided"})
    }

    if(!process.env.JWT_SECRET){
        return res.status(403).json({error:"Token not Generated"})
    }

    jwt.verify(token,process.env.JWT_SECRET,(err,decoded)=>{
        if(err){
            return res.status(403).json({error:"Invalid or expired token"})
        }

        req.user = decoded as tokenPayload
        next()
    })
}



