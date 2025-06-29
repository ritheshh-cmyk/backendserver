import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:10000';

async function testAuth() {
  console.log('🧪 Testing Authentication System\n');

  const users = [
    { username: 'rithesh', password: '7989002273', role: 'admin' },
    { username: 'rajashekar', password: 'raj99481', role: 'owner' },
    { username: 'sravan', password: 'sravan6565', role: 'worker' }
  ];

  for (const user of users) {
    console.log(`🔐 Testing login for ${user.username} (${user.role})...`);
    
    try {
      const response = await fetch(`${BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: user.username,
          password: user.password
        })
      });

      const data = await response.json();

      if (response.ok) {
        console.log(`✅ Login successful for ${user.username}`);
        console.log(`   Role: ${data.user.role}`);
        console.log(`   Token: ${data.token.substring(0, 20)}...`);
        
        // Test getting user info with token
        const userResponse = await fetch(`${BASE_URL}/api/auth/me`, {
          headers: {
            'Authorization': `Bearer ${data.token}`,
            'Content-Type': 'application/json',
          }
        });

        if (userResponse.ok) {
          const userData = await userResponse.json();
          console.log(`✅ User info retrieved: ${userData.user.username} (${userData.user.role})`);
        } else {
          console.log(`❌ Failed to get user info`);
        }

        // Test role-based access
        if (user.role === 'admin') {
          const usersResponse = await fetch(`${BASE_URL}/api/users`, {
            headers: {
              'Authorization': `Bearer ${data.token}`,
              'Content-Type': 'application/json',
            }
          });

          if (usersResponse.ok) {
            const usersData = await usersResponse.json();
            console.log(`✅ Admin can access users list (${usersData.length} users)`);
          } else {
            console.log(`❌ Admin cannot access users list`);
          }
        }

      } else {
        console.log(`❌ Login failed for ${user.username}: ${data.error}`);
      }
    } catch (error) {
      console.log(`❌ Error testing ${user.username}: ${error.message}`);
    }
    
    console.log('');
  }

  // Test invalid credentials
  console.log('🔐 Testing invalid credentials...');
  try {
    const response = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: 'invalid',
        password: 'wrong'
      })
    });

    const data = await response.json();
    if (!response.ok) {
      console.log(`✅ Invalid credentials properly rejected: ${data.error}`);
    } else {
      console.log(`❌ Invalid credentials were accepted (security issue!)`);
    }
  } catch (error) {
    console.log(`❌ Error testing invalid credentials: ${error.message}`);
  }

  console.log('\n🎉 Authentication system test completed!');
}

testAuth().catch(console.error); 