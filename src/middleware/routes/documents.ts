import express from 'express';
import { dbPool } from '../../db/pool.js';
import { authenticateToken } from '../auth.js';

export const documentRouter = express.Router();


documentRouter.get('/', authenticateToken, async (req, res) => {
    try {
        const userId = req.user?.user_id;
        const result = await dbPool.query(
            `SELECT id, filename, metadata, created_at 
             FROM documents WHERE user_id = $1 ORDER BY created_at DESC`,
            [userId]
        );
        res.status(200).json(result.rows);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch documents" });
    }
});

// DELETE a document
documentRouter.delete('/:id', authenticateToken, async (req, res) => {
    try {
        const userId = req.user?.user_id;
        const { id } = req.params;
        
        // Thanks to ON DELETE CASCADE, this single query deletes the vectors too!
        await dbPool.query(
            `DELETE FROM documents WHERE id = $1 AND user_id = $2`,
            [id, userId]
        );
        res.status(200).json({ message: "Document deleted successfully" });
    } catch (error) {
        res.status(500).json({ error: "Failed to delete document" });
    }
});