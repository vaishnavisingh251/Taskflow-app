const router = require('express').Router();
const auth = require('../middleware/auth');
const User = require('../models/User');

// Get all users (for assigning tasks)
router.get('/', auth, async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ name: 1 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get current user profile
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

const isAdmin = require('../middleware/isAdmin');

// Update user role (admin only)
router.put('/:id/role', auth, isAdmin, async (req, res) => {
  try {
    const { role } = req.body;
    if (!['admin', 'member'].includes(role))
      return res.status(400).json({ message: 'Role must be admin or member.' });
    if (req.params.id === req.user.id)
      return res.status(400).json({ message: 'You cannot change your own role.' });
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true }
    ).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found.' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
