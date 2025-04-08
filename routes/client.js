const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { Appointment } = require('../models/Appointment');
const { Service } = require('../models/Service');

// Get all client appointments
router.get('/appointments', auth, async (req, res) => {
  try {
    const appointments = await Appointment.find({ client: req.user._id })
      .populate('professional', 'name email phone')
      .populate('service', 'name duration price');
    res.json(appointments);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create new appointment
router.post('/appointments', auth, async (req, res) => {
  try {
    const service = await Service.findById(req.body.serviceId);
    if (!service) return res.status(404).json({ message: 'Service not found' });

    const appointment = new Appointment({
      professional: service.professional,
      client: req.user._id,
      service: req.body.serviceId,
      date: new Date(req.body.date),
      duration: service.duration,
      price: service.price
    });

    const savedAppointment = await appointment.save();
    res.status(201).json(savedAppointment);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Cancel appointment
router.patch('/appointments/:id/cancel', auth, async (req, res) => {
  try {
    const appointment = await Appointment.findOneAndUpdate(
      { _id: req.params.id, client: req.user._id },
      { status: 'cancelled' },
      { new: true }
    );
    if (!appointment) return res.status(404).json({ message: 'Appointment not found' });
    res.json(appointment);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

module.exports = router;
