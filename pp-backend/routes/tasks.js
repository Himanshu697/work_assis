const router = require("express").Router();
const pool = require("../db");
const { verifyToken, requireAdmin } = require("../middleware/auth");

// GET /api/tasks/mine — tasks assigned to logged-in user
router.get("/mine", verifyToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT t.*, u.name AS assigned_to_name, p.name AS project_name
       FROM tasks t
       LEFT JOIN users u ON u.id = t.assigned_to
       LEFT JOIN projects p ON p.id = t.project_id
       WHERE t.assigned_to = $1
       ORDER BY t.due_date ASC NULLS LAST, t.created_at DESC`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch tasks" });
  }
});

// POST /api/tasks — create task
router.post("/", verifyToken, async (req, res) => {
  const { title, description, priority, due_date, project_id, assigned_to } = req.body;

  if (!title) return res.status(400).json({ message: "Title is required" });
  if (!project_id) return res.status(400).json({ message: "project_id is required" });

  try {
    // Project membership guard — member sirf apne project mein task bana sake
    if (req.user.role !== "admin") {
      const memberCheck = await pool.query(
        `SELECT 1 FROM project_members WHERE project_id = $1 AND user_id = $2`,
        [project_id, req.user.id]
      );
      if (memberCheck.rows.length === 0) {
        return res.status(403).json({ message: "You are not a member of this project" });
      }
    }

    // Members can only assign to themselves
    const finalAssignedTo = req.user.role === "admin"
      ? (assigned_to || req.user.id)
      : req.user.id;

    const result = await pool.query(
      `INSERT INTO tasks (title, description, priority, due_date, project_id, assigned_to)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [title, description || null, priority || "medium", due_date || null, project_id, finalAssignedTo]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to create task" });
  }
});

// PATCH /api/tasks/:id — update task
router.patch("/:id", verifyToken, async (req, res) => {
  const { status, title, description, priority, due_date, assigned_to } = req.body;

  try {
    const existing = await pool.query("SELECT * FROM tasks WHERE id = $1", [req.params.id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ message: "Task not found" });
    }

    const task = existing.rows[0];
    const isAdmin = req.user.role === "admin";
    const isAssigned = task.assigned_to === req.user.id;

    if (!isAdmin && !isAssigned) {
      return res.status(403).json({ message: "You can only update your own tasks" });
    }

    const newStatus = status || task.status;
    const newTitle = isAdmin ? (title || task.title) : task.title;
    const newDesc = isAdmin ? (description !== undefined ? description : task.description) : task.description;
    const newPriority = isAdmin ? (priority || task.priority) : task.priority;
    const newDueDate = isAdmin ? (due_date !== undefined ? due_date : task.due_date) : task.due_date;
    const newAssignedTo = isAdmin ? (assigned_to || task.assigned_to) : task.assigned_to;

    const result = await pool.query(
      `UPDATE tasks SET status=$1, title=$2, description=$3, priority=$4, due_date=$5, assigned_to=$6
       WHERE id=$7 RETURNING *`,
      [newStatus, newTitle, newDesc, newPriority, newDueDate, newAssignedTo, req.params.id]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to update task" });
  }
});

// DELETE /api/tasks/:id — delete task (Admin only)
router.delete("/:id", verifyToken, requireAdmin, async (req, res) => {
  try {
    await pool.query("DELETE FROM tasks WHERE id = $1", [req.params.id]);
    res.json({ message: "Task deleted" });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete task" });
  }
});

module.exports = router;