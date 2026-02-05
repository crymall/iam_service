import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import pool from "../config/db.js";
import crypto from "crypto";
import nodemailer from "nodemailer";

const authRouter = express.Router();

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const sendVerificationEmail = async (email, code) => {
  const mailOptions = {
    from: `"Midden 2FA" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "Your Verification Code",
    text: `Your 2FA login code is: ${code}. It expires in 10 minutes.`,
    html: `<p>Your 2FA login code is: <strong>${code}</strong></p><p>It expires in 10 minutes.</p>`,
  };

  try {
    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error("[Email Failed]", error);
  }
};

authRouter.post("/register", async (req, res) => {
  const { username, email, password } = req.body;

  try {
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);

    const roleRes = await pool.query(
      "SELECT id FROM roles WHERE name = 'Viewer'",
    );
    const viewerRoleId = roleRes.rows[0]?.id || 3;

    const result = await pool.query(
      "INSERT INTO users (username, email, password_hash, role_id) VALUES ($1, $2, $3, $4) RETURNING id, username, email",
      [username, email, hash, viewerRoleId],
    );

    res.status(201).json({ message: "User registered", user: result.rows[0] });
  } catch (err) {
    console.error(err);
    if (err.code === "23505") {
      return res
        .status(409)
        .json({ error: "Username or email already exists" });
    }
    res.status(500).json({ error: "Server error" });
  }
});

authRouter.post("/login", async (req, res) => {
  const { username, password } = req.body;

  try {
    const result = await pool.query("SELECT * FROM users WHERE username = $1", [
      username,
    ]);
    const user = result.rows[0];

    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const code = crypto.randomInt(100000, 999999).toString();
    const expiresAt = new Date(Date.now() + 10 * 60000);

    await pool.query(
      "INSERT INTO verification_codes (user_id, code, expires_at) VALUES ($1, $2, $3)",
      [user.id, code, expiresAt],
    );

    if (process.env.SKIP_EMAIL_VERIFICATION === "true") {
      console.log(`[DEV] Verification code for ${user.email}: ${code}`);
    } else {
      await sendVerificationEmail(user.email, code);
    }

    res.json({
      message: "Verification code sent to your email",
      userId: user.id,
      temp_token: "Enable this if you want stateless intermediate tokens",
      dev_code: process.env.SKIP_EMAIL_VERIFICATION === "true" ? code : undefined,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

authRouter.post("/verify-2fa", async (req, res) => {
  const { userId, code } = req.body;

  try {
    const codeRes = await pool.query(
      "SELECT * FROM verification_codes WHERE user_id = $1 AND code = $2 AND expires_at > NOW()",
      [userId, code],
    );

    if (codeRes.rowCount === 0) {
      return res.status(400).json({ error: "Invalid or expired code" });
    }

    await pool.query("DELETE FROM verification_codes WHERE user_id = $1", [
      userId,
    ]);

    const userRes = await pool.query(
      `
        SELECT u.id, u.username, u.email, r.name as role, ARRAY_AGG(p.slug) as permissions
        FROM users u
        JOIN roles r ON u.role_id = r.id
        LEFT JOIN role_permissions rp ON r.id = rp.role_id
        LEFT JOIN permissions p ON rp.permission_id = p.id
        WHERE u.id = $1
        GROUP BY u.id, r.name
      `,
      [userId],
    );

    const user = userRes.rows[0];

    const token = jwt.sign(
      {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        permissions: user.permissions,
      },
      process.env.JWT_SECRET || "dev_secret_key",
      { expiresIn: "24h" },
    );

    res.json({
      message: "Login successful",
      token,
      user: {
        username: user.username,
        role: user.role,
        permissions: user.permissions,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

authRouter.get("/", (req, res) => {
  res.send("At least this looks OK!");
});

export default authRouter;
