// test-pay-until-due-decreases.js
// This script will keep paying 1000 to 'Hub' and check if the due decreases, up to 5 times.

async function paySupplier(supplier, amount, paymentMethod = 'Cash') {
  const fetch = (await import('node-fetch')).default;
  const BASE_URL = 'http://localhost:5000/api';
  const res = await fetch(`${BASE_URL}/expenditures/supplier-payment`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ supplier, amount, paymentMethod }),
  });
  return res.json();
}

async function getSupplierSummary() {
  const fetch = (await import('node-fetch')).default;
  const BASE_URL = 'http://localhost:5000/api';
  const res = await fetch(`${BASE_URL}/expenditures/supplier-summary`);
  return res.json();
}

async function getAllExpenditures() {
  const fetch = (await import('node-fetch')).default;
  const BASE_URL = 'http://localhost:5000/api';
  const res = await fetch(`${BASE_URL}/expenditures`);
  return res.json();
}

async function clearAll() {
  const fetch = (await import('node-fetch')).default;
  const BASE_URL = 'http://localhost:5000/api';
  await fetch(`${BASE_URL}/expenditures/clear`, { method: 'POST' });
  await fetch(`${BASE_URL}/supplier-payments/clear`, { method: 'POST' });
  console.log('Cleared all expenditures and supplier payments.');
}

async function createDemoTransaction() {
  const fetch = (await import('node-fetch')).default;
  const BASE_URL = 'http://localhost:5000/api';
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
  const res = await fetch(`${BASE_URL}/transactions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(transaction),
  });
  const result = await res.json();
  console.log('Created transaction:', result);
}

async function main() {
  await clearAll();
  const allExpsAfterClear = await getAllExpenditures();
  if (allExpsAfterClear.length > 0) {
    console.error('ERROR: Expenditures still exist after clearing!');
    allExpsAfterClear.forEach(exp => {
      console.log(`  ID: ${exp.id}, Recipient: ${exp.recipient}, Amount: ${exp.amount}, Paid: ${exp.paidAmount}, Remaining: ${exp.remainingAmount}`);
    });
    return;
  } else {
    console.log('Expenditures cleared successfully.');
  }
  await createDemoTransaction();
  // Wait for backend to process
  await new Promise(r => setTimeout(r, 1000));
  let attempts = 0;
  let lastDue = null;
  while (attempts < 10) {
    const summary = await getSupplierSummary();
    const hub = summary.Hub;
    const due = hub?.totalDue ?? hub?.totalRemaining ?? 0;
    console.log(`Attempt ${attempts + 1}: Due for Hub is ${due}`);
    console.log('Full supplier summary:', JSON.stringify(hub, null, 2));
    const allExps = await getAllExpenditures();
    const hubExps = allExps.filter(exp => (exp.recipient || '').toLowerCase() === 'hub');
    console.log('All expenditures for Hub:');
    hubExps.forEach(exp => {
      console.log(`  ID: ${exp.id}, Amount: ${exp.amount}, Paid: ${exp.paidAmount}, Remaining: ${exp.remainingAmount}`);
    });
    if (hubExps.length !== 1) {
      console.error('ERROR: More than one expenditure for Hub!');
      break;
    }
    if (lastDue !== null && due < lastDue) {
      console.log(`Success! Due decreased from ${lastDue} to ${due}`);
      return;
    }
    lastDue = due;
    console.log('Paying 1000 to Hub...');
    try {
      await paySupplier('Hub', 1000, 'Cash');
    } catch (err) {
      console.error('Payment error:', err);
    }
    await new Promise(r => setTimeout(r, 1000)); // Wait 1s for backend
    attempts++;
  }
  // Final check
  const summary = await getSupplierSummary();
  const hub = summary.Hub;
  const due = hub?.totalDue ?? hub?.totalRemaining ?? 0;
  if (due < lastDue) {
    console.log(`Success! Due decreased from ${lastDue} to ${due}`);
  } else {
    console.error(`ERROR: Due did not decrease after 10 attempts. Final due: ${due}`);
    const allExps = await getAllExpenditures();
    const hubExps = allExps.filter(exp => (exp.recipient || '').toLowerCase() === 'hub');
    console.log('All expenditures for Hub:');
    hubExps.forEach(exp => {
      console.log(`  ID: ${exp.id}, Amount: ${exp.amount}, Paid: ${exp.paidAmount}, Remaining: ${exp.remainingAmount}`);
    });
    console.log('Full supplier summary:', JSON.stringify(hub, null, 2));
  }
}

main().catch(err => {
  console.error('Script error:', err);
}); 