const mongoose = require('mongoose');

const SubcategorySchema = new mongoose.Schema({
    name: {
        type: String,
        // required: true
    },
    description: {
        type: String
    },
    imageUrl: {
        type: String
    }
});

const BlogsSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    category: {
        type: String,
        required: true
    },
    categorydesc: {
        type: String,
        // required: true
    },
    tag: {
        type: String,
        required: true
    },
    catimageUrl: {
        type: String,
        required: true
    },
    subcategories: [SubcategorySchema],
    date: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Blogs', BlogsSchema);
