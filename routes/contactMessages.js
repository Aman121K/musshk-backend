const express = require('express');
const router = express.Router();
const ContactMessage = require('../models/ContactMessage');

// Submit contact message (public)
router.post('/', async (req, res) => {
  try {
    const { name, email, phone, subject, message, imageUrls, videoUrls } = req.body || {};

    if (!name || !email || !subject || !message) {
      return res.status(400).json({
        error: 'name, email, subject and message are required',
      });
    }

    const contactMessage = await ContactMessage.create({
      name: String(name).trim(),
      email: String(email).trim().toLowerCase(),
      phone: phone ? String(phone).trim() : '',
      subject: String(subject).trim(),
      message: String(message).trim(),
      imageUrls: Array.isArray(imageUrls) ? imageUrls.filter(Boolean) : [],
      videoUrls: Array.isArray(videoUrls) ? videoUrls.filter(Boolean) : [],
    });

    res.status(201).json({
      success: true,
      message: 'Message submitted successfully',
      data: contactMessage,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all messages (admin)
router.get('/admin/all', async (req, res) => {
  try {
    const messages = await ContactMessage.find().sort({ createdAt: -1 });
    res.json(messages);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
