const mongoose = require('mongoose');

mongoose.set('strictQuery', false);
const mongoURI = "mongodb+srv://gmlsdatabase:fUmuZgRFFQ8y4KcO@gmls.pxxkocf.mongodb.net/gmls?retryWrites=true&w=majority&appName=gmls"

const connectToMongo = () => {
    mongoose.connect(mongoURI, () => {
        console.log("Connected to mongo successfully ");
    })
}

module.exports = connectToMongo;