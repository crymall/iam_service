import express from "express";
import pool from "../config/db.js";
import {
  authenticateToken,
  authorizePermission,
} from "../middleware/authorize.js";

const usersRouter = express.Router();


usersRouter.get(
  "/",
  authenticateToken,
  authorizePermission("read:users"),
  async (req, res) => {
    try {
      const query = `
        SELECT u.id, u.username, u.email, r.name as role 
        FROM users u 
        JOIN roles r ON u.role_id = r.id 
        ORDER BY u.id ASC;
      `;
      const result = await pool.query(query);
      res.json({ users: result.rows });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Database error" });
    }
  },
);

usersRouter.delete(
  "/:id",
  authenticateToken,
  authorizePermission("write:users"),
  async (req, res) => {
    const userId = req.params.id;

    try {
      const userRes = await pool.query(
        `SELECT r.name FROM users u
         LEFT JOIN roles r ON u.role_id = r.id
         WHERE u.id = $1`,
        [userId],
      );

      if (userRes.rowCount === 0) {
        return res.status(404).json({ error: "User not found" });
      }

      if (userRes.rows[0].name === "Admin") {
        return res.status(403).json({ error: "Cannot delete an Admin user" });
      }

      await pool.query("DELETE FROM users WHERE id = $1", [userId]);

      res.json({ message: "User deleted successfully" });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Database error" });
    }
  },
);

usersRouter.patch(
  "/:id/role",
  authenticateToken,
  authorizePermission("write:users"),
  async (req, res) => {
    const { roleId } = req.body;
    const userId = req.params.id;

    if (!roleId) {
      return res.status(400).json({ error: "roleId is required" });
    }

    try {
      const userRes = await pool.query(
        `SELECT r.name FROM users u
         LEFT JOIN roles r ON u.role_id = r.id
         WHERE u.id = $1`,
        [userId],
      );

      if (userRes.rowCount === 0) {
        return res.status(404).json({ error: "User not found" });
      }

      if (userRes.rows[0].name === "Admin") {
        return res.status(403).json({ error: "Cannot modify role of an Admin user" });
      }

      await pool.query("UPDATE users SET role_id = $1 WHERE id = $2", [roleId, userId]);

      res.json({ message: "User role updated" });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Database error" });
    }
  },
);

export default usersRouter;
