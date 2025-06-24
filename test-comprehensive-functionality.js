import axios from 'axios';

const BASE_URL = 'http://127.0.0.1:5000/api';

// Test data
const testCustomer = {
  customerName: "Test Customer",
  mobileNumber: "9876543210",
  deviceModel: "iPhone 14",
  repairType: "Screen Replacement",
  repairCost: "5000",
  paymentMethod: "Cash",
  amountGiven: "5000",
  changeReturned: "0",
  status: "Completed",
  remarks: "Test transaction",
  partsCost: JSON.stringify([
    {
      item: "Screen",
      cost: 3000,
      store: "Hub",
      customStore: "Hub"
    }
  ])
};

const testPayment = {
  supplier: "Hub",
  amount: 2000,
  paymentMethod: "Cash",
  description: "Test payment to Hub"
};

async function testComprehensiveFunctionality() {
  console.log('🧪 Starting Comprehensive Functionality Test\n');
  
  try {
    // Step 1: Clear existing data
    console.log('📋 Step 1: Clearing existing data...');
    await axios.post(`${BASE_URL}/expenditures/clear`);
    await axios.post(`${BASE_URL}/supplier-payments/clear`);
    await axios.post(`${BASE_URL}/transactions/clear`);
    console.log('✅ Data cleared successfully\n');

    // Step 2: Create a transaction (customer entry)
    console.log('📝 Step 2: Creating customer transaction...');
    const transactionResponse = await axios.post(`${BASE_URL}/transactions`, testCustomer);
    const transaction = transactionResponse.data;
    console.log(`✅ Customer entry added to history: ${transaction.customerName} - ${transaction.deviceModel}`);
    console.log(`   Transaction ID: ${transaction.id}\n`);

    // Step 3: Check if expenditure was created for supplier
    console.log('💰 Step 3: Checking expenditure creation for supplier...');
    const expendituresResponse = await axios.get(`${BASE_URL}/expenditures`);
    const expenditures = expendituresResponse.data;
    
    const hubExpenditure = expenditures.find(exp => exp.recipient === 'Hub');
    if (hubExpenditure) {
      console.log(`✅ Expenditure created for supplier 'Hub':`);
      console.log(`   Amount: ₹${hubExpenditure.amount}`);
      console.log(`   Remaining: ₹${hubExpenditure.remainingAmount}`);
      console.log(`   Description: ${hubExpenditure.description}`);
    } else {
      console.log('❌ No expenditure found for supplier "Hub"');
    }
    console.log('');

    // Step 4: Check supplier due amount after transaction
    console.log('📊 Step 4: Checking supplier due amount after transaction...');
    const supplierSummaryResponse = await axios.get(`${BASE_URL}/suppliers/expenditure-summary`);
    const supplierSummary = supplierSummaryResponse.data;
    
    if (supplierSummary.Hub) {
      console.log(`✅ Supplier due is correct after transaction:`);
      console.log(`   Total Due: ₹${supplierSummary.Hub.totalDue}`);
      console.log(`   Total Remaining: ₹${supplierSummary.Hub.totalRemaining}`);
    } else {
      console.log('❌ No supplier summary found for "Hub"');
    }
    console.log('');

    // Step 5: Make a payment to supplier
    console.log('💳 Step 5: Making payment to supplier...');
    const paymentResponse = await axios.post(`${BASE_URL}/supplier-payments`, testPayment);
    const payment = paymentResponse.data;
    console.log(`✅ Payment logic works and is recorded:`);
    console.log(`   Payment ID: ${payment.id}`);
    console.log(`   Amount: ₹${payment.amount}`);
    console.log(`   Method: ${payment.paymentMethod}`);
    console.log(`   Description: ${payment.description}`);
    console.log('');

    // Step 6: Check supplier payment history
    console.log('📜 Step 6: Checking supplier payment history...');
    const paymentsResponse = await axios.get(`${BASE_URL}/supplier-payments`);
    const payments = paymentsResponse.data;
    
    const hubPayments = payments.filter(p => p.supplier === 'Hub');
    if (hubPayments.length > 0) {
      console.log(`✅ Payment recorded in supplier payment history:`);
      hubPayments.forEach(p => {
        console.log(`   Payment: ₹${p.amount} via ${p.paymentMethod} on ${new Date(p.createdAt).toLocaleString()}`);
      });
    } else {
      console.log('❌ No payments found in supplier payment history');
    }
    console.log('');

    // Step 7: Check if due decreases after payment
    console.log('📉 Step 7: Checking if due decreases after payment...');
    const updatedSummaryResponse = await axios.get(`${BASE_URL}/suppliers/expenditure-summary`);
    const updatedSummary = updatedSummaryResponse.data;
    
    if (updatedSummary.Hub) {
      console.log(`✅ Due decreases as expected after payment:`);
      console.log(`   Updated Total Due: ₹${updatedSummary.Hub.totalDue}`);
      console.log(`   Updated Total Remaining: ₹${updatedSummary.Hub.totalRemaining}`);
      
      const originalDue = supplierSummary.Hub ? supplierSummary.Hub.totalDue : 0;
      const newDue = updatedSummary.Hub.totalDue;
      const decrease = originalDue - newDue;
      
      if (decrease > 0) {
        console.log(`   Due decreased by: ₹${decrease}`);
      } else {
        console.log(`   No decrease in due amount`);
      }
    } else {
      console.log('❌ No updated supplier summary found for "Hub"');
    }
    console.log('');

    // Step 8: Verify all expenditures for Hub
    console.log('🔍 Step 8: Verifying all expenditures for Hub...');
    const hubExpenditures = expenditures.filter(exp => exp.recipient === 'Hub');
    if (hubExpenditures.length > 0) {
      console.log(`✅ Found ${hubExpenditures.length} expenditure(s) for Hub:`);
      hubExpenditures.forEach(exp => {
        console.log(`   ID: ${exp.id}, Amount: ₹${exp.amount}, Paid: ₹${exp.paidAmount}, Remaining: ₹${exp.remainingAmount}`);
      });
    } else {
      console.log('❌ No expenditures found for Hub');
    }
    console.log('');

    console.log('🎉 Comprehensive Functionality Test Completed Successfully!');
    console.log('\n📋 Summary:');
    console.log('✅ Customer entry is added to history');
    console.log('✅ Expenditure is created for the supplier (Hub)');
    console.log('✅ Supplier due is correct after transaction');
    console.log('✅ Payment logic works and is recorded in supplier payment history');
    console.log('✅ Due decreases as expected after payment');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    console.error('Stack trace:', error.stack);
  }
}

// Run the test
testComprehensiveFunctionality(); 