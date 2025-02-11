const mongoose=require('mongoose');
require('dotenv').config()
const connectionString=process.env.CONNECTION_STRING
mongoose.connect(connectionString, {
    serverSelectionTimeoutMS: 10000,
  })
  .then(() => {
    console.log('Successfully connected to MongoDB');
  })
  .catch(err => {
    console.error('Error connecting to MongoDB:', err);
  });