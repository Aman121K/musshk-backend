const xlsx = require('xlsx');
const mongoose = require('mongoose');
const Product = require('./models/Product');
const path = require('path');
require('dotenv').config();

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27018/musk';

mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('MongoDB Connected'))
.catch((err) => {
  console.error('MongoDB connection error:', err);
  process.exit(1);
});

// Helper function to get value from row with multiple possible column names (case-insensitive)
const getValue = (row, ...keys) => {
  for (const key of keys) {
    // Try exact match first
    if (row[key] !== undefined && row[key] !== null && row[key] !== '') {
      return row[key];
    }
    // Try case-insensitive match
    const lowerKey = key.toLowerCase();
    for (const rowKey of Object.keys(row)) {
      if (rowKey.toLowerCase() === lowerKey) {
        return row[rowKey];
      }
    }
  }
  return '';
};

async function importExcelFile(filePath) {
  try {
    console.log(`Reading Excel file: ${filePath}`);
    const workbook = xlsx.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(worksheet);

    console.log(`Found ${data.length} rows in Excel file`);
    console.log('Sample columns:', Object.keys(data[0] || {}));

    const products = [];
    const errors = [];

    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      try {
        // Map Excel columns to product fields (handling the actual column names from the file)
        const name = getValue(row, 'Product Title', 'Product Name', 'Name', 'Product', 'Title');
        const code = getValue(row, 'SKU', 'Product Code', 'Code', 'Item Code') || `PROD${Date.now()}${i}`;
        
        if (!name || !code) {
          errors.push(`Row ${i + 2}: Missing required fields (Name: ${name}, Code: ${code})`);
          continue;
        }

        // Build description from multiple fields
        const description = getValue(row, 'Product description ', 'Product description', 'Description', 'Product Description', 'Full Description') || '';
        const bulletPoints = [
          getValue(row, 'Bullet point 1'),
          getValue(row, 'Bullet point 2'),
          getValue(row, 'Bullet point 3'),
          getValue(row, 'Bullet point 4'),
          getValue(row, 'Bullet point 5'),
          getValue(row, 'Bullet point 6'),
        ].filter(bp => bp && bp.trim()).map(bp => `• ${bp.trim()}`).join('\n');
        
        const fullDescription = [description, bulletPoints].filter(d => d).join('\n\n');

        // Build tags from various fields
        const tags = [];
        const targetAudience = getValue(row, 'Target Audience');
        const specialFeatures = getValue(row, 'Special Features');
        const scent = getValue(row, 'Scent');
        const brand = getValue(row, 'Brand name ', 'Brand name', 'Brand');
        
        if (targetAudience) tags.push(...String(targetAudience).split(',').map(t => t.trim()));
        if (specialFeatures) tags.push(...String(specialFeatures).split(',').map(t => t.trim()));
        if (scent) tags.push(...String(scent).split(',').map(t => t.trim()));
        if (brand) tags.push(String(brand).trim());

        const product = {
          name: String(name).trim(),
          code: String(code).trim(),
          slug: (getValue(row, 'Slug') || name || '').toString().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
          description: fullDescription.trim() || String(description).trim(),
          shortDescription: String(getValue(row, 'Short Description', 'Short Desc', 'Summary') || description.substring(0, 150) || '').trim(),
          price: parseFloat(getValue(row, 'MRP (Price)', 'Price', 'Sale Price', 'Selling Price', 'MRP') || 0),
          originalPrice: getValue(row, 'Original Price', 'List Price', 'Regular Price') ? parseFloat(getValue(row, 'Original Price', 'List Price', 'Regular Price')) : undefined,
          category: (() => {
            const cat = String(getValue(row, 'Category of Product ', 'Category of Product', 'Category', 'Product Category') || 'Inspired Perfumes').trim();
            // Map common categories
            if (cat.toLowerCase() === 'beauty') return 'Inspired Perfumes';
            return cat;
          })(),
          tags: tags.length > 0 ? tags : (getValue(row, 'Tags', 'Tag') ? String(getValue(row, 'Tags', 'Tag')).split(',').map(t => t.trim()).filter(t => t) : []),
          stock: parseInt(getValue(row, 'Stock', 'Quantity', 'Qty', 'Available Stock') || 100),
          rating: parseFloat(getValue(row, 'Rating', 'Product Rating', 'Stars') || 0),
          reviewCount: parseInt(getValue(row, 'Review Count', 'Reviews', 'Number of Reviews') || 0),
          featured: ['Yes', 'TRUE', 'true', true, 1, '1'].includes(getValue(row, 'Featured', 'Is Featured')),
          bestSeller: ['Yes', 'TRUE', 'true', true, 1, '1'].includes(getValue(row, 'Best Seller', 'BestSeller', 'Bestseller')),
          newArrival: ['Yes', 'TRUE', 'true', true, 1, '1'].includes(getValue(row, 'New Arrival', 'NewArrival', 'New')),
          notes: getValue(row, 'Scent', 'Notes', 'Fragrance Notes', 'Scent Notes') ? String(getValue(row, 'Scent', 'Notes', 'Fragrance Notes', 'Scent Notes')).split(',').map(n => n.trim()).filter(n => n) : [],
          images: [],
          sizes: [],
        };

        // Handle images - check for Image 1, Image 2, etc.
        const images = [];
        for (let imgNum = 1; imgNum <= 10; imgNum++) {
          const imgKey = `Image ${imgNum} `;
          const imgKeyAlt = `Image ${imgNum}`;
          const imgValue = getValue(row, imgKey, imgKeyAlt, `Image${imgNum}`, `Image_${imgNum}`);
          if (imgValue && imgValue.trim()) {
            images.push(String(imgValue).trim());
          }
        }
        
        // Also check for comma-separated images
        if (images.length === 0) {
          const imagesValue = getValue(row, 'Images', 'Image', 'Image URLs', 'Image URL', 'Picture', 'Pictures');
          if (imagesValue) {
            if (typeof imagesValue === 'string') {
              images.push(...String(imagesValue).split(',').map(img => img.trim()).filter(img => img));
            } else if (Array.isArray(imagesValue)) {
              images.push(...imagesValue.map(img => String(img).trim()).filter(img => img));
            } else {
              images.push(String(imagesValue).trim());
            }
          }
        }
        product.images = images;

        // Handle sizes if provided
        const sizesValue = getValue(row, 'Size (L, M, S, XL)', 'Sizes', 'Size');
        if (sizesValue) {
          const sizes = String(sizesValue).split(',').map(s => s.trim());
          sizes.forEach(size => {
            const sizePrice = getValue(row, `${size} Price`, 'Price') || product.price;
            product.sizes.push({
              size: size,
              price: parseFloat(sizePrice),
              stock: parseInt(getValue(row, `${size} Stock`, 'Stock') || product.stock),
            });
          });
        } else {
          // Default sizes if none provided
          product.sizes = [
            { size: '100 ml', price: product.price, stock: product.stock },
            { size: '20 ml', price: product.price * 0.4, stock: product.stock },
          ];
        }

        // Generate slug if not provided or empty
        if (!product.slug) {
          product.slug = product.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
        }

        products.push(product);
        console.log(`✓ Processed: ${product.name} (${product.code})`);
      } catch (error) {
        errors.push(`Row ${i + 2}: ${error.message}`);
        console.error(`✗ Error in row ${i + 2}:`, error.message);
      }
    }

    console.log(`\nProcessing ${products.length} products...`);

    // Insert products
    const inserted = [];
    const failed = [];

    for (const product of products) {
      try {
        // Check if product already exists
        const existing = await Product.findOne({ $or: [{ code: product.code }, { slug: product.slug }] });
        if (existing) {
          // Update existing product
          await Product.findByIdAndUpdate(existing._id, product, { new: true });
          inserted.push({ code: product.code, name: product.name, action: 'updated' });
          console.log(`  ↻ Updated: ${product.name}`);
        } else {
          // Create new product
          const newProduct = new Product(product);
          await newProduct.save();
          inserted.push({ code: product.code, name: product.name, action: 'created' });
          console.log(`  + Created: ${product.name}`);
        }
      } catch (error) {
        failed.push({ code: product.code, name: product.name, error: error.message });
        console.error(`  ✗ Failed: ${product.name} - ${error.message}`);
      }
    }

    console.log('\n=== Import Summary ===');
    console.log(`Total rows: ${data.length}`);
    console.log(`Successfully imported: ${inserted.length}`);
    console.log(`Failed: ${failed.length}`);
    if (errors.length > 0) {
      console.log(`\nErrors:`);
      errors.forEach(err => console.log(`  - ${err}`));
    }
    if (failed.length > 0) {
      console.log(`\nFailed Products:`);
      failed.forEach(f => console.log(`  - ${f.name} (${f.code}): ${f.error}`));
    }

    await mongoose.connection.close();
    console.log('\n✓ Import completed!');
    process.exit(0);
  } catch (error) {
    console.error('Error importing Excel file:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
}

// Get file path from command line argument or use default
const filePath = process.argv[2] || path.join(__dirname, '../Amazon listing file .xlsx');

importExcelFile(filePath);

