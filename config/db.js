const mongoose = require('mongoose');

module.exports = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URL, {
            useUnifiedTopology: true,
            useNewUrlParser: true
        });
        console.log(`Connection established succesfuly ${conn.connection.name}`.bgBlue.white.bold);
    } catch (error) {
        console.log(error.message);
    }
}