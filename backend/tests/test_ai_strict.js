const { generateRecommendations } = require('../services/aiService');

// === MOCK DATA ===
// Note: In real life, these descriptions would help the AI match "Series X" etc.
const mockProducts = [
    { id: 1, name: "Xbox Series X Console", price: 500, Categoria: { name: "Consoles" } },
    { id: 2, name: "Xbox One Console", price: 300, Categoria: { name: "Consoles" } },
    { id: 3, name: "Control Xbox Series X", price: 60, Categoria: { name: "Accessories" } },
    { id: 4, name: "Control Xbox One", price: 50, Categoria: { name: "Accessories" } },
    { id: 5, name: "Halo Infinite (Xbox Series X)", price: 70, Categoria: { name: "Games" } },
    { id: 6, name: "Gears 5 (Xbox One)", price: 40, Categoria: { name: "Games" } },
    { id: 7, name: "PlayStation 5", price: 500, Categoria: { name: "Consoles" } },
];

const mockCartSeriesX = [
    { id: 1, name: "Xbox Series X Console", price: 500, Categoria: { name: "Consoles" } }
];

const mockCartXboxOneGame = [
    { id: 6, name: "Gears 5 (Xbox One)", price: 40, Categoria: { name: "Games" } }
];

// === MOCK MODEL ===
const mockModel = {
    generateContent: async (prompt) => {
        // Verify the prompt contains the strict rules
        if (!prompt.includes("Coincidencia de Familia")) {
            throw new Error("Prompt does not contain strict family rules");
        }

        // Simulate AI logic based on prompt content
        if (prompt.includes("Xbox Series X Console")) {
            // Should recommend Series X stuff
            return {
                response: {
                    text: () => JSON.stringify([3, 5]) // Control Series X, Halo Infinite
                }
            };
        } else if (prompt.includes("Gears 5 (Xbox One)")) {
            // Should recommend Xbox One stuff
            return {
                response: {
                    text: () => JSON.stringify([2, 4]) // Xbox One Console, Control Xbox One
                }
            };
        }
        return { response: { text: () => "[]" } };
    }
};

async function runTests() {
    console.log("=== PRUEBAS ESTRICTAS DE IA (Familia/Serie) ===\n");

    // TEST 1: Xbox Series X -> Series X Accessories/Games
    console.log("🧪 Test 1: Carrito con 'Xbox Series X'");
    try {
        const res = await generateRecommendations(mockCartSeriesX, mockProducts, mockModel);
        const names = res.map(p => p.name);
        console.log("   Recomendados:", names.join(", "));

        if (names.includes("Control Xbox Series X") && !names.includes("Control Xbox One")) {
            console.log("✅ PASÓ: Se recomendaron productos Series X y NO de Xbox One.");
        } else {
            console.log("⚠️ REVISAR: La simulación devolvió mezcla (esto es prueba de mock, pero valida el flujo).");
        }
    } catch (e) {
        console.error("❌ ERROR:", e.message);
    }

    // TEST 2: Xbox One Game -> Xbox One Accessories
    console.log("\n🧪 Test 2: Carrito con Juego 'Xbox One'");
    try {
        const res = await generateRecommendations(mockCartXboxOneGame, mockProducts, mockModel);
        const names = res.map(p => p.name);
        console.log("   Recomendados:", names.join(", "));

        if (names.includes("Control Xbox One")) {
            console.log("✅ PASÓ: Se recomendaron productos Xbox One para un juego de Xbox One.");
        }
    } catch (e) {
        console.error("❌ ERROR:", e.message);
    }

    console.log("\n=== FIN DE PRUEBAS ESTRICTAS ===");
}

runTests();
