const mongoose = require('mongoose');
const Product = require('./models/Product');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/musk';

const sampleProducts = [
  {
    name: 'XP12 Musk Sauvage',
    slug: 'xp12-musk-sauvage',
    code: 'XP12',
    description: 'Dior Sauvage Perfume: The Pinnacle of Luxury Fragrance. A legendary fragrance inspired by the wild beauty of nature.',
    shortDescription: 'Inspired by Dior Sauvage',
    price: 375,
    originalPrice: 499,
    images: ['/images/xp12.jpg'],
    category: 'Inspired Perfumes',
    tags: ['Best Seller', 'Men'],
    sizes: [
      { size: '100 ml', price: 375, stock: 50 },
      { size: '20 ml', price: 150, stock: 100 },
    ],
    stock: 50,
    rating: 4.5,
    reviewCount: 35,
    bestSeller: true,
    notes: ['Calabrian Bergamot', 'Pepper', 'Sichuan pepper', 'Lavender', 'Pink Pepper', 'Vetiver'],
  },
  {
    name: 'XP21 Musk Av3ntus',
    slug: 'xp21-musk-av3ntus',
    code: 'XP21',
    description: 'Creed Aventus Perfume: The Pinnacle of Luxury Fragrance. A legendary fragrance that embodies sophistication and elegance.',
    shortDescription: 'Inspired by Creed Aventus',
    price: 375,
    originalPrice: 499,
    images: ['/images/xp21.jpg'],
    category: 'Inspired Perfumes',
    tags: ['Best Seller', 'Men'],
    sizes: [
      { size: '100 ml', price: 375, stock: 50 },
      { size: '20 ml', price: 150, stock: 100 },
    ],
    stock: 50,
    rating: 4.7,
    reviewCount: 33,
    bestSeller: true,
  },
  {
    name: 'XP43 Musk Oud Wood',
    slug: 'xp43-musk-oud-wood',
    code: 'XP43',
    description: 'Tom Ford Oud Wood Parfum: A Luxurious Exploration of Exotic Elegance. A sophisticated blend of oud and wood notes.',
    shortDescription: 'Inspired by Tom Ford Oud Wood',
    price: 375,
    originalPrice: 499,
    images: ['/images/xp43.jpg'],
    category: 'Inspired Perfumes',
    tags: ['Luxury', 'Men'],
    sizes: [
      { size: '100 ml', price: 375, stock: 30 },
      { size: '20 ml', price: 150, stock: 80 },
    ],
    stock: 30,
    rating: 4.3,
    reviewCount: 11,
  },
  {
    name: 'XP138 Musk Ombre Leather',
    slug: 'xp138-musk-ombre-leather',
    code: 'XP138',
    description: 'Tom Ford Ombre Leather Perfume: The Essence of Rugged Elegance. A bold and masculine fragrance.',
    shortDescription: 'Inspired by Tom Ford Ombre Leather',
    price: 375,
    originalPrice: 499,
    images: ['/images/xp138.jpg'],
    category: 'Inspired Perfumes',
    tags: ['Leather', 'Men'],
    sizes: [
      { size: '100 ml', price: 375, stock: 40 },
      { size: '20 ml', price: 150, stock: 90 },
    ],
    stock: 40,
    rating: 4.6,
    reviewCount: 42,
    bestSeller: true,
  },
  {
    name: 'XP35 Musk Cool Water',
    slug: 'xp35-musk-cool-water',
    code: 'XP35',
    description: 'Davidoff Cool Water Perfume: The Quintessence of Refreshing elegance. A fresh and aquatic fragrance.',
    shortDescription: 'Inspired by Davidoff Cool Water',
    price: 375,
    originalPrice: 499,
    images: ['/images/xp35.jpg'],
    category: 'Inspired Perfumes',
    tags: ['Fresh', 'Men'],
    sizes: [
      { size: '100 ml', price: 375, stock: 60 },
      { size: '20 ml', price: 150, stock: 120 },
    ],
    stock: 60,
    rating: 4.2,
    reviewCount: 21,
  },
  {
    name: 'XP28 Musk Acqua Di Gio',
    slug: 'xp28-musk-acqua-di-gio',
    code: 'XP28',
    description: 'Giorgio Armani Acqua di Gio Perfume: The Essence of Mediterranean Freshness. A timeless classic.',
    shortDescription: 'Inspired by Giorgio Armani Acqua di Gio',
    price: 375,
    originalPrice: 499,
    images: ['/images/xp28.jpg'],
    category: 'Inspired Perfumes',
    tags: ['Fresh', 'Men'],
    sizes: [
      { size: '100 ml', price: 375, stock: 45 },
      { size: '20 ml', price: 150, stock: 100 },
    ],
    stock: 45,
    rating: 4.0,
    reviewCount: 5,
  },
  {
    name: 'XP110 Musk One Million',
    slug: 'xp110-musk-one-million',
    code: 'XP110',
    description: 'Paco Rabanne One Million Perfume: A Fragrance of Opulence and Power. A bold and luxurious scent.',
    shortDescription: 'Inspired by Paco Rabanne One Million',
    price: 375,
    originalPrice: 499,
    images: ['/images/xp110.jpg'],
    category: 'Inspired Perfumes',
    tags: ['Luxury', 'Men'],
    sizes: [
      { size: '100 ml', price: 375, stock: 35 },
      { size: '20 ml', price: 150, stock: 85 },
    ],
    stock: 35,
    rating: 4.1,
    reviewCount: 6,
  },
  {
    name: 'XP126 Musk Flora',
    slug: 'xp126-musk-flora',
    code: 'XP126',
    description: 'Gucci Flora Perfume: A Symphony of Floral Elegance. A timeless and elegant fragrance for women.',
    shortDescription: 'Inspired by Gucci Flora',
    price: 375,
    originalPrice: 499,
    images: ['/images/xp126.jpg'],
    category: 'Inspired Perfumes',
    tags: ['Floral', 'Women'],
    sizes: [
      { size: '100 ml', price: 375, stock: 50 },
      { size: '20 ml', price: 150, stock: 100 },
    ],
    stock: 50,
    rating: 4.4,
    reviewCount: 18,
    bestSeller: true,
  },
  {
    name: 'XP41 Musk Tobacco Vanille',
    slug: 'xp41-musk-tobacco-vanille',
    code: 'XP41',
    description: 'Tom Ford Tobacco Vanille Perfume: A Luxurious Olfactory Experience. A warm and sophisticated fragrance.',
    shortDescription: 'Inspired by Tom Ford Tobacco Vanille',
    price: 375,
    originalPrice: 499,
    images: ['/images/xp41.jpg'],
    category: 'Inspired Perfumes',
    tags: ['Warm', 'Unisex'],
    sizes: [
      { size: '100 ml', price: 375, stock: 30 },
      { size: '20 ml', price: 150, stock: 80 },
    ],
    stock: 30,
    rating: 4.5,
    reviewCount: 11,
  },
  {
    name: 'XP31 Musk Bombshell',
    slug: 'xp31-musk-bombshell',
    code: 'XP31',
    description: 'Victoria\'s Secret Bombshell Perfume: The Essence of Glamour and Allure. A seductive and feminine fragrance.',
    shortDescription: 'Inspired by Victoria\'s Secret Bombshell',
    price: 375,
    originalPrice: 499,
    images: ['/images/xp31.jpg'],
    category: 'Inspired Perfumes',
    tags: ['Floral', 'Women'],
    sizes: [
      { size: '100 ml', price: 375, stock: 40 },
      { size: '20 ml', price: 150, stock: 90 },
    ],
    stock: 40,
    rating: 4.2,
    reviewCount: 3,
  },
  {
    name: 'XP17 Musk Eros',
    slug: 'xp17-musk-eros',
    code: 'XP17',
    description: 'Versace Eros Perfume: The Essence of Passion and Desire. A bold and passionate fragrance.',
    shortDescription: 'Inspired by Versace Eros',
    price: 375,
    originalPrice: 499,
    images: ['/images/xp17.jpg'],
    category: 'Inspired Perfumes',
    tags: ['Bold', 'Men'],
    sizes: [
      { size: '100 ml', price: 375, stock: 45 },
      { size: '20 ml', price: 150, stock: 95 },
    ],
    stock: 45,
    rating: 4.3,
    reviewCount: 10,
  },
  {
    name: 'XP01 Musk Sauvage Elixir',
    slug: 'xp01-musk-sauvage-elixir',
    code: 'XP01',
    description: 'Dior Sauvage Elixir: An intense and powerful fragrance. The ultimate expression of Sauvage.',
    shortDescription: 'Inspired by Dior Sauvage Elixir',
    price: 675,
    originalPrice: 999,
    images: ['/images/xp01.jpg'],
    category: 'Luxe Edition',
    tags: ['Luxury', 'Men'],
    sizes: [
      { size: '100 ml', price: 675, stock: 25 },
      { size: '20 ml', price: 250, stock: 60 },
    ],
    stock: 25,
    rating: 4.8,
    reviewCount: 13,
    featured: true,
  },
];

async function seed() {
  try {
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('Connected to MongoDB');

    // Clear existing products
    await Product.deleteMany({});
    console.log('Cleared existing products');

    // Insert sample products
    await Product.insertMany(sampleProducts);
    console.log(`Inserted ${sampleProducts.length} products`);

    console.log('Database seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
}

seed();

