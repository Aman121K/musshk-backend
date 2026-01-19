const mongoose = require('mongoose');
const Product = require('./models/Product');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27018/musk';

const perfumeProducts = [
  {
    name: 'XP12 Musk Sauvage',
    slug: 'xp12-musk-sauvage',
    code: 'XP12',
    description: 'Dior Sauvage Perfume: The Pinnacle of Luxury Fragrance. A legendary fragrance inspired by the wild beauty of nature. This bold and fresh fragrance opens with Calabrian bergamot and pepper, leading to a heart of lavender and pink pepper, finishing with vetiver and ambroxan. Perfect for the modern man who appreciates sophistication and elegance.',
    shortDescription: 'Inspired by Dior Sauvage - Bold and fresh',
    price: 375,
    originalPrice: 499,
    images: ['/uploads/xp12-sauvage.jpg'],
    category: 'Inspired Perfumes',
    tags: ['Best Seller', 'Men', 'Fresh'],
    sizes: [
      { size: '100 ml', price: 375, stock: 50 },
      { size: '20 ml', price: 150, stock: 100 },
    ],
    stock: 50,
    rating: 4.5,
    reviewCount: 35,
    bestSeller: true,
    featured: true,
    notes: ['Calabrian Bergamot', 'Pepper', 'Sichuan pepper', 'Lavender', 'Pink Pepper', 'Vetiver'],
  },
  {
    name: 'XP21 Musk Av3ntus',
    slug: 'xp21-musk-av3ntus',
    code: 'XP21',
    description: 'Creed Aventus Perfume: The Pinnacle of Luxury Fragrance. A legendary fragrance that embodies sophistication and elegance. Inspired by the dramatic life of a historic emperor, this fragrance features pineapple, blackcurrant, apple, and bergamot in the top notes, with a heart of rose, jasmine, and patchouli, finishing with musk, oakmoss, and ambergris.',
    shortDescription: 'Inspired by Creed Aventus - Sophisticated and elegant',
    price: 375,
    originalPrice: 499,
    images: ['/uploads/xp21-aventus.jpg'],
    category: 'Inspired Perfumes',
    tags: ['Best Seller', 'Men', 'Luxury'],
    sizes: [
      { size: '100 ml', price: 375, stock: 50 },
      { size: '20 ml', price: 150, stock: 100 },
    ],
    stock: 50,
    rating: 4.7,
    reviewCount: 33,
    bestSeller: true,
    featured: true,
    notes: ['Pineapple', 'Blackcurrant', 'Bergamot', 'Rose', 'Jasmine', 'Musk'],
  },
  {
    name: 'XP43 Musk Oud Wood',
    slug: 'xp43-musk-oud-wood',
    code: 'XP43',
    description: 'Tom Ford Oud Wood Parfum: A Luxurious Exploration of Exotic Elegance. A sophisticated blend of oud and wood notes that creates an intoxicating and mysterious fragrance. Features rosewood, cardamom, and oud in the opening, with a heart of sandalwood and vetiver, finishing with tonka bean and amber.',
    shortDescription: 'Inspired by Tom Ford Oud Wood - Exotic and elegant',
    price: 375,
    originalPrice: 499,
    images: ['/uploads/xp43-oud-wood.jpg'],
    category: 'Inspired Perfumes',
    tags: ['Luxury', 'Men', 'Woody'],
    sizes: [
      { size: '100 ml', price: 375, stock: 30 },
      { size: '20 ml', price: 150, stock: 80 },
    ],
    stock: 30,
    rating: 4.3,
    reviewCount: 11,
    notes: ['Rosewood', 'Cardamom', 'Oud', 'Sandalwood', 'Vetiver', 'Amber'],
  },
  {
    name: 'XP138 Musk Ombre Leather',
    slug: 'xp138-musk-ombre-leather',
    code: 'XP138',
    description: 'Tom Ford Ombre Leather Perfume: The Essence of Rugged Elegance. A bold and masculine fragrance that captures the essence of luxury leather. Opens with cardamom and jasmine, leading to a heart of leather and patchouli, finishing with amber and white moss. Perfect for the confident man.',
    shortDescription: 'Inspired by Tom Ford Ombre Leather - Bold and masculine',
    price: 375,
    originalPrice: 499,
    images: ['/uploads/xp138-ombre-leather.jpg'],
    category: 'Inspired Perfumes',
    tags: ['Leather', 'Men', 'Bold'],
    sizes: [
      { size: '100 ml', price: 375, stock: 40 },
      { size: '20 ml', price: 150, stock: 90 },
    ],
    stock: 40,
    rating: 4.6,
    reviewCount: 42,
    bestSeller: true,
    notes: ['Cardamom', 'Jasmine', 'Leather', 'Patchouli', 'Amber'],
  },
  {
    name: 'XP35 Musk Cool Water',
    slug: 'xp35-musk-cool-water',
    code: 'XP35',
    description: 'Davidoff Cool Water Perfume: The Quintessence of Refreshing elegance. A fresh and aquatic fragrance that evokes the power and beauty of the ocean. Features mint, green notes, and lavender in the opening, with a heart of jasmine and neroli, finishing with sandalwood and amber.',
    shortDescription: 'Inspired by Davidoff Cool Water - Fresh and aquatic',
    price: 375,
    originalPrice: 499,
    images: ['/uploads/xp35-cool-water.jpg'],
    category: 'Inspired Perfumes',
    tags: ['Fresh', 'Men', 'Aquatic'],
    sizes: [
      { size: '100 ml', price: 375, stock: 60 },
      { size: '20 ml', price: 150, stock: 120 },
    ],
    stock: 60,
    rating: 4.2,
    reviewCount: 21,
    notes: ['Mint', 'Green Notes', 'Lavender', 'Jasmine', 'Neroli', 'Sandalwood'],
  },
  {
    name: 'XP28 Musk Acqua Di Gio',
    slug: 'xp28-musk-acqua-di-gio',
    code: 'XP28',
    description: 'Giorgio Armani Acqua di Gio Perfume: The Essence of Mediterranean Freshness. A timeless classic that captures the essence of the Mediterranean sea. Features marine notes, mandarin, and bergamot in the opening, with a heart of jasmine and rosemary, finishing with patchouli and white musk.',
    shortDescription: 'Inspired by Giorgio Armani Acqua di Gio - Mediterranean freshness',
    price: 375,
    originalPrice: 499,
    images: ['/uploads/xp28-acqua-di-gio.jpg'],
    category: 'Inspired Perfumes',
    tags: ['Fresh', 'Men', 'Classic'],
    sizes: [
      { size: '100 ml', price: 375, stock: 45 },
      { size: '20 ml', price: 150, stock: 100 },
    ],
    stock: 45,
    rating: 4.0,
    reviewCount: 5,
    notes: ['Marine Notes', 'Mandarin', 'Bergamot', 'Jasmine', 'Rosemary'],
  },
  {
    name: 'XP110 Musk One Million',
    slug: 'xp110-musk-one-million',
    code: 'XP110',
    description: 'Paco Rabanne One Million Perfume: A Fragrance of Opulence and Power. A bold and luxurious scent that exudes confidence and success. Opens with blood mandarin, grapefruit, and mint, leading to a heart of rose, cinnamon, and spice, finishing with leather, amber, and white wood.',
    shortDescription: 'Inspired by Paco Rabanne One Million - Opulent and powerful',
    price: 375,
    originalPrice: 499,
    images: ['/uploads/xp110-one-million.jpg'],
    category: 'Inspired Perfumes',
    tags: ['Luxury', 'Men', 'Bold'],
    sizes: [
      { size: '100 ml', price: 375, stock: 35 },
      { size: '20 ml', price: 150, stock: 85 },
    ],
    stock: 35,
    rating: 4.1,
    reviewCount: 6,
    notes: ['Blood Mandarin', 'Grapefruit', 'Mint', 'Rose', 'Cinnamon', 'Leather'],
  },
  {
    name: 'XP126 Musk Flora',
    slug: 'xp126-musk-flora',
    code: 'XP126',
    description: 'Gucci Flora Perfume: A Symphony of Floral Elegance. A timeless and elegant fragrance for women that celebrates the beauty of flowers. Features citrus and peony in the opening, with a heart of rose and osmanthus, finishing with sandalwood and patchouli.',
    shortDescription: 'Inspired by Gucci Flora - Floral elegance',
    price: 375,
    originalPrice: 499,
    images: ['/uploads/xp126-flora.jpg'],
    category: 'Inspired Perfumes',
    tags: ['Floral', 'Women', 'Elegant'],
    sizes: [
      { size: '100 ml', price: 375, stock: 50 },
      { size: '20 ml', price: 150, stock: 100 },
    ],
    stock: 50,
    rating: 4.4,
    reviewCount: 18,
    bestSeller: true,
    notes: ['Citrus', 'Peony', 'Rose', 'Osmanthus', 'Sandalwood'],
  },
  {
    name: 'XP41 Musk Tobacco Vanille',
    slug: 'xp41-musk-tobacco-vanille',
    code: 'XP41',
    description: 'Tom Ford Tobacco Vanille Perfume: A Luxurious Olfactory Experience. A warm and sophisticated fragrance that combines the richness of tobacco with the sweetness of vanilla. Features tobacco leaf, spices, and tonka bean in the opening, with a heart of vanilla and cacao, finishing with dried fruits and honey.',
    shortDescription: 'Inspired by Tom Ford Tobacco Vanille - Warm and sophisticated',
    price: 375,
    originalPrice: 499,
    images: ['/uploads/xp41-tobacco-vanille.jpg'],
    category: 'Inspired Perfumes',
    tags: ['Warm', 'Unisex', 'Luxury'],
    sizes: [
      { size: '100 ml', price: 375, stock: 30 },
      { size: '20 ml', price: 150, stock: 80 },
    ],
    stock: 30,
    rating: 4.5,
    reviewCount: 11,
    notes: ['Tobacco Leaf', 'Spices', 'Vanilla', 'Cacao', 'Tonka Bean'],
  },
  {
    name: 'XP31 Musk Bombshell',
    slug: 'xp31-musk-bombshell',
    code: 'XP31',
    description: 'Victoria\'s Secret Bombshell Perfume: The Essence of Glamour and Allure. A seductive and feminine fragrance that embodies confidence and sensuality. Features passion fruit, grapefruit, and tangerine in the opening, with a heart of jasmine, lily-of-the-valley, and red berries, finishing with musk, vanilla, and woody notes.',
    shortDescription: 'Inspired by Victoria\'s Secret Bombshell - Glamorous and alluring',
    price: 375,
    originalPrice: 499,
    images: ['/uploads/xp31-bombshell.jpg'],
    category: 'Inspired Perfumes',
    tags: ['Floral', 'Women', 'Fruity'],
    sizes: [
      { size: '100 ml', price: 375, stock: 40 },
      { size: '20 ml', price: 150, stock: 90 },
    ],
    stock: 40,
    rating: 4.2,
    reviewCount: 3,
    notes: ['Passion Fruit', 'Grapefruit', 'Jasmine', 'Red Berries', 'Musk'],
  },
  {
    name: 'XP17 Musk Eros',
    slug: 'xp17-musk-eros',
    code: 'XP17',
    description: 'Versace Eros Perfume: The Essence of Passion and Desire. A bold and passionate fragrance that captures the spirit of love and desire. Features mint, green apple, and lemon in the opening, with a heart of tonka bean, ambroxan, and geranium, finishing with vanilla, vetiver, and oakmoss.',
    shortDescription: 'Inspired by Versace Eros - Passionate and bold',
    price: 375,
    originalPrice: 499,
    images: ['/uploads/xp17-eros.jpg'],
    category: 'Inspired Perfumes',
    tags: ['Bold', 'Men', 'Fresh'],
    sizes: [
      { size: '100 ml', price: 375, stock: 45 },
      { size: '20 ml', price: 150, stock: 95 },
    ],
    stock: 45,
    rating: 4.3,
    reviewCount: 10,
    notes: ['Mint', 'Green Apple', 'Lemon', 'Tonka Bean', 'Vanilla'],
  },
  {
    name: 'XP01 Musk Sauvage Elixir',
    slug: 'xp01-musk-sauvage-elixir',
    code: 'XP01',
    description: 'Dior Sauvage Elixir: An intense and powerful fragrance. The ultimate expression of Sauvage with enhanced concentration and longevity. Features bergamot, lavender, and spices in the opening, with a heart of licorice and patchouli, finishing with ambroxan and vanilla.',
    shortDescription: 'Inspired by Dior Sauvage Elixir - Intense and powerful',
    price: 675,
    originalPrice: 999,
    images: ['/uploads/xp01-sauvage-elixir.jpg'],
    category: 'Luxe Edition',
    tags: ['Luxury', 'Men', 'Intense'],
    sizes: [
      { size: '100 ml', price: 675, stock: 25 },
      { size: '20 ml', price: 250, stock: 60 },
    ],
    stock: 25,
    rating: 4.8,
    reviewCount: 13,
    featured: true,
    notes: ['Bergamot', 'Lavender', 'Spices', 'Licorice', 'Ambroxan'],
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

    // Insert perfume products
    await Product.insertMany(perfumeProducts);
    console.log(`Inserted ${perfumeProducts.length} perfume products`);

    console.log('Database seeded successfully with perfume products!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
}

seed();

