import express from 'express';
import pool from '../config/db.js';
import { authenticateToken, authorizePermission } from '../middleware/authorize.js';

const usersRouter = express.Router();

usersRouter.get('/', 
  authenticateToken, 
  authorizePermission('read:users'), 
  async (req, res) => {
    try {
      const query = `
        SELECT u.id, u.username, r.name as role 
        FROM users u 
        JOIN roles r ON u.role_id = r.id 
        WHERE u.username IN ('alice_admin', 'bob_editor', 'charlie_view')
        ORDER BY u.id ASC;
      `;
      const result = await pool.query(query);
      res.json({ users: result.rows });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Database error" });
    }
});

usersRouter.delete('/:id', 
  authenticateToken, 
  authorizePermission('write:users'), 
  async (req, res) => {
    res.json({ 
      message: `Simulation: User ${req.params.id} deleted (not really).` 
    });
});

export default usersRouter;