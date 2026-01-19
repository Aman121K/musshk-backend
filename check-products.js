const mongoose = require('mongoose');
const Product = require('./models/Product');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27018/musk';

mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(async () => {
  console.log('MongoDB Connected\n');
  
  const products = await Product.find().limit(10);
  console.log(`Total products in database: ${await Product.countDocuments()}\n`);
  console.log('Sample products:\n');
  
  products.forEach((p, i) => {
    console.log(`${i + 1}. ${p.name}`);
    console.log(`   Code: ${p.code}`);
    console.log(`   Category: ${p.category}`);
    console.log(`   Price: Rs. ${p.price}`);
    console.log(`   Images: ${p.images.length} image(s)`);
    if (p.images.length > 0) {
      console.log(`   Image URLs: ${p.images.slice(0, 2).join(', ')}${p.images.length > 2 ? '...' : ''}`);
    }
    console.log(`   Description: ${p.description.substring(0, 100)}...`);
    console.log(`   Tags: ${p.tags.join(', ') || 'None'}`);
    console.log('');
  });
  
  await mongoose.connection.close();
  process.exit(0);
})
.catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});

