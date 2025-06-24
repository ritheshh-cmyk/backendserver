// test-demo-transactions.js
// This script creates a demo transaction and fetches the supplier summary for 'Hub'.
// Make sure your backend server is running before executing this script.

async function createTransaction(transaction) {
  const fetch = (await import('node-fetch')).default;
  const BASE_URL = 'http://localhost:5000/api';
  const res = await fetch(`${BASE_URL}/transactions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(transaction),
  });
  return res.json();
}

async function getSupplierSummary() {
  const fetch = (await import('node-fetch')).default;
  const BASE_URL = 'http://localhost:5000/api';
  const res = await fetch(`${BASE_URL}/expenditures/supplier-summary`);
  return res.json();
}

async function main() {
  // Demo transaction
  const transaction = {
    customerName: 'Demo User',
    mobileNumber: '9999999999',
    deviceModel: 'Demo Model',
    repairType: 'Screen Replacement',
    repairCost: 2000,
    paymentMethod: 'cash',
    amountGiven: 2000,
    changeReturned: 0,
    remarks: 'Demo transaction',
    externalPurchases: [
      { store: 'Hub', item: 'Screen', cost: 1200 }
    ],
    requiresInventory: true
  };

  const result = await createTransaction(transaction);
  console.log('Created transaction:', result);

  // Fetch and print supplier summary
  const summary = await getSupplierSummary();
  console.log('\nSupplier Summary for Hub:', summary.Hub);
}

main().catch(err => {
  console.error('Error running script:', err);
}); 