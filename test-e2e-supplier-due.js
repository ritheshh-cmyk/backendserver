// test-e2e-supplier-due.js
// End-to-end test for customer history, supplier due, and payment logic

async function fetchJson(url, options) {
  const fetch = (await import('node-fetch')).default;
  const res = await fetch(url, options);
  return res.json();
}

async function clearAll() {
  const BASE_URL = 'http://localhost:5000/api';
  await fetchJson(`${BASE_URL}/expenditures/clear`, { method: 'POST' });
  await fetchJson(`${BASE_URL}/supplier-payments/clear`, { method: 'POST' });
  await fetchJson(`${BASE_URL}/transactions/clear`, { method: 'POST' });
  console.log('Cleared all expenditures, supplier payments, and transactions.');
}

async function createTransaction() {
  const BASE_URL = 'http://localhost:5000/api';
  const transaction = {
    customerName: 'Test User',
    mobileNumber: '8888888888',
    deviceModel: 'Test Model',
    repairType: 'Battery',
    repairCost: 1500,
    paymentMethod: 'cash',
    amountGiven: 1500,
    changeReturned: 0,
    remarks: 'E2E test',
    externalPurchases: [
      { store: 'Hub', item: 'Battery', cost: 900 }
    ],
    requiresInventory: true
  };
  const result = await fetchJson(`${BASE_URL}/transactions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(transaction),
  });
  console.log('Created transaction:', result);
  return result;
}

async function getTransactions() {
  const BASE_URL = 'http://localhost:5000/api';
  return fetchJson(`${BASE_URL}/transactions`);
}

async function getExpenditures() {
  const BASE_URL = 'http://localhost:5000/api';
  return fetchJson(`${BASE_URL}/expenditures`);
}

async function getSupplierSummary() {
  const BASE_URL = 'http://localhost:5000/api';
  return fetchJson(`${BASE_URL}/expenditures/supplier-summary`);
}

async function paySupplier(supplier, amount, paymentMethod = 'Cash') {
  const BASE_URL = 'http://localhost:5000/api';
  return fetchJson(`${BASE_URL}/expenditures/supplier-payment`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ supplier, amount, paymentMethod }),
  });
}

async function getSupplierPayments() {
  const BASE_URL = 'http://localhost:5000/api';
  return fetchJson(`${BASE_URL}/supplier-payments`);
}

async function main() {
  await clearAll();

  // 1. Create transaction
  const tx = await createTransaction();
  await new Promise(r => setTimeout(r, 1000));

  // 2. Verify transaction in history
  const txs = await getTransactions();
  const foundTx = txs.find(t => t.customerName === 'Test User');
  if (foundTx) {
    console.log('Transaction appears in history:', foundTx);
  } else {
    console.error('ERROR: Transaction not found in history!');
    return;
  }

  // 3. Verify expenditure for Hub
  const exps = await getExpenditures();
  const hubExp = exps.find(e => (e.recipient || '').toLowerCase() === 'hub');
  if (hubExp) {
    console.log('Expenditure for Hub found:', hubExp);
  } else {
    console.error('ERROR: No expenditure for Hub!');
    return;
  }

  // 4. Verify supplier due
  const summary = await getSupplierSummary();
  const hubSummary = summary.Hub;
  if (hubSummary && hubSummary.totalDue === parseFloat(hubExp.remainingAmount)) {
    console.log('Supplier due is correct:', hubSummary.totalDue);
  } else {
    console.error('ERROR: Supplier due is incorrect!', hubSummary);
    return;
  }

  // 5. Make payment to Hub
  const payResult = await paySupplier('Hub', 500, 'Cash');
  console.log('Payment result:', payResult);
  await new Promise(r => setTimeout(r, 1000));

  // 6. Verify payment in supplier payment history
  const payments = await getSupplierPayments();
  const foundPayment = payments.find(p => p.supplier.toLowerCase() === 'hub' && parseFloat(p.amount) === 500);
  if (foundPayment) {
    console.log('Supplier payment found in history:', foundPayment);
  } else {
    console.error('ERROR: Supplier payment not found in history!');
    return;
  }

  // 7. Verify due decreased
  const summaryAfter = await getSupplierSummary();
  const hubSummaryAfter = summaryAfter.Hub;
  if (hubSummaryAfter && hubSummaryAfter.totalDue === parseFloat(hubExp.remainingAmount) - 500) {
    console.log('Supplier due decreased as expected:', hubSummaryAfter.totalDue);
  } else {
    console.error('ERROR: Supplier due did not decrease as expected!', hubSummaryAfter);
  }
}

main().catch(err => {
  console.error('E2E test error:', err);
}); 