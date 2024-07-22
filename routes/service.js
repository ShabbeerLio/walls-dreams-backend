const express = require('express');
const router = express.Router();
const Service = require('../models/Service');
const fetchuser = require('../middleware/fetchuser');
const { body, validationResult } = require('express-validator');
const multer = require('multer');
const cloudinary = require("../helper/cloudinaryconfig");
const streamifier = require('streamifier');

// Configure multer to use memory storage
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Stream upload to Cloudinary
const streamUpload = (buffer) => {
    return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream((error, result) => {
            if (result) {
                resolve(result);
            } else {
                reject(error);
            }
        });
        streamifier.createReadStream(buffer).pipe(stream);
    });
};

// Get all services
router.get('/fetchallservice', fetchuser, async (req, res) => {
    try {
        const services = await Service.find({ user: req.user.id });
        res.json(services);
    } catch (error) {
        console.error(error.message);
        res.status(500).send("Internal Server Error");
    }
});

// Add a new service
router.post('/addservice', fetchuser, upload.single('imageUrl'), [
    body('title', 'Enter a valid title').isLength({ min: 3 }),
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { title } = req.body;

        // Ensure file is provided
        if (!req.file) {
            return res.status(400).json({ errors: [{ msg: 'Image file is required' }] });
        }

        // Upload to Cloudinary
        const result = await streamUpload(req.file.buffer);
        const imageUrl = result.secure_url;

        const service = new Service({
            title,
            imageUrl,
            user: req.user.id
        });

        const savedService = await service.save();
        res.json(savedService);
    } catch (error) {
        console.error('Error details:', error);
        res.status(500).send("Internal Server Error");
    }
});

// Update a service
router.put('/updateservice/:id', fetchuser, upload.single('imageUrl'), async (req, res) => {
    const { title } = req.body;
    let imageUrl = null;

    try {
        // Ensure file is provided if updating the image
        if (req.file) {
            const result = await streamUpload(req.file.buffer);
            imageUrl = result.secure_url;
        }

        const newService = {};
        if (title) newService.title = title;
        if (imageUrl) newService.imageUrl = imageUrl;

        // Find the service by ID
        let service = await Service.findById(req.params.id);
        if (!service) {
            return res.status(404).send("Not Found");
        }

        // Check if the user is authorized to update the service
        if (service.user.toString() !== req.user.id) {
            return res.status(401).send("Not Allowed");
        }

        // Update the service
        service = await Service.findByIdAndUpdate(req.params.id, { $set: newService }, { new: true });
        res.json(service);
    } catch (error) {
        console.error('Error details:', error);
        res.status(500).send("Internal Server Error");
    }
});

// Delete a service
router.delete('/deleteservice/:id', fetchuser, async (req, res) => {
    try {
        let service = await Service.findById(req.params.id);
        if (!service) {
            return res.status(404).send("Not Found");
        }

        if (service.user.toString() !== req.user.id) {
            return res.status(401).send("Not Allowed");
        }

        service = await Service.findByIdAndDelete(req.params.id);
        res.json({ "Success": "Service has been deleted", service: service });
    } catch (error) {
        console.error('Error details:', error);
        res.status(500).send("Internal Server Error");
    }
});

module.exports = router;
