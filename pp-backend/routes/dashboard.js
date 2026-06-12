const router = require("express").Router();
const pool = require("../db");
const { verifyToken } = require("../middleware/auth");

// GET /api/dashboard
router.get("/", verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const isAdmin = req.user.role === "admin";
    const today = new Date().toISOString().split("T")[0];

    const whereClause = isAdmin ? "" : "WHERE t.assigned_to = $1";
    const params = isAdmin ? [] : [userId];

    const statsResult = await pool.query(
      `SELECT
        COUNT(*)::int AS total,
        COUNT(*) FILTER (WHERE status = 'todo')::int AS todo,
        COUNT(*) FILTER (WHERE status = 'in_progress')::int AS in_progress,
        COUNT(*) FILTER (WHERE status = 'done')::int AS done,
        COUNT(*) FILTER (WHERE due_date < NOW() AND status != 'done')::int AS overdue
       FROM tasks t ${whereClause}`,
      params
    );

    const overdueResult = await pool.query(
      `SELECT t.*, u.name AS assigned_to_name
       FROM tasks t
       LEFT JOIN users u ON u.id = t.assigned_to
       WHERE t.due_date < $1 AND t.status != 'done'
       ${!isAdmin ? "AND t.assigned_to = $2" : ""}
       ORDER BY t.due_date ASC`,
      isAdmin ? [today] : [today, userId]
    );

    // Per-user task breakdown (Admin only)
    let perUser = [];
    if (isAdmin) {
      const perUserResult = await pool.query(
        `SELECT
          u.id,
          u.name,
          COUNT(*)::int AS total,
          COUNT(*) FILTER (WHERE t.status = 'todo')::int AS todo,
          COUNT(*) FILTER (WHERE t.status = 'in_progress')::int AS in_progress,
          COUNT(*) FILTER (WHERE t.status = 'done')::int AS done
         FROM tasks t
         JOIN users u ON u.id = t.assigned_to
         GROUP BY u.id, u.name
         ORDER BY total DESC`
      );
      perUser = perUserResult.rows;
    }

    res.json({
      ...statsResult.rows[0],
      overdue_tasks: overdueResult.rows,
      per_user: perUser,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch dashboard data" });
  }
});

module.exports = router;