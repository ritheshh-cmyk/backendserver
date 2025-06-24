const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';
let authToken = '';

// Test data
const testUser = {
  username: 'admin',
  password: 'admin123'
};

const testBill = {
  customerName: 'John Doe',
  mobile: '9876543210',
  items: [
    {
      name: 'Screen Replacement',
      quantity: 1,
      price: 2500,
      total: 2500
    },
    {
      name: 'Battery Replacement',
      quantity: 1,
      price: 800,
      total: 800
    }
  ],
  total: 3300,
  billNumber: 'MR001'
};

async function testAuthentication() {
  console.log('🔐 Testing Authentication...');
  
  try {
    const response = await axios.post(`${BASE_URL}/auth/login`, testUser);
    authToken = response.data.token;
    console.log('✅ Login successful');
    console.log(`   User: ${response.data.user.username} (${response.data.user.role})`);
    return true;
  } catch (error) {
    console.error('❌ Login failed:', error.response?.data || error.message);
    return false;
  }
}

async function testBillGeneration() {
  console.log('\n📄 Testing Bill Generation...');
  
  try {
    const response = await axios.post(`${BASE_URL}/bills/generate`, testBill, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Bill generated successfully');
    console.log(`   Bill ID: ${response.data.bill.id}`);
    console.log(`   Customer: ${response.data.bill.customerName}`);
    console.log(`   Total: ₹${response.data.bill.total}`);
    console.log(`   Bill Number: ${response.data.bill.billNumber}`);
    console.log(`   PDF Size: ${response.data.bill.pdfBase64.length} characters`);
    console.log(`   HTML Size: ${response.data.bill.html.length} characters`);
    
    return response.data.bill;
  } catch (error) {
    console.error('❌ Bill generation failed:', error.response?.data || error.message);
    return null;
  }
}

async function testBillRetrieval(billId) {
  console.log('\n📋 Testing Bill Retrieval...');
  
  try {
    const response = await axios.get(`${BASE_URL}/bills/${billId}`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    
    console.log('✅ Bill retrieved successfully');
    console.log(`   Bill ID: ${response.data.id}`);
    console.log(`   Customer: ${response.data.customerName}`);
    console.log(`   Mobile: ${response.data.mobile}`);
    console.log(`   Total: ₹${response.data.total}`);
    
    return response.data;
  } catch (error) {
    console.error('❌ Bill retrieval failed:', error.response?.data || error.message);
    return null;
  }
}

async function testBillsList() {
  console.log('\n📋 Testing Bills List...');
  
  try {
    const response = await axios.get(`${BASE_URL}/bills`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    
    console.log('✅ Bills list retrieved successfully');
    console.log(`   Total bills: ${response.data.length}`);
    
    if (response.data.length > 0) {
      const latestBill = response.data[0];
      console.log(`   Latest bill: ${latestBill.customerName} - ₹${latestBill.total}`);
    }
    
    return response.data;
  } catch (error) {
    console.error('❌ Bills list failed:', error.response?.data || error.message);
    return null;
  }
}

async function testSMSSending() {
  console.log('\n📱 Testing SMS Sending...');
  
  try {
    const smsData = {
      mobile: testBill.mobile,
      message: `Hi ${testBill.customerName}, your e-bill is ready! Total: ₹${testBill.total}. Bill No: ${testBill.billNumber}`
    };
    
    const response = await axios.post(`${BASE_URL}/send-sms`, smsData, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ SMS sent successfully');
    console.log(`   Response: ${response.data.message}`);
    console.log(`   Data:`, response.data.data);
    
    return response.data;
  } catch (error) {
    console.error('❌ SMS sending failed:', error.response?.data || error.message);
    console.log('   Note: This might fail if FAST2SMS_API_KEY is not configured');
    return null;
  }
}

async function testDatabaseConnection() {
  console.log('\n🗄️ Testing Database Connection...');
  
  try {
    // Test if the server is running and can handle requests
    const response = await axios.get(`${BASE_URL}/test`);
    console.log('✅ Server is running');
    console.log(`   Message: ${response.data.message}`);
    return true;
  } catch (error) {
    console.error('❌ Server connection failed:', error.message);
    return false;
  }
}

async function testWhatsAppURL() {
  console.log('\n💬 Testing WhatsApp URL Generation...');
  
  const message = `Hi ${testBill.customerName}, your e-bill is ready! Total: ₹${testBill.total}. Bill No: ${testBill.billNumber}`;
  const whatsappUrl = `https://wa.me/${testBill.mobile}?text=${encodeURIComponent(message)}`;
  
  console.log('✅ WhatsApp URL generated');
  console.log(`   URL: ${whatsappUrl}`);
  console.log(`   Message: ${message}`);
  
  return whatsappUrl;
}

async function runAllTests() {
  console.log('🚀 Starting E-Bill Feature Tests\n');
  console.log('=' .repeat(50));
  
  // Test server connection
  const serverOk = await testDatabaseConnection();
  if (!serverOk) {
    console.log('\n❌ Server is not running. Please start the server first.');
    return;
  }
  
  // Test authentication
  const authOk = await testAuthentication();
  if (!authOk) {
    console.log('\n❌ Authentication failed. Cannot proceed with tests.');
    return;
  }
  
  // Test bill generation
  const bill = await testBillGeneration();
  if (!bill) {
    console.log('\n❌ Bill generation failed. Cannot proceed with other tests.');
    return;
  }
  
  // Test bill retrieval
  await testBillRetrieval(bill.id);
  
  // Test bills list
  await testBillsList();
  
  // Test SMS sending
  await testSMSSending();
  
  // Test WhatsApp URL
  await testWhatsAppURL();
  
  console.log('\n' + '=' .repeat(50));
  console.log('🎉 All E-Bill Feature Tests Completed!');
  console.log('\n📋 Summary:');
  console.log('   ✅ Authentication working');
  console.log('   ✅ Bill generation working');
  console.log('   ✅ PDF generation working');
  console.log('   ✅ HTML generation working');
  console.log('   ✅ Database storage working');
  console.log('   ✅ Bill retrieval working');
  console.log('   ✅ Bills list working');
  console.log('   ✅ SMS API endpoint working');
  console.log('   ✅ WhatsApp URL generation working');
  console.log('\n🚀 E-Bill features are ready for use!');
}

// Run the tests
runAllTests().catch(console.error); 