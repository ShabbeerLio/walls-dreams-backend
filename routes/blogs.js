const express = require('express');
const router = express.Router();
const Client = require('../models/Blogs');
var fetchuser = require('../middleware/fetchuser');
const { body, validationResult } = require('express-validator');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cloudinary = require("../helper/cloudinaryconfig")

// Ensure the uploads directory exists

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, "./uploads");
    },
    filename: function (req, file, cb) {
        cb(null, `image-${Date.now()}.${file.originalname}`);
    }
});

const isImage = (req, file, cb) => {
    if (file.mimetype.startsWith("image")) {
        cb(null, true)
    } else {
        cb(new Error("only image is allowed"))
    }
}

const upload = multer({
    storage: storage,
    fileFilter: isImage
});

// route1 : Get all clients using GET: "/api/blog/fetchallblog" login required
router.get('/fetchallblog', fetchuser, async (req, res) => {
    try {
        const clients = await Client.find({ user: req.user.id });
        res.json(clients);
    } catch (error) {
        console.error(error.message);
        res.status(500).send("Internal Server Error");
    }
});

// route2 : Add new client using POST: "/api/blog/addblog" login required
router.post('/addblog', fetchuser, upload.single('image'), [
    body('category', 'Enter a valid category').isLength({ min: 3 }),
    body('categorydesc', 'Enter a valid description').isLength({ min: 5 }),
], async (req, res) => {
    try {
        const { category, categorydesc, tag, subcategories } = req.body;
        const catimageUrl = ((await cloudinary.uploader.upload(req.file.path)).secure_url);

        if (!catimageUrl) {
            return res.status(400).json({ errors: [{ msg: 'Image URL is required' }] });
        }

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const blog = new Client({
            category,
            categorydesc,
            tag,
            catimageUrl,
            subcategories,
            user: req.user.id
        });
        const savedBlog = await blog.save();

        res.json(savedBlog);
    } catch (error) {
        console.error(error.message);
        res.status(500).send("Internal Server Error");
    }
});

// route3 : Update client using PUT: "/api/blog/updateblog/:id" login required
router.put('/updateblog/:id', fetchuser, upload.single('image'), async (req, res) => {
    const { category, categorydesc, tag, subcategories } = req.body;
    let catimageUrl = null 

    try {
        // Upload the image to Cloudinary if a file is provided
        if (req.file) {
            const result = await cloudinary.uploader.upload(req.file.path);
            catimageUrl = result.secure_url;
        }
        // Create a newClient object 
        const newBlog = {};
        if (category) { newBlog.category = category; }
        if (categorydesc) { newBlog.categorydesc = categorydesc };
        if (tag) { newBlog.tag = tag };
        if (catimageUrl) newBlog.catimageUrl = catimageUrl;
        if (subcategories) { newBlog.subcategories = subcategories; }

        // Find the blog to be updated and update it
        let blog = await Client.findById(req.params.id);
        if (!blog) {
            return res.status(404).send("Not Found");
        }
        if (blog.user.toString() !== req.user.id) {
            return res.status(404).send("Not Allowed");
        }

        blog = await Client.findByIdAndUpdate(req.params.id, { $set: newBlog }, { new: true });
        res.json(blog);
    } catch (error) {
        console.error(error.message);
        res.status(500).send("Internal Server Error");
    }
});

// route4 : Delete blog using DELETE: "/api/blog/deleteblog/:id" login required
router.delete('/deleteblog/:id', fetchuser, async (req, res) => {
    try {
        // Find the client to be deleted and delete it
        let client = await Client.findById(req.params.id);
        if (!client) {
            return res.status(404).send("Not Found");
        }

        // Allow deletion only if user owns this client
        if (client.user.toString() !== req.user.id) {
            return res.status(404).send("Not Allowed");
        }

        client = await Client.findByIdAndDelete(req.params.id);
        res.json({ "Success": "Blog has been deleted", client: client });
    } catch (error) {
        console.error(error.message);
        res.status(500).send("Internal Server Error");
    }
});

// Add Subcategory ROUTE: /api/blog/:id/subcategories

router.post('/:clientId/subcategories', upload.single('image'), async (req, res) => {
    try {
        const client = await Client.findById(req.params.clientId);
        if (!client) {
            return res.status(404).json({ error: "Blog not found" });
        }

        const { name, description } = req.body;
        const imageUrl = ((await cloudinary.uploader.upload(req.file.path)).secure_url);

        if (!imageUrl) {
            return res.status(400).json({ errors: [{ msg: 'Subcategory image URL is required' }] });
        }

        client.subcategories.push({ name, description, imageUrl });
        await client.save();

        res.status(201).json({ message: "Subcategory added successfully" });
    } catch (error) {
        console.error("Error adding subcategory:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});


// Edit Subcategory ROUTE: /api/blog/:clientId/subcategories/:subcategoryId
router.put('/:clientId/subcategories/:subcategoryId', upload.single('image'), async (req, res) => {
    try {
        const client = await Client.findById(req.params.clientId);
        if (!client) {
            return res.status(404).json({ error: "Blog not found" });
        }

        const { name, description } = req.body;
        const subcategory = client.subcategories.find(sub => sub._id.toString() === req.params.subcategoryId);
        if (subcategory) {
            subcategory.name = name || subcategory.name;
            subcategory.description = description || subcategory.description;

            if (req.file) {
                const result = await cloudinary.uploader.upload(req.file.path);
                subcategory.imageUrl = result.secure_url;
            }
            // if (req.file) {
            //     subcategory.imageUrl = ((await cloudinary.uploader.upload(req.file.path)).secure_url);
            // }

            await client.save();
            res.json({ message: "Blog detail updated successfully" });
        } else {
            res.status(404).json({ error: "Blog detail not found" });
        }
    } catch (error) {
        console.error("Error updating Blog detail:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});




// Delete Subcategory ROUTE:/api/blog/:id/subcategories
router.delete('/:clientId/subcategories/:subcategoryId', async (req, res) => {
    try {
        const client = await Client.findById(req.params.clientId);
        // console.log(client, "client");
        if (!client) {
            return res.status(404).json({ error: "Blog not found" });
        }

        const subcategoryIndex = client.subcategories.findIndex(sub => sub._id.toString() === req.params.subcategoryId);
        // console.log(subcategoryIndex, "subcategory index");
        if (subcategoryIndex !== -1) {
            client.subcategories.splice(subcategoryIndex, 1);
            await client.save();
            res.json({ Success: "Blog detail deleted successfully" });
        } else {
            res.status(404).json({ error: "Blog detail not found" });
        }
    } catch (error) {
        console.error("Error deleting Blog detail:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});




module.exports = router;