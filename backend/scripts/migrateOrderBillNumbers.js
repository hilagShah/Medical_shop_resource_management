const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const Order = require('../models/Order');

const migrateOrderBillNumbers = async () => {
  try {
    const mongoUri = process.env.MONGO_URI;
    if (!mongoUri) {
      console.error('MONGO_URI not configured');
      process.exit(1);
    }

    console.log('Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB.');

    // 1. Drop old single index on orderNumber if present
    try {
      const orderCollection = mongoose.connection.collection('orders');
      const indexes = await orderCollection.indexes();
      const hasOldIndex = indexes.some((idx) => idx.name === 'orderNumber_1' && idx.unique);
      if (hasOldIndex) {
        console.log('Dropping legacy unique orderNumber_1 index...');
        await orderCollection.dropIndex('orderNumber_1');
        console.log('Legacy orderNumber_1 index dropped.');
      }
    } catch (idxErr) {
      console.warn('Index check/drop note:', idxErr.message);
    }

    // 2. Ensure compound index on { shopkeeperId: 1, orderNumber: 1 }
    try {
      await Order.syncIndexes();
      console.log('Synced compound indexes successfully.');
    } catch (syncErr) {
      console.warn('Sync index note:', syncErr.message);
    }

    // 3. Find all distinct shopkeepers who have orders
    const allOrders = await Order.find({}).sort({ createdAt: 1 });
    console.log(`Found ${allOrders.length} total existing orders.`);

    const ordersByShopkeeper = {};
    for (const ord of allOrders) {
      const shopId = ord.shopkeeperId.toString();
      if (!ordersByShopkeeper[shopId]) {
        ordersByShopkeeper[shopId] = [];
      }
      ordersByShopkeeper[shopId].push(ord);
    }

    console.log(`Processing orders across ${Object.keys(ordersByShopkeeper).length} shopkeeper(s)...`);

    for (const [shopId, orders] of Object.entries(ordersByShopkeeper)) {
      console.log(`\nShopkeeper ${shopId}: Renumbering ${orders.length} order(s) starting from 1...`);
      for (let i = 0; i < orders.length; i++) {
        const sequentialBillNo = String(i + 1);
        const ord = orders[i];
        const oldNo = ord.orderNumber;
        ord.orderNumber = sequentialBillNo;
        await ord.save();
        console.log(`  - Order ${ord._id}: "${oldNo}" -> Bill No "${sequentialBillNo}"`);
      }
    }

    console.log('\nMigration complete! All bills are now serial starting from 1 for every shopkeeper.');
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
};

if (require.main === module) {
  migrateOrderBillNumbers();
}

module.exports = { migrateOrderBillNumbers };
