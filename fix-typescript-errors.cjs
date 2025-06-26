const fs = require('fs');
const path = require('path');

console.log('🔧 Fixing TypeScript errors...');

// Fix server/storage.ts - convert unknown types to proper types
const storagePath = path.join(__dirname, 'server', 'storage.ts');
let storageContent = fs.readFileSync(storagePath, 'utf8');

// Fix the transaction creation by properly typing the properties
storageContent = storageContent.replace(
  /const transaction: Transaction = \{[\s\S]*?\};/,
  `const transaction: Transaction = {
      id,
      customerName: insertTransaction.customerName,
      mobileNumber: insertTransaction.mobileNumber,
      deviceModel: insertTransaction.deviceModel,
      repairType: insertTransaction.repairType,
      repairCost: insertTransaction.repairCost,
      actualCost: totalCost,
      profit: profit,
      paymentMethod: insertTransaction.paymentMethod,
      amountGiven: insertTransaction.amountGiven?.toString() || "0",
      changeReturned: insertTransaction.changeReturned?.toString() || "0",
      status: insertTransaction.status || "completed",
      remarks: insertTransaction.remarks || "",
      partsCost: insertTransaction.externalPurchases ? JSON.stringify(insertTransaction.externalPurchases) : 
                 JSON.stringify({
                   internalCost: insertTransaction.internalCost || 0,
                   type: 'internal'
                 }),
      createdAt: new Date().toISOString(),
      createdBy: 1,
    };`
);

// Fix the partsCost assignment
storageContent = storageContent.replace(
  /partsCost: insertTransaction\.externalPurchases \? JSON\.stringify\(insertTransaction\.externalPurchases\) :[\s\S]*?\),/,
  `partsCost: insertTransaction.externalPurchases ? JSON.stringify(insertTransaction.externalPurchases) : 
                 JSON.stringify({
                   internalCost: insertTransaction.internalCost || 0,
                   type: 'internal'
                 }),`
);

// Fix the requiresInventory assignment
storageContent = storageContent.replace(
  /requiresInventory: insertTransaction\.requiresInventory \|\| false,/,
  `requiresInventory: Boolean(insertTransaction.requiresInventory),`
);

// Fix the freeGlassInstallation assignment
storageContent = storageContent.replace(
  /freeGlassInstallation: insertTransaction\.freeGlassInstallation \|\| false,/,
  `freeGlassInstallation: Boolean(insertTransaction.freeGlassInstallation),`
);

// Fix the supplierName assignment
storageContent = storageContent.replace(
  /supplierName: insertTransaction\.supplierName \|\| null,/,
  `supplierName: String(insertTransaction.supplierName || ""),`
);

// Fix the customSupplierName assignment
storageContent = storageContent.replace(
  /customSupplierName: insertTransaction\.customSupplierName \|\| null,/,
  `customSupplierName: String(insertTransaction.customSupplierName || ""),`
);

// Fix the externalStoreName assignment
storageContent = storageContent.replace(
  /externalStoreName: insertTransaction\.externalStoreName \|\| null,/,
  `externalStoreName: String(insertTransaction.externalStoreName || ""),`
);

// Fix the externalItemName assignment
storageContent = storageContent.replace(
  /externalItemName: insertTransaction\.externalItemName \|\| null,/,
  `externalItemName: String(insertTransaction.externalItemName || ""),`
);

// Fix the externalItemCost assignment
storageContent = storageContent.replace(
  /externalItemCost: insertTransaction\.externalItemCost\?\.toString\(\) \|\| null,/,
  `externalItemCost: String(insertTransaction.externalItemCost || ""),`
);

// Fix the externalPurchases assignment
storageContent = storageContent.replace(
  /externalPurchases: insertTransaction\.externalPurchases \? JSON\.stringify\(insertTransaction\.externalPurchases\) : null,/,
  `externalPurchases: String(insertTransaction.externalPurchases ? JSON.stringify(insertTransaction.externalPurchases) : ""),`
);

// Fix the internalCost assignment
storageContent = storageContent.replace(
  /internalCost: insertTransaction\.internalCost\?\.toString\(\) \|\| "0",/,
  `internalCost: String(insertTransaction.internalCost || "0"),`
);

fs.writeFileSync(storagePath, storageContent);

console.log('✅ Fixed server/storage.ts');

// Fix shared/schema.ts - ensure drizzle-zod is properly imported
const schemaPath = path.join(__dirname, 'shared', 'schema.ts');
let schemaContent = fs.readFileSync(schemaPath, 'utf8');

// Ensure createInsertSchema is imported
if (!schemaContent.includes('import { createInsertSchema } from "drizzle-zod"')) {
  schemaContent = schemaContent.replace(
    'import { pgTable, text, serial, decimal, boolean, timestamp, varchar } from "drizzle-orm/pg-core";',
    `import { pgTable, text, serial, decimal, boolean, timestamp, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";`
  );
}

fs.writeFileSync(schemaPath, schemaContent);

console.log('✅ Fixed shared/schema.ts');

console.log('🎉 All TypeScript errors should be fixed!');
console.log('Run: cd backend && npm run build'); 