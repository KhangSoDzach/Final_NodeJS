/**
 * Demo Products Seeder - Tạo sản phẩm mẫu
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('../models/product');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/sourcecomputer';

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
    images: ['1744992886557.png', '1744992944214.png'],
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
    images: ['1744993022711.png', '1745252788026.png'],
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
  {
    name: 'MacBook Pro 16 (M2 Pro)',
    slug: 'macbook-pro-16-m2-pro',
    description: `The MacBook Pro 16 with M2 Pro chip delivers exceptional performance and stunning visuals on its Retina XDR display. 
    Perfect for professional video editing, software development, and creative work with up to 22 hours of battery life.`,
    price: 65990000,
    discountPrice: 62990000,
    category: 'laptop',
    subcategory: 'premium',
    brand: 'Apple',
    stock: 12,
    images: ['1746800068906.png', '1746800068907.png', '1746800068908.png'],
    specifications: [
      { name: 'Processor', value: 'Apple M2 Pro (12-core)' },
      { name: 'RAM', value: '32GB Unified Memory' },
      { name: 'Storage', value: '1TB SSD' },
      { name: 'Display', value: '16.2-inch Liquid Retina XDR' },
      { name: 'Graphics', value: '19-core GPU' },
      { name: 'Battery', value: '100Whr' }
    ],
    variants: [
      {
        name: 'Storage',
        options: [
          { value: '1TB', additionalPrice: 0, stock: 8 },
          { value: '2TB', additionalPrice: 8000000, stock: 4 }
        ]
      },
      {
        name: 'RAM',
        options: [
          { value: '32GB', additionalPrice: 0, stock: 6 },
          { value: '64GB', additionalPrice: 8000000, stock: 6 }
        ]
      }
    ],
    featured: true
  },
  {
    name: 'ASUS ROG Zephyrus G15',
    slug: 'asus-rog-zephyrus-g15',
    description: `The ASUS ROG Zephyrus G15 is an ultra-slim gaming laptop with AMD Ryzen 9 processor and 
    NVIDIA RTX graphics. With its 165Hz QHD display and advanced cooling system, it delivers exceptional 
    gaming performance in a portable design.`,
    price: 38990000,
    discountPrice: 36990000,
    category: 'laptop',
    subcategory: 'gaming',
    brand: 'ASUS',
    stock: 18,
    images: ['1746803586118.png', '1746803586119.png', '1746803586120.png'],
    specifications: [
      { name: 'Processor', value: 'AMD Ryzen 9 5900HS' },
      { name: 'RAM', value: '16GB DDR4' },
      { name: 'Storage', value: '1TB NVMe SSD' },
      { name: 'Display', value: '15.6-inch QHD (165Hz)' },
      { name: 'Graphics', value: 'NVIDIA GeForce RTX 3080' },
      { name: 'Battery', value: '90Whr' }
    ],
    variants: [
      {
        name: 'Graphics',
        options: [
          { value: 'RTX 3070', additionalPrice: -4000000, stock: 10 },
          { value: 'RTX 3080', additionalPrice: 0, stock: 8 }
        ]
      }
    ],
    featured: true
  },
  {
    name: 'MSI Stealth 15M',
    slug: 'msi-stealth-15m',
    description: `The MSI Stealth 15M is a sleek and powerful gaming laptop that combines performance 
    with portability. Featuring the latest Intel Core i7 processor and NVIDIA RTX graphics in a thin, 
    lightweight design.`,
    price: 34990000,
    discountPrice: 32990000,
    category: 'laptop',
    subcategory: 'gaming',
    brand: 'MSI',
    stock: 15,
    images: ['1746803586122.png', '1746803586123.png'],
    specifications: [
      { name: 'Processor', value: 'Intel Core i7-11375H' },
      { name: 'RAM', value: '16GB DDR4' },
      { name: 'Storage', value: '512GB NVMe SSD' },
      { name: 'Display', value: '15.6-inch FHD (144Hz)' },
      { name: 'Graphics', value: 'NVIDIA GeForce RTX 3060' },
      { name: 'Battery', value: '52Whr' }
    ],
    variants: [
      {
        name: 'Storage',
        options: [
          { value: '512GB', additionalPrice: 0, stock: 8 },
          { value: '1TB', additionalPrice: 2500000, stock: 7 }
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
    images: ['1745332562755.png', '1745335764956.png'],
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
    images: ['1745585203059.png', '1745585244499.png'],
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
    images: ['1745585269236.png', '1745585269237.png', '1745585269239.png'],
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
    images: ['1745585269241.png', '1745585269243.png'],
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
    images: ['1745585269244.png', '1746539617227.png', '1746539617228.png'],
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
  },
  {
    name: 'ASUS ROG Strix Gaming Mouse',
    slug: 'asus-rog-strix-gaming-mouse',
    description: `The ASUS ROG Strix is a high-performance gaming mouse with ergonomic design and 
    advanced optical sensor. With customizable RGB lighting and programmable buttons, it offers 
    precise control and comfort during extended gaming sessions.`,
    price: 1890000,
    discountPrice: 1690000,
    category: 'accessory',
    subcategory: 'mouse',
    brand: 'ASUS',
    stock: 35,
    images: ['1746539617232.png', '1746539617234.png'],
    specifications: [
      { name: 'DPI', value: 'Up to 16,000' },
      { name: 'Buttons', value: '8 programmable buttons' },
      { name: 'Connectivity', value: 'Wired USB' },
      { name: 'Weight', value: '90g' },
      { name: 'RGB', value: 'ASUS Aura Sync' }
    ],
    featured: true
  },
  {
    name: 'NVIDIA GeForce RTX 4070 Ti',
    slug: 'nvidia-geforce-rtx-4070-ti',
    description: `The NVIDIA GeForce RTX 4070 Ti delivers exceptional gaming performance with 
    ray tracing and DLSS 3 technology. Built on the Ada Lovelace architecture, it offers improved 
    efficiency and performance for demanding games and creative applications.`,
    price: 19990000,
    discountPrice: 18990000,
    category: 'component',
    subcategory: 'gpu',
    brand: 'NVIDIA',
    stock: 15,
    images: ['1746539644173.png', '1746539644174.png', '1746539644175.png'],
    specifications: [
      { name: 'CUDA Cores', value: '7680' },
      { name: 'Memory', value: '12GB GDDR6X' },
      { name: 'Memory Interface', value: '192-bit' },
      { name: 'Boost Clock', value: 'Up to 2.6 GHz' },
      { name: 'Power Consumption', value: '285W' }
    ],
    featured: true
  },
  {
    name: 'Kingston HyperX Cloud II Gaming Headset',
    slug: 'kingston-hyperx-cloud-ii-headset',
    description: `The Kingston HyperX Cloud II is a premium gaming headset featuring virtual 7.1 surround sound 
    and memory foam ear cushions for comfort during extended gaming sessions. With its durable aluminum frame 
    and detachable microphone, it's perfect for gamers who demand quality audio and clear communication.`,
    price: 2490000,
    discountPrice: 2190000,
    category: 'accessory',
    subcategory: 'headset',
    brand: 'Kingston',
    stock: 25,
    images: ['1746539644176.png', '1746539644177.png', '1746539644178.png'],
    specifications: [
      { name: 'Audio', value: 'Virtual 7.1 Surround Sound' },
      { name: 'Connectivity', value: 'USB / 3.5mm jack' },
      { name: 'Microphone', value: 'Detachable with noise cancellation' },
      { name: 'Frequency Response', value: '15Hz–25,000Hz' },
      { name: 'Compatibility', value: 'PC, PS4, Xbox, Mobile' }
    ],
    featured: false
  }
];

async function seedProducts() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Kiểm tra xem đã có sản phẩm chưa
    const existingCount = await Product.countDocuments();
    
    if (existingCount > 0) {
      console.log(`Already have ${existingCount} products in database. Skipping seed.`);
      console.log('To re-seed, delete existing products first.');
    } else {
      // Insert demo products
      const result = await Product.insertMany(demoProducts);
      console.log(`${result.length} demo products created successfully!`);
    }

  } catch (error) {
    console.error('Error seeding products:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

seedProducts();
