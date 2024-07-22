const mongoose = require('mongoose');
const { Schema } = mongoose;

const SubcategorySchema = new mongoose.Schema({
    title: {
        type: String,
        // required: true
    },
    description: {
        type: String
    }
});

const MetaSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    page: {
        type: String,
        required: true
    },
    subcategories: [SubcategorySchema],
    date: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('meta', MetaSchema)