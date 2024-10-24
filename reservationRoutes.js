// routes/reservationRoutes.js
const express = require('express');
const router = express.Router();
const { createReservation } = require('../controllers/reservationController');
const verifyToken = require('../middleware/authMiddleware'); 

router.post('/reserve', verifyToken, createReservation); 

module.exports = router;
