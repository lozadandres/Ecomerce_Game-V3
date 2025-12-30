require('dotenv').config();
const { GoogleGenerativeAI } = require("@google/generative-ai");

async function test() {
    console.log("Testing Gemini with API Key:", process.env.GEMINI_API_KEY ? "Found" : "Missing");
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    
    // Testing with different model names if first fails
    const modelsToTry = ["gemini-1.5-flash", "gemini-1.5-pro", "gemini-pro", "gemini-1.0-pro"];
    
    for (const modelName of modelsToTry) {
        console.log(`\nTrying model: ${modelName}`);
        try {
            const model = genAI.getGenerativeModel({ model: modelName });
            const result = await model.generateContent("Hola, responde con la palabra 'OK' si me escuchas.");
            const response = await result.response;
            console.log(`Success with ${modelName}:`, response.text());
        } catch (error) {
            console.error(`Error with ${modelName}:`, error.message);
            // Some errors include a status or errorDetails
            if (error.status) console.error("Status Code:", error.status);
            if (error.response && error.response.data) {
                console.error("Error Data:", JSON.stringify(error.response.data));
            }
        }
    }
}

test();
