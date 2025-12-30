require('dotenv').config();
const axios = require('axios');

async function testFetch() {
    const apiKey = process.env.GEMINI_API_KEY;
    const model = "gemini-1.5-flash";
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    console.log("Testing direct fetch to:", url.split('?')[0]);

    try {
        const response = await axios.post(url, {
            contents: [{ parts: [{ text: "Hola" }] }]
        });
        console.log("Success:", JSON.stringify(response.data, null, 2));
    } catch (error) {
        console.error("Error Status:", error.response ? error.response.status : "No response");
        if (error.response && error.response.data) {
            console.error("Error Detail:", JSON.stringify(error.response.data, null, 2));
        } else {
            console.error("Error Message:", error.message);
        }
    }
}

testFetch();
