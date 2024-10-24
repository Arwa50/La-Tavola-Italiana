// controllers/reservationController.js
const Reservation = require('../models/Reservation');

exports.createReservation = async (req, res) => {
    const { name, phone, reservationDate, tableLocation, numberOfGuests, time, notes } = req.body;

    try {
        const newReservation = new Reservation({ name, phone, reservationDate, tableLocation, numberOfGuests, time, notes });
        await newReservation.save();
        res.status(201).json({ message: 'Reservation successful', reservation: newReservation });
    } catch (error) {
        res.status(500).json({ message: 'Error creating reservation', error });
    }
};
