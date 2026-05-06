import pool from "../config/db.js";

export const getAllUsers = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, username, full_name, email, phone, role, avatar, status, created_at, updated_at
       FROM users
       ORDER BY created_at DESC`
    );

    res.json({
      success: true,
      users: result.rows
    });
  } catch (err) {
    console.error("Get users error:", err);
    res.status(500).json({ error: "Lỗi server" });
  }
};

export const updateUserRole = async (req, res) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;

    if (![1, 2, 3].includes(role)) {
      return res.status(400).json({ error: "Role không hợp lệ" });
    }

    const result = await pool.query(
      `UPDATE users
       SET role = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING id, username, email, role`,
      [role, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Không tìm thấy người dùng" });
    }

    res.json({
      success: true,
      message: "Cập nhật role thành công",
      user: result.rows[0]
    });
  } catch (err) {
    console.error("Update role error:", err);
    res.status(500).json({ error: "Lỗi server" });
  }
};

export const updateUserStatus = async (req, res) => {
  try {
    const { userId } = req.params;
    const { status } = req.body;

    const result = await pool.query(
      `UPDATE users
       SET status = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING id, username, email, status`,
      [status, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Không tìm thấy người dùng" });
    }

    res.json({
      success: true,
      message: status ? "Kích hoạt tài khoản thành công" : "Vô hiệu hóa tài khoản thành công",
      user: result.rows[0]
    });
  } catch (err) {
    console.error("Update status error:", err);
    res.status(500).json({ error: "Lỗi server" });
  }
};
