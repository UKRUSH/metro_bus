// Test MongoDB Atlas connection
const mongoose = require('mongoose');

const MONGODB_URI = 'mongodb+srv://udeshansanju_db_user:icA6PBeg8evJmM0r@cluster0.ukmhazu.mongodb.net/metro_bus?retryWrites=true&w=majority&appName=Cluster0';

console.log('Testing MongoDB Atlas connection...');

mongoose.connect(MONGODB_URI, {
  serverSelectionTimeoutMS: 5000,
})
.then(() => {
  console.log('✅ MongoDB Atlas connected successfully!');
  process.exit(0);
})
.catch((error) => {
  console.error('❌ MongoDB connection failed:');
  console.error('Error name:', error.name);
  console.error('Error message:', error.message);
  if (error.reason) {
    console.error('Reason:', error.reason);
  }
  process.exit(1);
});
