// test-e2e-supplier-due-advanced.js
// Advanced E2E test for multiple suppliers, partial payments, and edge cases

async function fetchJson(url, options) {
  const fetch = (await import('node-fetch')).default;
  const res = await fetch(url, options);
  return res.json();
}

const BASE_URL = 'http://localhost:5000/api';

async function clearAll() {
  await fetchJson(`${BASE_URL}/expenditures/clear`, { method: 'POST' });
  await fetchJson(`${BASE_URL}/supplier-payments/clear`, { method: 'POST' });
  await fetchJson(`${BASE_URL}/transactions/clear`, { method: 'POST' });
  console.log('Cleared all expenditures, supplier payments, and transactions.');
}

async function createTransaction(customerName, supplier, item, cost) {
  const transaction = {
    customerName,
    mobileNumber: '7777777777',
    deviceModel: 'Test Model',
    repairType: 'Advanced',
    repairCost: cost + 500,
    paymentMethod: 'cash',
    amountGiven: cost + 500,
    changeReturned: 0,
    remarks: 'Advanced E2E',
    externalPurchases: [
      { store: supplier, item, cost }
    ],
    requiresInventory: true
  };
  const result = await fetchJson(`${BASE_URL}/transactions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(transaction),
  });
  console.log(`Created transaction for ${supplier}:`, result);
  return result;
}

async function getSupplierSummary() {
  return fetchJson(`${BASE_URL}/expenditures/supplier-summary`);
}

async function paySupplier(supplier, amount, paymentMethod = 'Cash') {
  return fetchJson(`${BASE_URL}/expenditures/supplier-payment`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ supplier, amount, paymentMethod }),
  });
}

async function getSupplierPayments() {
  return fetchJson(`${BASE_URL}/supplier-payments`);
}

async function printSupplierStatus(supplier) {
  const summary = await getSupplierSummary();
  const s = summary[supplier];
  console.log(`Supplier: ${supplier}`);
  if (!s) {
    console.log('  No summary found.');
    return;
  }
  console.log('  Due:', s.totalDue, 'TotalPaid:', s.totalPaid, 'TotalExpenditure:', s.totalExpenditure);
  console.log('  Transactions:', s.transactions.map(t => ({ id: t.id, amount: t.amount, paid: t.paidAmount, remaining: t.remainingAmount })));
  const payments = (await getSupplierPayments()).filter(p => p.supplier.toLowerCase() === supplier.toLowerCase());
  console.log('  Payments:', payments.map(p => ({ amount: p.amount, method: p.paymentMethod, createdAt: p.createdAt })));
}

async function main() {
  await clearAll();

  // 1. Create transactions for multiple suppliers
  await createTransaction('User1', 'Hub', 'Screen', 1200);
  await createTransaction('User2', 'Patel', 'Battery', 800);
  await createTransaction('User3', 'Sri', 'Camera', 1500);
  await new Promise(r => setTimeout(r, 1000));

  // 2. Check initial due for all
  await printSupplierStatus('Hub');
  await printSupplierStatus('Patel');
  await printSupplierStatus('Sri');

  // 3. Partial payment to Hub
  await paySupplier('Hub', 500, 'Cash');
  await new Promise(r => setTimeout(r, 500));
  await printSupplierStatus('Hub');

  // 4. Full payment to Patel
  await paySupplier('Patel', 800, 'Online');
  await new Promise(r => setTimeout(r, 500));
  await printSupplierStatus('Patel');

  // 5. Overpayment to Sri (should not go negative)
  await paySupplier('Sri', 2000, 'Cash');
  await new Promise(r => setTimeout(r, 500));
  await printSupplierStatus('Sri');

  // 6. Zero payment to Hub (should not change due)
  await paySupplier('Hub', 0, 'Cash');
  await new Promise(r => setTimeout(r, 500));
  await printSupplierStatus('Hub');

  // 7. Final status for all
  await printSupplierStatus('Hub');
  await printSupplierStatus('Patel');
  await printSupplierStatus('Sri');
}

main().catch(err => {
  console.error('Advanced E2E test error:', err);
}); 