import dotenv from 'dotenv';
dotenv.config({ override: true })
import express from 'express';
import cors from 'cors';



import { chatRouter } from './middleware/routes/chat.js';
import uploadRouter from './middleware/routes/upload.js'
import { authRouter } from './middleware/routes/auth.js';
import  { documentRouter } from './middleware/routes/documents.js';
// import { configDotenv } from 'dotenv';



const app = express();

const formattedFrontendUrl = process.env.FRONTEND_URL
    ? process.env.FRONTEND_URL.replace(/\/$/, '')
    : ''
app.use(cors({
    origin: [
        'http://localhost:5000', 
        'http://localhost:3001',
        formattedFrontendUrl
    ],
    credentials: true,
}));

process.on('unhandledRejection', (reason, promise) => {
    console.error('🚨 [CRITICAL] Unhandled Rejection at:', promise, 'reason:', reason);
    // The server stays alive!
});

process.on('uncaughtException', (error) => {
    console.error('🚨 [CRITICAL] Uncaught Exception thrown:', error);
    // The server stays alive!
})



const PORT = process.env.PORT || 5000





app.use(express.json())

app.use('/api/chat',chatRouter)
app.use('/api/upload',uploadRouter)
app.use('/api/documents',documentRouter)
app.use('/api/auth',authRouter)


app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`🚀 Server seamlessly running on port ${PORT}`);
})