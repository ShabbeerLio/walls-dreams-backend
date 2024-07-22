const express = require('express');
const router = express.Router();
const Client = require('../models/Clients');
var fetchuser = require('../middleware/fetchuser');
const { body, validationResult } = require('express-validator');

// route1 : Get all clients using GET: "/api/clients/fetchallclients" login required
router.get('/fetchallclients', fetchuser, async (req, res) => {
    try {
        const clients = await Client.find({ user: req.user.id });
        res.json(clients);
    } catch (error) {
        console.error(error.message);
        res.status(500).send("Internal Server Error");
    }
});

// route2 : Add new client using POST: "/api/clients/addclients" login required
router.post('/addclients', fetchuser, [
    body('category', 'Enter a valid category').isLength({ min: 3 }),
], async (req, res) => {
    try {
        const { category, subcategories } = req.body;
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const client = new Client({
            category,
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

// route3 : Update client using PUT: "/api/clients/updateclients/:id" login required
router.put('/updateclients/:id', fetchuser, async (req, res) => {
    const { category, subcategories } = req.body;
    try {
        // Create a newClient object
        const newClient = {};
        if (category) { newClient.category = category; }
        if (subcategories) { newClient.subcategories = subcategories; }

        // Find the client to be updated and update it
        let client = await Client.findById(req.params.id);
        if (!client) {
            return res.status(404).send("Not Found");
        }
        if (client.user.toString() !== req.user.id) {
            return res.status(404).send("Not Allowed");
        }

        client = await Client.findByIdAndUpdate(req.params.id, { $set: newClient }, { new: true });
        res.json({ client });
    } catch (error) {
        console.error(error.message);
        res.status(500).send("Internal Server Error");
    }
});

// route4 : Delete client using DELETE: "/api/clients/deleteclients/:id" login required
router.delete('/deleteclients/:id', fetchuser, async (req, res) => {
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
        res.json({ "Success": "Client has been deleted", client: client });
    } catch (error) {
        console.error(error.message);
        res.status(500).send("Internal Server Error");
    }
});

// Add Subcategory ROUTE: /api/clients/:id/subcategories

router.post('/:clientId/subcategories', async (req, res) => {
    try {
        const client = await Client.findById(req.params.clientId);
        if (!client) {
            return res.status(404).json({ error: "Client not found" });
        }

        const { name, description } = req.body;
        client.subcategories.push({ name, description });
        await client.save();

        res.status(201).json({ message: "Subcategory added successfully" });
    } catch (error) {
        console.error("Error adding subcategory:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});


// Edit Subcategory ROUTE: /api/clients/:clientId/subcategories/:subcategoryId
router.put('/:clientId/subcategories/:subcategoryId', async (req, res) => {
    try {
        const client = await Client.findById(req.params.clientId);
        if (!client) {
            return res.status(404).json({ error: "Client not found" });
        }

        const { name, description } = req.body;
        const subcategory = client.subcategories.find(sub => sub._id.toString() === req.params.subcategoryId);
        if (subcategory) {
            subcategory.name = name;
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



// Delete Subcategory ROUTE: /api/clients/:id/subcategories
router.delete('/:clientId/subcategories/:subcategoryId', async (req, res) => {
    try {
        const client = await Client.findById(req.params.clientId);
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
