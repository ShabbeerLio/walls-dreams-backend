const express = require('express');
const router = express.Router();
const Meta = require('../models/Meta');
var fetchuser = require('../middleware/fetchuser');
const { body, validationResult } = require('express-validator');

// route1 : Get all clients using GET: "/api/meta/fetchallmeta" login required
router.get('/fetchallmeta', fetchuser, async (req, res) => {
    try {
        const clients = await Meta.find({ user: req.user.id });
        res.json(clients);
    } catch (error) {
        console.error(error.message);
        res.status(500).send("Internal Server Error");
    }
});

// route2 : Add new meta using POST: "/api/meta/addmeta" login required
router.post('/addmeta', fetchuser, [
    body('page', 'Enter a valid category').isLength({ min: 3 }),
], async (req, res) => {
    try {
        const { page, subcategories } = req.body;
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const client = new Meta({
            page,
            subcategories,
            user: req.user.id
        });
        const saveClient = await client.save();

        res.json(saveClient);
    } catch (error) {
        console.error(error.message);
        res.status(500).send("Internal Server Error");
    }
});

// route3 : Update meta using PUT: "/api/meta/updatemeta/:id" login required
router.put('/updatemeta/:id', fetchuser, async (req, res) => {
    const { page, subcategories } = req.body;
    try {
        // Create a newClient object
        const newClient = {};
        if (page) { newClient.page = page; }
        if (subcategories) { newClient.subcategories = subcategories; }

        // Find the client to be updated and update it
        let client = await Meta.findById(req.params.id);
        if (!client) {
            return res.status(404).send("Not Found");
        }
        if (client.user.toString() !== req.user.id) {
            return res.status(404).send("Not Allowed");
        }

        client = await Meta.findByIdAndUpdate(req.params.id, { $set: newClient }, { new: true });
        res.json({ client });
    } catch (error) {
        console.error(error.message);
        res.status(500).send("Internal Server Error");
    }
});

// route4 : Delete meta using DELETE: "/api/meta/deletemeta/:id" login required
router.delete('/deletemeta/:id', fetchuser, async (req, res) => {
    try {
        // Find the client to be deleted and delete it
        let client = await Meta.findById(req.params.id);
        if (!client) {
            return res.status(404).send("Not Found");
        }

        // Allow deletion only if user owns this client
        if (client.user.toString() !== req.user.id) {
            return res.status(404).send("Not Allowed");
        }

        client = await Meta.findByIdAndDelete(req.params.id);
        res.json({ "Success": "Client has been deleted", client: client });
    } catch (error) {
        console.error(error.message);
        res.status(500).send("Internal Server Error");
    }
});

// Add Subcategory ROUTE: /api/meta/:id/subcategories

router.post('/:clientId/subcategories', async (req, res) => {
    try {
        const client = await Meta.findById(req.params.clientId);
        if (!client) {
            return res.status(404).json({ error: "Client not found" });
        }

        const { title, description } = req.body;
        client.subcategories.push({ title, description });
        await client.save();

        res.status(201).json({ message: "Subcategory added successfully" });
    } catch (error) {
        console.error("Error adding subcategory:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});


// Edit Subcategory ROUTE: /api/meta/:clientId/subcategories/:subcategoryId
router.put('/:clientId/subcategories/:subcategoryId', async (req, res) => {
    try {
        const client = await Meta.findById(req.params.clientId);
        if (!client) {
            return res.status(404).json({ error: "Client not found" });
        }

        const { title, description } = req.body;
        const subcategory = client.subcategories.find(sub => sub._id.toString() === req.params.subcategoryId);
        if (subcategory) {
            subcategory.title = title;
            subcategory.description = description;
            await client.save();
            res.json({ message: "Subcategory updated successfully" });
        } else {
            res.status(404).json({ error: "Subcategory not found" });
        }
    } catch (error) {
        console.error("Error updating subcategory:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});



// Delete Subcategory ROUTE: /api/meta/:id/subcategories
router.delete('/:clientId/subcategories/:subcategoryId', async (req, res) => {
    try {
        const client = await Meta.findById(req.params.clientId);
        // console.log(client, "client");
        if (!client) {
            return res.status(404).json({ error: "Client not found" });
        }

        const subcategoryIndex = client.subcategories.findIndex(sub => sub._id.toString() === req.params.subcategoryId);
        // console.log(subcategoryIndex, "subcategory index");
        if (subcategoryIndex !== -1) {
            client.subcategories.splice(subcategoryIndex, 1);
            await client.save();
            res.json({ Success: "Subcategory deleted successfully" });
        } else {
            res.status(404).json({ error: "Subcategory not found" });
        }
    } catch (error) {
        console.error("Error deleting subcategory:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});




module.exports = router;
