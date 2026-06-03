import dotenv from 'dotenv';
dotenv.config({ override: true })
import express from 'express';
import cors from 'cors';
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { dbPool } from './db/pool.js';


import { chatRouter } from './middleware/routes/chat.js';
import { uploadRouter } from './middleware/routes/upload.js';
import { authRouter } from './middleware/routes/auth.js';
// import { configDotenv } from 'dotenv';




const app = express();
const PORT = process.env.PORT || 3000


app.post('/api/register',async(req,res)=>{
    try{
        const{email,password} = req.body

        if(!email || !password){
            return res.json({error:"Missing email or password"})
        }

        const hashedPassword = await bcrypt.hash(password,10)

        const sql = `
            INSERT INTO users (email, password_hash) 
            VALUES ($1, $2) 
            RETURNING id, email, created_at;
        `
        const result = await dbPool.query(sql, [email, hashedPassword])

        return res.status(201).json({
            message: "User registered successfully", 
            user: result.rows[0]
        })
    }catch(error:any){
        if(error.code == '23505'){
            return res.status(409).json({error:"Email already registered"})
        }
        console.error(`[Register Error]`,error)
        return res.status(500).json({
            error:"Internal Server Error"
        })
    }
})

app.post('/api/login',async(req,res)=>{
    try{

    
    const {email,password}=req.body

    if (!email || !password) {
            return res.status(400).json({ error: "Missing email or password" });
        }

        const userResult = await dbPool.query(`SELECT * FROM users WHERE email = $1`,[email])

        if(userResult.rows.length===0){
            return res.status(401).json({error:"Invalid Password or Email"})          
        }

        const user = userResult.rows[0]

        const isMatch = await bcrypt.compare(password, user.password_hash)

        if(!isMatch){
            return res.status(401).json({error:"Invalid Email or Password"})
        }
        if(!process.env.JWT_SECRET){
            throw new Error("JWT_SECRET is missing from environment variables")
        }

        const token = jwt.sign(
            {user_id:user.id,email:user.email},
            process.env.JWT_SECRET,
            {expiresIn:'24h'}
        )

        return res.json({
            message:"Login Sucessfull",
            token:token
        })
    }
    catch(error:any){
        console.error("[LOGIN ERROR]", error);
        return res.status(500).json({ error: "Internal Server Error" })
    }

        
})

app.use(cors())
app.use(express.json())

app.use('/api/chat',chatRouter)
app.use('/api/upload',uploadRouter)

app.use('/api/auth',authRouter)


app.listen(3000, () => console.log(`🚀 Server running on port ${PORT}`));