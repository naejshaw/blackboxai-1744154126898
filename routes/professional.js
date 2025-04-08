const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { Appointment } = require('../models/Appointment');
const { Service } = require('../models/Service'); 
const { User } = require('../models/User');

// Get all professional appointments
router.get('/appointments', auth, async (req, res) => {
  try {
    const { date, clientName } = req.query;
    let query = { professional: req.user._id };

    if (date) {
      const startDate = new Date(date);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(date);
      endDate.setHours(23, 59, 59, 999);
      query.date = { $gte: startDate, $lte: endDate };
    }

    if (clientName) {
      const clients = await User.find({ 
        name: { $regex: clientName, $options: 'i' },
        userType: 'client'
      });
      query.client = { $in: clients.map(c => c._id) };
    }

    const appointments = await Appointment.find(query)
      .populate('client', 'name email phone')
      .populate('service', 'name duration price');
    res.json(appointments);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create new service
router.post('/services', auth, async (req, res) => {
  try {
    const service = new Service({
      professional: req.user._id,
      name: req.body.name,
      description: req.body.description,
      duration: req.body.duration,
      price: req.body.price
    });

    const savedService = await service.save();
    res.status(201).json(savedService);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Update service
router.put('/services/:id', auth, async (req, res) => {
  try {
    const service = await Service.findOneAndUpdate(
      { _id: req.params.id, professional: req.user._id },
      req.body,
      { new: true }
    );
    if (!service) return res.status(404).json({ message: 'Service not found' });
    res.json(service);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Delete service
router.delete('/services/:id', auth, async (req, res) => {
  try {
    const service = await Service.findOneAndDelete({
      _id: req.params.id,
      professional: req.user._id
    });
    if (!service) return res.status(404).json({ message: 'Service not found' });
    res.json({ message: 'Service deleted' });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

module.exports = router;
