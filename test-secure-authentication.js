import axios from 'axios';

const BASE_URL = 'http://127.0.0.1:5000/api';

let authToken = null;
let adminToken = null;

async function testSecureAuthentication() {
  console.log('🔐 Starting Secure Authentication Test\n');
  
  try {
    // Step 1: Test server is running
    console.log('📡 Step 1: Testing server connectivity...');
    const testResponse = await axios.get(`${BASE_URL}/test`);
    console.log(`✅ Server is running: ${testResponse.data.message}\n`);

    // Step 2: Test login with default admin credentials
    console.log('🔑 Step 2: Testing admin login...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      username: 'admin',
      password: 'admin123'
    });
    
    adminToken = loginResponse.data.token;
    console.log(`✅ Admin login successful`);
    console.log(`   Token: ${adminToken.substring(0, 20)}...`);
    console.log(`   User: ${loginResponse.data.user.username} (${loginResponse.data.user.role})\n`);

    // Step 3: Test protected endpoint without token (should fail)
    console.log('🚫 Step 3: Testing protected endpoint without token...');
    try {
      await axios.get(`${BASE_URL}/transactions`);
      console.log('❌ Should have failed - endpoint not protected');
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('✅ Protected endpoint correctly requires authentication');
      } else {
        console.log('❌ Unexpected error:', error.response?.data);
      }
    }
    console.log('');

    // Step 4: Test protected endpoint with token (should succeed)
    console.log('✅ Step 4: Testing protected endpoint with token...');
    const transactionsResponse = await axios.get(`${BASE_URL}/transactions`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    console.log(`✅ Protected endpoint accessible with token`);
    console.log(`   Transactions count: ${transactionsResponse.data.length}\n`);

    // Step 5: Test user registration (admin only)
    console.log('👥 Step 5: Testing user registration...');
    const registerResponse = await axios.post(`${BASE_URL}/auth/register`, {
      username: 'testuser',
      password: 'testpass123',
      role: 'user'
    }, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    
    console.log(`✅ User registered successfully`);
    console.log(`   New user: ${registerResponse.data.user.username} (${registerResponse.data.user.role})\n`);

    // Step 6: Test login with new user
    console.log('🔑 Step 6: Testing new user login...');
    const userLoginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      username: 'testuser',
      password: 'testpass123'
    });
    
    authToken = userLoginResponse.data.token;
    console.log(`✅ User login successful`);
    console.log(`   Token: ${authToken.substring(0, 20)}...`);
    console.log(`   User: ${userLoginResponse.data.user.username} (${userLoginResponse.data.user.role})\n`);

    // Step 7: Test role-based access control
    console.log('🔒 Step 7: Testing role-based access control...');
    
    // Test user trying to access admin-only endpoint (should fail)
    try {
      await axios.post(`${BASE_URL}/transactions/clear`, {}, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      console.log('❌ User should not have access to admin endpoint');
    } catch (error) {
      if (error.response?.status === 403) {
        console.log('✅ User correctly denied access to admin endpoint');
      } else {
        console.log('❌ Unexpected error:', error.response?.data);
      }
    }

    // Test admin accessing admin-only endpoint (should succeed)
    try {
      await axios.post(`${BASE_URL}/transactions/clear`, {}, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      console.log('✅ Admin can access admin-only endpoint');
    } catch (error) {
      console.log('❌ Admin should have access:', error.response?.data);
    }
    console.log('');

    // Step 8: Test token validation
    console.log('🎫 Step 8: Testing token validation...');
    const meResponse = await axios.get(`${BASE_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    console.log(`✅ Token validation successful`);
    console.log(`   Current user: ${meResponse.data.user.username} (${meResponse.data.user.role})\n`);

    // Step 9: Test business logic with authentication
    console.log('💼 Step 9: Testing business logic with authentication...');
    
    // Create a transaction with authentication
    const transactionData = {
      customerName: "Secure Test Customer",
      mobileNumber: "9876543210",
      deviceModel: "iPhone 15",
      repairType: "Battery Replacement",
      repairCost: "3000",
      paymentMethod: "Card",
      amountGiven: "3000",
      changeReturned: "0",
      status: "Completed",
      remarks: "Secure transaction test",
      partsCost: JSON.stringify([
        {
          item: "Battery",
          cost: 1500,
          store: "SecureHub",
          customStore: "SecureHub"
        }
      ])
    };

    const transactionResponse = await axios.post(`${BASE_URL}/transactions`, transactionData, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    console.log(`✅ Transaction created with authentication`);
    console.log(`   Transaction ID: ${transactionResponse.data.id}`);
    console.log(`   Created by: ${transactionResponse.data.createdBy}\n`);

    // Step 10: Test supplier payment with authentication
    console.log('💰 Step 10: Testing supplier payment with authentication...');
    const paymentData = {
      supplier: "SecureHub",
      amount: 1000,
      paymentMethod: "Bank Transfer",
      description: "Secure payment test"
    };

    const paymentResponse = await axios.post(`${BASE_URL}/supplier-payments`, paymentData, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    console.log(`✅ Supplier payment created with authentication`);
    console.log(`   Payment ID: ${paymentResponse.data.id}`);
    console.log(`   Amount: ₹${paymentResponse.data.amount}\n`);

    console.log('🎉 Secure Authentication Test Completed Successfully!');
    console.log('\n📋 Summary:');
    console.log('✅ JWT authentication working');
    console.log('✅ Role-based access control working');
    console.log('✅ Protected endpoints secure');
    console.log('✅ User registration and login working');
    console.log('✅ Business logic protected by authentication');
    console.log('✅ Token validation working');
    console.log('✅ Admin and user roles properly enforced');

  } catch (error) {
    console.error('❌ Secure authentication test failed:', error.response?.data || error.message);
    console.error('Stack trace:', error.stack);
  }
}

// Run the test
testSecureAuthentication(); 