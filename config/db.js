const mongoose = require('mongoose');

mongoose.set('useCreateIndex', true);

module.exports = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URL, {
      useUnifiedTopology: true,
      useNewUrlParser: true,
      useFindAndModify: false,
    });
    console.log(
      `Connection established succesfuly ${conn.connection.name}`.bgBlue.white
        .bold
    );
  } catch (error) {
    console.log(error.message);
  }
};
