// routers/contact.js
const express = require('express');
const nodemailer = require('nodemailer');
const multer = require('multer');
const cors = require('cors');
const path = require('path');

const router = express.Router();

// Multer setup for file uploads
const upload = multer({ dest: 'uploads/' });

router.post('/send-email', upload.single('screenshot'), async (req, res) => {
  const { name, email, message } = req.body;
  const screenshot = req.file;

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'rajputusama826@gmail.com', // ✅ Use your Gmail
      pass: 'znti enie uuzg bhgd',   // ✅ Use app password, NOT real password
    },
  });

  const mailOptions = {
    from: email,
    to: 'rajputusama826@gmail.com',
    subject: `New Contact Form Submission from ${name}`,
    text: `Name: ${name}\nEmail: ${email}\n\nMessage:\n${message}`,
    attachments: screenshot
      ? [{
          filename: screenshot.originalname,
          path: screenshot.path,
        }]
      : [],
  };

  try {
    await transporter.sendMail(mailOptions);
    res.send('Email sent successfully');
  } catch (error) {
    console.error('Email error:', error);
    res.status(500).send('Failed to send email');
  }
});

module.exports = router;
