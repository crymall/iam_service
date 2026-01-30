import express from "express";
import pool from "../config/db.js";
import { authenticateToken, authorizePermission } from "../middleware/authorize.js";

const router = express.Router();

router.get(
  "/",
  authenticateToken,
  authorizePermission("read:documents"),
  async (req, res) => {
    try {
      const result = await pool.query(
        "SELECT * FROM documents ORDER BY id ASC"
      );

      res.json({
        documents: result.rows,
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Database error" });
    }
  }
);

router.delete(
  "/:id",
  authenticateToken,
  authorizePermission("delete:documents"),
  async (req, res) => {
    const { id } = req.params;

    try {
      const result = await pool.query(
        "DELETE FROM documents WHERE id = $1 RETURNING *",
        [id]
      );

      if (result.rowCount === 0) {
        return res.status(404).json({ error: "Document not found" });
      }

      res.json({ message: `Document ${id} deleted successfully.` });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Database error" });
    }
  }
);

router.post(
  "/",
  authenticateToken,
  authorizePermission("write:documents"),
  async (req, res) => {
    const { title, content } = req.body;

    try {
      const result = await pool.query(
        "INSERT INTO documents (title, content) VALUES ($1, $2) RETURNING *",
        [title, content]
      );
      res.status(201).json(result.rows[0]);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Database error" });
    }
  }
);

export default router;
