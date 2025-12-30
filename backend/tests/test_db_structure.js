const axios = require('axios');
require("dotenv").config();

const BASE_URL = 'http://localhost:5000';

async function testBackend() {
    console.log("=== TESTING BACKEND SCH CHANGES ===");

    // 1. Register Admin User
    let adminId = '1';
    let adminHeaders = { headers: { 'X-User-ID': '1' } };

    try {
        // Try to create a user. If DB is empty, this is Admin.
        const reg = await axios.post(`${BASE_URL}/registro`, {
            name: "Test Admin",
            email: `admin_${Date.now()}@test.com`,
            password: "password123"
        });
        adminId = reg.data.id;
        console.log(`Initialized user ${adminId} (Admin: ${reg.data.isAdmin})`);
        adminHeaders = { headers: { 'X-User-ID': String(adminId) } };

    } catch (e) {
        console.log("Registration skipped or failed (maybe exists). Using ID 1.");
    }

    try {
        // 2. Create Categories with Types
        console.log("Creating Categories...");
        const cat1 = await axios.post(`${BASE_URL}/categorias`, { name: `Genre_${Date.now()}`, type: 'Genre' }, adminHeaders);
        const cat2 = await axios.post(`${BASE_URL}/categorias`, { name: `Platform_${Date.now()}`, type: 'Platform' }, adminHeaders);

        console.log("✅ Created:", cat1.data.name, cat2.data.name);

        // 3. Create Product with Multiple Categories
        console.log("Creating Product with Tags...");
        const product = await axios.post(`${BASE_URL}/productos`, {
            name: "Test Game Multi",
            price: 60,
            description: "Test",
            stock: 10,
            categoriaIds: [cat1.data.id, cat2.data.id]
        }, adminHeaders);

        console.log("✅ Created Product:", product.data.name);

        // 4. Verify Categories in Response
        const pCats = product.data.Categorias;
        if (pCats && pCats.length === 2) {
            console.log("✅ Product has 2 Categories:", pCats.map(c => `${c.name} (${c.type})`).join(', '));
        } else {
            console.error("❌ Product missing categories in response:", pCats);
        }

    } catch (error) {
        console.error("❌ TEST FAILED:", error.response ? error.response.data : error.message);
    }
}

testBackend();
