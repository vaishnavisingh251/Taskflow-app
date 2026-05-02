const router = require('express').Router();
const auth = require('../middleware/auth');
const isAdmin = require('../middleware/isAdmin');
const Task = require('../models/Task');

// Get all tasks (optional filter by projectId)
router.get('/', auth, async (req, res) => {
  try {
    const filter = {};
    if (req.query.projectId) filter.project = req.query.projectId;
    if (req.query.assigneeId) filter.assignee = req.query.assigneeId;

    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, parseInt(req.query.limit) || 50);
    const skip = (page - 1) * limit;

    const [tasks, total] = await Promise.all([
      Task.find(filter)
        .populate('assignee', 'name email color')
        .populate('project', 'name color')
        .populate('createdBy', 'name')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Task.countDocuments(filter)
    ]);

    res.json({
      tasks,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create task (admin only)
router.post('/', auth, isAdmin, async (req, res) => {
  try {
    const { title, description, project, assignee, status, priority, dueDate } = req.body;
    if (!title || !project) 
      return res.status(400).json({ message: 'Title and project are required.' });
    const task = await Task.create({
      title, description, project, assignee, status, priority, dueDate,
      createdBy: req.user.id
    });
    const populated = await Task.findById(task._id)
      .populate('assignee', 'name email color')
      .populate('project', 'name color');
    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update task
router.put('/:id', auth, async (req, res) => {
  try {
    // Members can only update status. Admins can update everything.
    const updates = req.user.role === 'admin'
      ? req.body
      : { status: req.body.status };
    const task = await Task.findByIdAndUpdate(req.params.id, updates, { new: true })
      .populate('assignee', 'name email color')
      .populate('project', 'name color');
    if (!task) return res.status(404).json({ message: 'Task not found.' });
    res.json(task);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Delete task (admin only)
router.delete('/:id', auth, isAdmin, async (req, res) => {
  try {
    await Task.findByIdAndDelete(req.params.id);
    res.json({ message: 'Task deleted.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
