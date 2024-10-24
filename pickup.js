// backend/routes/pickup.js
const express = require('express');
const router = express.Router();

// Pickup route
router.post('/', (req, res) => {
    const { branch } = req.body;
    console.log("Pickup Branch:", branch);
    res.send("Pickup branch selected");
});

module.exports = router;
