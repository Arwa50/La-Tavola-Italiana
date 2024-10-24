// models/Reservation.js
const mongoose = require('mongoose');

const reservationSchema = new mongoose.Schema({
    name: { type: String, required: true },
    phone: { type: String, required: true },
    reservationDate: { type: Date, required: true },
    tableLocation: { type: String, required: true },
    numberOfGuests: { type: Number, required: true },
    time: { type: String, required: true },
    notes: { type: String }
});

const Reservation = mongoose.model('Reservation', reservationSchema);

module.exports = Reservation;
