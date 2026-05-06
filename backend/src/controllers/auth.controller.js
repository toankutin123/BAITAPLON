import pool from "../config/db.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

export const register = async (req, res) => {
  try {
    const { username, full_name, email, phone, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ error: "Vui lòng điền đầy đủ thông tin" });
    }

    const existingUser = await pool.query(
      "SELECT * FROM users WHERE email = $1",
      [email]
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: "Email đã tồn tại" });
    }

    if (phone) {
      const existingPhone = await pool.query(
        "SELECT * FROM users WHERE phone = $1",
        [phone]
      );
      if (existingPhone.rows.length > 0) {
        return res.status(400).json({ error: "Số điện thoại đã tồn tại" });
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await pool.query(
      `INSERT INTO users (username, full_name, email, phone, password_hash, role, status)
       VALUES ($1, $2, $3, $4, $5, 3, true)
       RETURNING id, username, full_name, email, phone, role, avatar, status, created_at`,
      [username, full_name, email, phone, hashedPassword]
    );

    const user = result.rows[0];
    const token = jwt.sign(
      { id: user.id, username: user.username, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.status(201).json({
      message: "Đăng ký thành công",
      token,
      user: {
        id: user.id,
        username: user.username,
        full_name: user.full_name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        avatar: user.avatar,
        status: user.status
      }
    });
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ error: "Lỗi server" });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Vui lòng điền đầy đủ thông tin" });
    }

    const result = await pool.query(
      "SELECT * FROM users WHERE email = $1",
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: "Email hoặc mật khẩu không đúng" });
    }

    const user = result.rows[0];

    if (!user.status) {
      return res.status(403).json({ error: "Tài khoản đã bị vô hiệu hóa" });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);

    if (!isMatch) {
      return res.status(401).json({ error: "Email hoặc mật khẩu không đúng" });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      message: "Đăng nhập thành công",
      token,
      user: {
        id: user.id,
        username: user.username,
        full_name: user.full_name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        avatar: user.avatar,
        status: user.status
      }
    });

  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Lỗi server" });
  }
};