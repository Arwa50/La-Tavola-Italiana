// backend/routes/delivery.js
const express = require('express');
const router = express.Router();

// Delivery route
router.post('/', (req, res) => {
    const { name, address, phone } = req.body;
    console.log("Delivery Info:", { name, address, phone });
    res.send("Delivery information received");
});

module.exports = router;
