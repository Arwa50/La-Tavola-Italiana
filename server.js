const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
const cors = require('cors');
const path = require('path');
const { body, validationResult } = require('express-validator');
const rateLimit = require('express-rate-limit');
require('dotenv').config(); // Load environment variables from .env

// Create an instance of Express
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors()); // Enable CORS
app.use(bodyParser.json()); // Parse JSON bodies

// Serve static files from Front-end directory
app.use(express.static(path.join(__dirname, '../Front-end')));

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB connected!'))
  .catch(err => console.error('MongoDB connection error:', err));

// Rate limiting middleware for login and registration
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, 
    max: 100, // Limit each IP to 100 requests per windowMs
    message: 'Too many requests, please try again later.'
});

// User Schema for login and registration
const userSchema = new mongoose.Schema({
    fullName: { type: String, required: true },
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    phoneNumber: { type: String, required: true },
    password: { type: String, required: true },
});

// User Model
const User = mongoose.model('User', userSchema, 'users');

// Reservation Schema
const reservationSchema = new mongoose.Schema({
    name: { type: String, required: true },
    phone: { type: String, required: true },
    reservationDate: { type: Date, required: true },
    tableLocation: { type: String },
    numberOfGuests: { type: Number, required: true },
    time: { type: String, required: true },
    notes: { type: String },
});

// Reservation Model
const Reservation = mongoose.model('Reservation', reservationSchema, 'reservations');

// Middleware for authentication
const authMiddleware = require('./middleware/authMiddleware'); 

// Menu Schema
const menuSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: { type: String, required: true },
    price: { type: Number, required: true },
    category: { type: String, required: true }, 
    imageUrl: { type: String, required: true }, 
});

// Menu Model
const Menu = mongoose.model('Menu', menuSchema, 'menu');

// Delivery Schema
const deliverySchema = new mongoose.Schema({
    name: { type: String, required: true },
    address: { type: String, required: true },
    phone: { type: String, required: true },
});

// Delivery Model
const Delivery = mongoose.model('Delivery', deliverySchema, 'deliveries');

// Pickup Schema
const pickupSchema = new mongoose.Schema({
    branch: { type: String, required: true },
});

// Pickup Model
const Pickup = mongoose.model('Pickup', pickupSchema, 'pickups');

// Registration Route 
// Apply rate limiting
app.post('/register', limiter, [
    body('fullName').notEmpty().withMessage('Full name is required.'),
    body('username').notEmpty().withMessage('Username is required.'),
    body('email').isEmail().withMessage('Invalid email address.'),
    body('phoneNumber').notEmpty().withMessage('Phone number is required.'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long.')
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { fullName, username, email, phoneNumber, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
        return res.status(400).send({ message: 'User with this email or username already exists' });
    }

    // Hash the password before saving it to the database
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create a new user
    const newUser = new User({
        fullName,
        username,
        email,
        phoneNumber,
        password: hashedPassword,
    });

    try {
        await newUser.save();
        res.status(201).send({ message: 'User registered successfully', redirectUrl: '/MainPage/restrunt.html' });
    } catch (error) {
        res.status(500).send({ message: 'Error registering user: ' + error.message });
    }
});

// Login Route
app.post('/login', limiter, [
    body('email').isEmail().withMessage('Invalid email address.'),
    body('password').notEmpty().withMessage('Password is required.')
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).send({ message: 'User not found' });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).send({ message: 'Invalid password' });
        }

        res.status(200).send({ message: 'Login successful', redirectUrl: '/MainPage/restrunt.html' });
    } catch (error) {
        res.status(500).send({ message: 'Internal server error' });
    }
});


// Reservation Route (with login check)
app.post('/api/reservations/reserve', authMiddleware, async (req, res) => {
    const { name, phone, reservationDate, tableLocation, numberOfGuests, time, notes } = req.body;

    // Validate the required fields
    if (!name || !phone || !reservationDate || !numberOfGuests || !time) {
        return res.status(400).json({ message: 'All fields are required.' });
    }

    const newReservation = new Reservation({
        name,
        phone,
        reservationDate,
        tableLocation,
        numberOfGuests,
        time,
        notes,
    });

    try {
        await newReservation.save();
        return res.status(201).json({ message: 'Reservation created successfully' });
    } catch (error) {
        console.error('Error saving reservation:', error); 
        return res.status(500).json({ message: 'Failed to save reservation', error: error.message });
    }
});

// Get Menu Route
// This route fetches menu items from the database
app.get('/api/menu', async (req, res) => {
    try {
        const menuItems = await Menu.find({});
        res.status(200).json(menuItems);
    } catch (error) {
        console.error('Error fetching menu:', error);
        res.status(500).json({ message: 'Failed to fetch menu' });
    }
});


// Delivery Route
app.post('/api/delivery', async (req, res) => {
    const { name, address, phone } = req.body;

    // Validate required fields
    if (!name || !address || !phone) {
        return res.status(400).send('All fields are required');
    }

    // Create a new delivery record
    const newDelivery = new Delivery({
        name,
        address,
        phone,
    });

    try {
        await newDelivery.save();
        res.status(200).send('Delivery information submitted successfully!');
    } catch (error) {
        res.status(500).send('Error saving delivery information: ' + error.message);
    }
});

// Pickup Route
app.post('/api/pickup', async (req, res) => {
    const { branch } = req.body;
    
    if (!branch) {
        return res.status(400).send('Branch is required');
    }

    // Create a new pickup record
    const newPickup = new Pickup({
        branch,
    });

    try {
        await newPickup.save();
        res.status(200).send('Pickup branch selected successfully!');
    } catch (error) {
        console.error('Error saving pickup:', error);
        res.status(500).send('Error saving pickup information: ' + error.message);
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
