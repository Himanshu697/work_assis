const router = require("express").Router();
const pool = require("../db");
const { verifyToken, requireAdmin } = require("../middleware/auth");

// GET /api/users — list all users (Admin only, for adding members)
router.get("/", verifyToken, requireAdmin, async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id, name, email, role FROM users ORDER BY name ASC"
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch users" });
  }
});

module.exports = router;
