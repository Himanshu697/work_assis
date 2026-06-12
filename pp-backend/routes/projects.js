const router = require("express").Router();
const pool = require("../db");
const { verifyToken, requireAdmin } = require("../middleware/auth");

// GET /api/projects — list projects where user is member or creator
router.get("/", verifyToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT p.*, 
        (SELECT COUNT(*) FROM project_members pm WHERE pm.project_id = p.id)::int AS member_count
       FROM projects p
       WHERE p.created_by = $1
         OR EXISTS (
           SELECT 1 FROM project_members pm 
           WHERE pm.project_id = p.id AND pm.user_id = $1
         )
       ORDER BY p.created_at DESC`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch projects" });
  }
});

// GET /api/projects/:id — get single project
router.get("/:id", verifyToken, async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM projects WHERE id = $1", [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Project not found" });
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch project" });
  }
});

// POST /api/projects — create project (Admin only)
router.post("/", verifyToken, requireAdmin, async (req, res) => {
  const { name, description, deadline } = req.body;
  if (!name) return res.status(400).json({ message: "Project name is required" });

  try {
    const result = await pool.query(
      "INSERT INTO projects (name, description, deadline, created_by) VALUES ($1, $2, $3, $4) RETURNING *",
      [name, description || null, deadline || null, req.user.id]
    );

    // Auto-add creator as member
    await pool.query(
      "INSERT INTO project_members (project_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING",
      [result.rows[0].id, req.user.id]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to create project" });
  }
});

// DELETE /api/projects/:id — delete project (Admin only)
router.delete("/:id", verifyToken, requireAdmin, async (req, res) => {
  try {
    await pool.query("DELETE FROM projects WHERE id = $1", [req.params.id]);
    res.json({ message: "Project deleted" });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete project" });
  }
});

// GET /api/projects/:id/members — list members
router.get("/:id/members", verifyToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT u.id, u.name, u.email, u.role 
       FROM users u
       JOIN project_members pm ON pm.user_id = u.id
       WHERE pm.project_id = $1`,
      [req.params.id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch members" });
  }
});

// POST /api/projects/:id/members — add member (Admin only)
router.post("/:id/members", verifyToken, requireAdmin, async (req, res) => {
  const { userId } = req.body;
  if (!userId) return res.status(400).json({ message: "userId is required" });

  try {
    await pool.query(
      "INSERT INTO project_members (project_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING",
      [req.params.id, userId]
    );
    res.json({ message: "Member added" });
  } catch (err) {
    res.status(500).json({ message: "Failed to add member" });
  }
});

// DELETE /api/projects/:id/members/:userId — remove member (Admin only)
router.delete("/:id/members/:userId", verifyToken, requireAdmin, async (req, res) => {
  try {
    await pool.query(
      "DELETE FROM project_members WHERE project_id = $1 AND user_id = $2",
      [req.params.id, req.params.userId]
    );
    res.json({ message: "Member removed" });
  } catch (err) {
    res.status(500).json({ message: "Failed to remove member" });
  }
});

// GET /api/projects/:id/tasks — get tasks for a project
router.get("/:id/tasks", verifyToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT t.*, u.name AS assigned_to_name 
       FROM tasks t
       LEFT JOIN users u ON u.id = t.assigned_to
       WHERE t.project_id = $1
       ORDER BY t.created_at DESC`,
      [req.params.id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch tasks" });
  }
});

module.exports = router;
