const mongoose = require('mongoose');
const Product = require('./models/Product');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27018/musk';

const coffeeProducts = [
  {
    name: 'Ethiopian Yirgacheffe - Single Origin',
    slug: 'ethiopian-yirgacheffe-single-origin',
    code: 'CB001',
    description: 'Experience the legendary Ethiopian Yirgacheffe coffee with its distinctive floral and citrus notes. This single-origin coffee is hand-picked and sun-dried, offering a bright, wine-like acidity with a smooth, tea-like body. Perfect for pour-over and drip brewing methods.',
    shortDescription: 'Legendary Ethiopian coffee with floral and citrus notes',
    price: 899,
    originalPrice: 1199,
    images: ['/uploads/ethiopian-yirgacheffe.jpg'],
    category: 'Coffee Beans',
    tags: ['Single Origin', 'Arabica', 'Best Seller'],
    sizes: [
      { size: '250g', price: 899, stock: 50 },
      { size: '500g', price: 1699, stock: 30 },
      { size: '1kg', price: 2999, stock: 20 },
    ],
    stock: 50,
    rating: 4.8,
    reviewCount: 127,
    bestSeller: true,
    featured: true,
    notes: ['Floral', 'Citrus', 'Jasmine', 'Bergamot', 'Tea-like Body'],
  },
  {
    name: 'Colombian Supremo - Medium Roast',
    slug: 'colombian-supremo-medium-roast',
    code: 'CB002',
    description: 'A classic Colombian coffee with balanced flavor profile. Medium roast brings out notes of caramel, nuts, and a hint of apple. Smooth and well-rounded, this is our most popular blend. Ideal for espresso and French press.',
    shortDescription: 'Classic Colombian with caramel and nutty notes',
    price: 799,
    originalPrice: 999,
    images: ['/uploads/colombian-supremo.jpg'],
    category: 'Coffee Beans',
    tags: ['Arabica', 'Medium Roast', 'Best Seller'],
    sizes: [
      { size: '250g', price: 799, stock: 60 },
      { size: '500g', price: 1499, stock: 40 },
      { size: '1kg', price: 2699, stock: 25 },
    ],
    stock: 60,
    rating: 4.7,
    reviewCount: 203,
    bestSeller: true,
    notes: ['Caramel', 'Nuts', 'Apple', 'Balanced', 'Smooth'],
  },
  {
    name: 'Italian Espresso Blend - Dark Roast',
    slug: 'italian-espresso-blend-dark-roast',
    code: 'CB003',
    description: 'Bold and intense Italian-style espresso blend. Dark roasted to perfection, delivering rich chocolate notes with a creamy crema. Perfect for espresso machines and strong coffee lovers. Full-bodied with low acidity.',
    shortDescription: 'Bold Italian-style espresso with rich chocolate notes',
    price: 849,
    originalPrice: 1099,
    images: ['/uploads/italian-espresso.jpg'],
    category: 'Coffee Beans',
    tags: ['Dark Roast', 'Espresso', 'Blend'],
    sizes: [
      { size: '250g', price: 849, stock: 45 },
      { size: '500g', price: 1599, stock: 35 },
      { size: '1kg', price: 2899, stock: 20 },
    ],
    stock: 45,
    rating: 4.6,
    reviewCount: 89,
    notes: ['Chocolate', 'Creamy', 'Bold', 'Full-bodied', 'Low Acidity'],
  },
  {
    name: 'Kenyan AA - Single Origin',
    slug: 'kenyan-aa-single-origin',
    code: 'CB004',
    description: 'Premium Kenyan AA grade coffee with bright, wine-like acidity and blackcurrant notes. This high-altitude coffee offers a complex flavor profile with hints of grapefruit and a clean finish. Excellent for pour-over brewing.',
    shortDescription: 'Premium Kenyan AA with bright acidity and blackcurrant notes',
    price: 949,
    originalPrice: 1299,
    images: ['/uploads/kenyan-aa.jpg'],
    category: 'Coffee Beans',
    tags: ['Single Origin', 'Arabica', 'New Arrival'],
    sizes: [
      { size: '250g', price: 949, stock: 40 },
      { size: '500g', price: 1799, stock: 25 },
      { size: '1kg', price: 3199, stock: 15 },
    ],
    stock: 40,
    rating: 4.9,
    reviewCount: 56,
    newArrival: true,
    featured: true,
    notes: ['Blackcurrant', 'Grapefruit', 'Wine-like', 'Bright', 'Clean Finish'],
  },
  {
    name: 'Sumatran Mandheling - Dark Roast',
    slug: 'sumatran-mandheling-dark-roast',
    code: 'CB005',
    description: 'Exotic Indonesian coffee with earthy, spicy notes and low acidity. Full-bodied with hints of dark chocolate and herbs. This dark roast is perfect for those who prefer bold, intense flavors. Great for French press and cold brew.',
    shortDescription: 'Exotic Indonesian coffee with earthy and spicy notes',
    price: 799,
    originalPrice: 999,
    images: ['/uploads/sumatran-mandheling.jpg'],
    category: 'Coffee Beans',
    tags: ['Dark Roast', 'Single Origin', 'Robusta'],
    sizes: [
      { size: '250g', price: 799, stock: 50 },
      { size: '500g', price: 1499, stock: 30 },
      { size: '1kg', price: 2699, stock: 20 },
    ],
    stock: 50,
    rating: 4.5,
    reviewCount: 78,
    notes: ['Earthy', 'Spicy', 'Dark Chocolate', 'Herbs', 'Full-bodied'],
  },
  {
    name: 'House Blend - Medium Dark Roast',
    slug: 'house-blend-medium-dark-roast',
    code: 'CB006',
    description: 'Our signature house blend combining the best of multiple origins. Balanced flavor with notes of chocolate, caramel, and a hint of fruit. Versatile and smooth, perfect for any brewing method. Great for daily drinking.',
    shortDescription: 'Signature blend with chocolate, caramel, and fruity notes',
    price: 699,
    originalPrice: 899,
    images: ['/uploads/house-blend.jpg'],
    category: 'Coffee Beans',
    tags: ['Blend', 'Medium Dark', 'Best Seller'],
    sizes: [
      { size: '250g', price: 699, stock: 70 },
      { size: '500g', price: 1299, stock: 50 },
      { size: '1kg', price: 2399, stock: 30 },
    ],
    stock: 70,
    rating: 4.6,
    reviewCount: 312,
    bestSeller: true,
    notes: ['Chocolate', 'Caramel', 'Fruity', 'Balanced', 'Smooth'],
  },
  {
    name: 'Ground Coffee - Colombian Medium',
    slug: 'ground-coffee-colombian-medium',
    code: 'GC001',
    description: 'Pre-ground Colombian coffee, medium grind perfect for drip coffee makers and pour-over. Same great Colombian flavor, ready to brew. Convenient and fresh, ground to order.',
    shortDescription: 'Pre-ground Colombian coffee, medium grind',
    price: 649,
    originalPrice: 799,
    images: ['/uploads/ground-colombian.jpg'],
    category: 'Ground Coffee',
    tags: ['Ground', 'Medium Grind', 'Convenient'],
    sizes: [
      { size: '250g', price: 649, stock: 80 },
      { size: '500g', price: 1199, stock: 60 },
    ],
    stock: 80,
    rating: 4.4,
    reviewCount: 145,
    notes: ['Colombian', 'Medium Grind', 'Drip Coffee', 'Pour-over'],
  },
  {
    name: 'Coffee Pods - Espresso Blend (10 Pack)',
    slug: 'coffee-pods-espresso-blend',
    code: 'CP001',
    description: 'Compatible coffee pods for Nespresso machines. Rich espresso blend in convenient pod format. Each pod contains 5g of premium coffee. Pack of 10 pods.',
    shortDescription: 'Nespresso-compatible espresso pods, pack of 10',
    price: 399,
    originalPrice: 499,
    images: ['/uploads/coffee-pods.jpg'],
    category: 'Coffee Pods',
    tags: ['Pods', 'Nespresso', 'Convenient'],
    sizes: [
      { size: '10 Pods', price: 399, stock: 100 },
      { size: '20 Pods', price: 749, stock: 80 },
      { size: '50 Pods', price: 1799, stock: 50 },
    ],
    stock: 100,
    rating: 4.5,
    reviewCount: 234,
    notes: ['Espresso', 'Nespresso Compatible', 'Convenient', 'Rich'],
  },
  {
    name: 'Premium Coffee Gift Set',
    slug: 'premium-coffee-gift-set',
    code: 'GS001',
    description: 'Perfect gift for coffee lovers! Includes 3 premium coffee varieties (250g each), a ceramic coffee mug, and a coffee scoop. Beautifully packaged in an elegant gift box.',
    shortDescription: 'Gift set with 3 coffee varieties, mug, and scoop',
    price: 2499,
    originalPrice: 3299,
    images: ['/uploads/gift-set.jpg'],
    category: 'Gift Sets',
    tags: ['Gift', 'Set', 'Premium'],
    sizes: [
      { size: 'Standard', price: 2499, stock: 30 },
    ],
    stock: 30,
    rating: 4.8,
    reviewCount: 67,
    featured: true,
    notes: ['Gift Set', '3 Varieties', 'Mug Included', 'Elegant Packaging'],
  },
  {
    name: 'Brazilian Santos - Light Roast',
    slug: 'brazilian-santos-light-roast',
    code: 'CB007',
    description: 'Smooth and mild Brazilian coffee with nutty and chocolate notes. Light roast preserves the natural sweetness. Low acidity, perfect for those who prefer milder coffee. Great for cold brew and iced coffee.',
    shortDescription: 'Smooth Brazilian coffee with nutty and chocolate notes',
    price: 749,
    originalPrice: 949,
    images: ['/uploads/brazilian-santos.jpg'],
    category: 'Coffee Beans',
    tags: ['Light Roast', 'Arabica', 'Mild'],
    sizes: [
      { size: '250g', price: 749, stock: 55 },
      { size: '500g', price: 1399, stock: 35 },
      { size: '1kg', price: 2499, stock: 25 },
    ],
    stock: 55,
    rating: 4.5,
    reviewCount: 92,
    notes: ['Nutty', 'Chocolate', 'Sweet', 'Mild', 'Low Acidity'],
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

    // Insert coffee products
    await Product.insertMany(coffeeProducts);
    console.log(`Inserted ${coffeeProducts.length} coffee products`);

    console.log('Database seeded successfully with coffee products!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
}

seed();

