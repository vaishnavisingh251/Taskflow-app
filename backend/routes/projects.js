const router = require('express').Router();
const auth = require('../middleware/auth');
const isAdmin = require('../middleware/isAdmin');
const Project = require('../models/Project');
const Task = require('../models/Task');

// Get all projects
router.get('/', auth, async (req, res) => {
  try {
    const projects = await Project.find()
      .populate('members', 'name email role color')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });
    res.json(projects);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create project (admin only)
router.post('/', auth, isAdmin, async (req, res) => {
  try {
    const { name, description, color, members } = req.body;
    if (!name) return res.status(400).json({ message: 'Project name is required.' });
    const project = await Project.create({
      name, description, color: color || '#6366f1',
      createdBy: req.user.id,
      members: members || [req.user.id]
    });
    const populated = await Project.findById(project._id)
      .populate('members', 'name email role color')
      .populate('createdBy', 'name email');
    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update project (admin only)
router.put('/:id', auth, isAdmin, async (req, res) => {
  try {
    const project = await Project.findByIdAndUpdate(req.params.id, req.body, { new: true })
      .populate('members', 'name email role color');
    if (!project) return res.status(404).json({ message: 'Project not found.' });
    res.json(project);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Delete project (admin only)
router.delete('/:id', auth, isAdmin, async (req, res) => {
  try {
    await Project.findByIdAndDelete(req.params.id);
    await Task.deleteMany({ project: req.params.id });
    res.json({ message: 'Project deleted.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
