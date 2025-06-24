// test-clear-expenditures.js
// This script clears all expenditures and supplier payments from the backend (in-memory storage).

async function clearExpenditures() {
  const fetch = (await import('node-fetch')).default;
  const BASE_URL = 'http://localhost:5000/api';
  // Assuming you have endpoints to clear expenditures and payments for testing
  await fetch(`${BASE_URL}/expenditures/clear`, { method: 'POST' });
  await fetch(`${BASE_URL}/supplier-payments/clear`, { method: 'POST' });
  console.log('Cleared all expenditures and supplier payments.');
}

clearExpenditures().catch(err => {
  console.error('Error clearing data:', err);
}); 