const mongoose = require('mongoose');
const Product = require('../models/product');
require('dotenv').config();

const demoProducts = [
  // Laptops
  {
    name: 'Dell XPS 15 (2023)',
    slug: 'dell-xps-15-2023',
    description: `The Dell XPS 15 (2023) is a high-performance laptop designed for professionals and content creators. 
    Featuring the latest Intel Core i7 processor, NVIDIA GeForce RTX graphics, and a stunning 15.6-inch 4K OLED display, 
    this laptop delivers exceptional performance and visual clarity for demanding tasks.`,
    price: 42990000,
    discountPrice: 39990000,
    category: 'laptop',
    subcategory: 'premium',
    brand: 'Dell',
    stock: 15,
    images: laptop01.png,
    specifications: [
      { name: 'Processor', value: 'Intel Core i7-13700H' },
      { name: 'RAM', value: '16GB DDR5' },
      { name: 'Storage', value: '512GB SSD' },
      { name: 'Display', value: '15.6-inch 4K OLED' },
      { name: 'Graphics', value: 'NVIDIA GeForce RTX 4060' },
      { name: 'Battery', value: '86Whr' }
    ],
    variants: [
      {
        name: 'Storage',
        options: [
          { value: '512GB', additionalPrice: 0, stock: 10 },
          { value: '1TB', additionalPrice: 5000000, stock: 5 }
        ]
      },
      {
        name: 'RAM',
        options: [
          { value: '16GB', additionalPrice: 0, stock: 8 },
          { value: '32GB', additionalPrice: 4000000, stock: 7 }
        ]
      }
    ],
    featured: true
  },
  {
    name: 'Lenovo ThinkPad X1 Carbon',
    slug: 'lenovo-thinkpad-x1-carbon',
    description: `The ThinkPad X1 Carbon is Lenovo's flagship business laptop, renowned for its durability, 
    security features, and exceptional keyboard. Perfect for business professionals who need a reliable, 
    lightweight machine for productivity on the go.`,
    price: 36990000,
    discountPrice: null,
    category: 'laptop',
    subcategory: 'business',
    brand: 'Lenovo',
    stock: 20,
    images: ['default-laptop.jpg'],
    specifications: [
      { name: 'Processor', value: 'Intel Core i5-1135G7' },
      { name: 'RAM', value: '16GB LPDDR4X' },
      { name: 'Storage', value: '512GB SSD' },
      { name: 'Display', value: '14-inch FHD+ IPS' },
      { name: 'Graphics', value: 'Intel Iris Xe' },
      { name: 'Battery', value: '57Whr' }
    ],
    variants: [
      {
        name: 'Processor',
        options: [
          { value: 'i5-1135G7', additionalPrice: 0, stock: 12 },
          { value: 'i7-1165G7', additionalPrice: 3000000, stock: 8 }
        ]
      }
    ],
    featured: false
  },
  
  // Desktop PCs
  {
    name: 'CyberPower Gamer Supreme Gaming PC',
    slug: 'cyberpower-gamer-supreme',
    description: `The CyberPower Gamer Supreme is a high-performance gaming desktop designed to deliver 
    exceptional gaming experiences. With powerful components and advanced cooling, this PC can handle 
    the most demanding games at high settings.`,
    price: 45990000,
    discountPrice: 42990000,
    category: 'pc',
    subcategory: 'gaming',
    brand: 'CyberPower',
    stock: 10,
    images: ['default-pc.jpg'],
    specifications: [
      { name: 'Processor', value: 'AMD Ryzen 7 5800X' },
      { name: 'RAM', value: '32GB DDR4' },
      { name: 'Storage', value: '1TB NVMe SSD + 2TB HDD' },
      { name: 'Graphics', value: 'NVIDIA GeForce RTX 3080' },
      { name: 'Power Supply', value: '750W Gold' },
      { name: 'Case', value: 'NZXT H510' }
    ],
    variants: [
      {
        name: 'Graphics Card',
        options: [
          { value: 'RTX 3080', additionalPrice: 0, stock: 5 },
          { value: 'RTX 3090', additionalPrice: 10000000, stock: 5 }
        ]
      }
    ],
    featured: true
  },
  
  // Monitors
  {
    name: 'LG UltraGear 27GP850-B',
    slug: 'lg-ultragear-27gp850',
    description: `The LG UltraGear 27GP850-B is a high-performance gaming monitor with a 27-inch Nano IPS 
    display, QHD resolution, and a 165Hz refresh rate. It's perfect for competitive gamers who need 
    fast response times and smooth gameplay.`,
    price: 9990000,
    discountPrice: 8990000,
    category: 'monitor',
    subcategory: 'gaming',
    brand: 'LG',
    stock: 25,
    images: ['default-monitor.jpg'],
    specifications: [
      { name: 'Screen Size', value: '27-inch' },
      { name: 'Resolution', value: '2560 x 1440 (QHD)' },
      { name: 'Panel Type', value: 'Nano IPS' },
      { name: 'Refresh Rate', value: '165Hz' },
      { name: 'Response Time', value: '1ms (GtG)' },
      { name: 'HDR Support', value: 'HDR10' }
    ],
    featured: true
  },
  
  // Components
  {
    name: 'Samsung 970 EVO Plus 1TB NVMe SSD',
    slug: 'samsung-970-evo-plus-1tb',
    description: `The Samsung 970 EVO Plus is a high-performance NVMe SSD that delivers blazing-fast 
    read and write speeds. With its V-NAND technology and optimized controller, it's perfect for 
    gamers, content creators, and professionals who need quick access to large files.`,
    price: 3290000,
    discountPrice: 2990000,
    category: 'component',
    subcategory: 'storage',
    brand: 'Samsung',
    stock: 50,
    images: ['default-ssd.jpg'],
    specifications: [
      { name: 'Capacity', value: '1TB' },
      { name: 'Interface', value: 'PCIe Gen 3.0 x4, NVMe 1.3' },
      { name: 'Sequential Read', value: 'Up to 3,500 MB/s' },
      { name: 'Sequential Write', value: 'Up to 3,300 MB/s' },
      { name: 'Form Factor', value: 'M.2 2280' },
      { name: 'Warranty', value: '5 Years Limited' }
    ],
    variants: [
      {
        name: 'Capacity',
        options: [
          { value: '250GB', additionalPrice: -1500000, stock: 15 },
          { value: '500GB', additionalPrice: -800000, stock: 20 },
          { value: '1TB', additionalPrice: 0, stock: 10 },
          { value: '2TB', additionalPrice: 3000000, stock: 5 }
        ]
      }
    ],
    featured: false
  },
  {
    name: 'AMD Ryzen 7 5800X',
    slug: 'amd-ryzen-7-5800x',
    description: `The AMD Ryzen 7 5800X is an 8-core, 16-thread processor built on the Zen 3 architecture. 
    With high single-core and multi-core performance, it's an excellent choice for gaming and 
    content creation tasks.`,
    price: 8490000,
    discountPrice: null,
    category: 'component',
    subcategory: 'cpu',
    brand: 'AMD',
    stock: 30,
    images: ['default-cpu.jpg'],
    specifications: [
      { name: 'Cores/Threads', value: '8/16' },
      { name: 'Base Clock', value: '3.8GHz' },
      { name: 'Boost Clock', value: 'Up to 4.7GHz' },
      { name: 'TDP', value: '105W' },
      { name: 'Cache', value: '36MB (total)' },
      { name: 'Socket', value: 'AM4' }
    ],
    featured: true
  },
  
  // Accessories
  {
    name: 'Logitech G Pro X Mechanical Keyboard',
    slug: 'logitech-g-pro-x-keyboard',
    description: `The Logitech G Pro X is a tournament-grade tenkeyless mechanical gaming keyboard 
    designed with and for esports professionals. Featuring swappable switches, LIGHTSYNC RGB, 
    and a compact design, it's perfect for competitive gamers.`,
    price: 3290000,
    discountPrice: 2790000,
    category: 'accessory',
    subcategory: 'keyboard',
    brand: 'Logitech',
    stock: 40,
    images: ['default-keyboard.jpg'],
    specifications: [
      { name: 'Type', value: 'Mechanical' },
      { name: 'Layout', value: 'Tenkeyless (TKL)' },
      { name: 'Connectivity', value: 'Wired (Detachable)' },
      { name: 'RGB', value: 'Per-key RGB lighting' },
      { name: 'Features', value: 'Swappable switches, Programmable keys' }
    ],
    variants: [
      {
        name: 'Switch Type',
        options: [
          { value: 'GX Blue (Clicky)', additionalPrice: 0, stock: 15 },
          { value: 'GX Brown (Tactile)', additionalPrice: 0, stock: 15 },
          { value: 'GX Red (Linear)', additionalPrice: 0, stock: 10 }
        ]
      }
    ],
    featured: false
  }
];

async function seedDemoProducts() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Check if products already exist
    const existingProductsCount = await Product.countDocuments();
    if (existingProductsCount > 0) {
      console.log(`${existingProductsCount} products already exist. Skipping seeding.`);
      await mongoose.connection.close();
      return;
    }

    // Insert demo products
    await Product.insertMany(demoProducts);
    console.log(`${demoProducts.length} demo products seeded successfully`);

    await mongoose.connection.close();
    console.log('Disconnected from MongoDB');
  } catch (error) {
    console.error('Error seeding demo products:', error);
    process.exit(1);
  }
}

seedDemoProducts();
