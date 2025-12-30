const { generateRecommendations } = require('../services/aiService');

// === MOCK DATA ===
const mockProducts = [
    { id: 1, name: "PlayStation 5", price: 500, Categoria: { name: "Consoles" } },
    { id: 2, name: "Xbox Series X", price: 500, Categoria: { name: "Consoles" } },
    { id: 3, name: "PS5 Controller", price: 70, Categoria: { name: "Accessories" } },
    { id: 4, name: "Xbox Controller", price: 65, Categoria: { name: "Accessories" } },
    { id: 5, name: "Elden Ring", price: 60, Categoria: { name: "Games" } },
    { id: 6, name: "FIFA 24", price: 60, Categoria: { name: "Games" } },
    { id: 7, name: "Gaming Headset", price: 100, Categoria: { name: "Accessories" } },
    { id: 8, name: "Gaming Chair", price: 200, Categoria: { name: "Furniture" } },
];

const mockCartConsole = [
    { id: 1, name: "PlayStation 5", price: 500, Categoria: { name: "Consoles" } }
];

const mockCartGame = [
    { id: 5, name: "Elden Ring", price: 60, Categoria: { name: "Games" } }
];

// === MOCK MODEL ===
const mockModel = {
    generateContent: async (prompt) => {
        console.log("\n[MOCK AI] Received Prompt Length:", prompt.length);

        // Simple logic to simulate AI behavior for testing
        if (prompt.includes("PlayStation 5")) {
            return {
                response: {
                    text: () => JSON.stringify([3, 7, 5, 8]) // Controller, Headset, Game, Chair
                }
            };
        } else if (prompt.includes("Elden Ring")) {
            return {
                response: {
                    text: () => "```json\n[1, 6, 4, 8]\n```" // Test markdown stripping
                }
            };
        }
        return { response: { text: () => "[]" } };
    }
};

async function runTests() {
    console.log("=== INICIANDO PRUEBAS DE RECOMENDACIONES IA ===\n");

    // TEST 1: Verificar carrito vacío (Fallback)
    console.log("🧪 Test 1: Carrito vacío (Debe retornar fallback)");
    const resEmpty = await generateRecommendations([], mockProducts, mockModel);
    if (resEmpty.length === 4 && resEmpty[0].id === 1) {
        console.log("✅ PASÓ: Retornó productos default para carrito vacío.");
    } else {
        console.error("❌ FALLÓ: Respuesta inesperada para carrito vacío.", resEmpty);
    }

    // TEST 2: Simulación Consola en Carrito (Mock AI)
    console.log("\n🧪 Test 2: Consola en Carrito (Mock IA Response: Accesorios)");
    const resConsole = await generateRecommendations(mockCartConsole, mockProducts, mockModel);
    const expectedIds = [3, 7, 5, 8];
    const actualIds = resConsole.map(p => p.id);

    if (JSON.stringify(actualIds) === JSON.stringify(expectedIds)) {
        console.log("✅ PASÓ: La IA recomendó accesorios correctamente (según mock).");
        console.log("   Recomendados:", resConsole.map(p => p.name).join(", "));
    } else {
        console.error("❌ FALLÓ: IDs no coinciden.", actualIds);
    }

    // TEST 3: Simulación Juego en Carrito + Limpieza de Markdown (Mock AI)
    console.log("\n🧪 Test 3: Juego en Carrito (Mock IA Response con Markdown json)");
    const resGame = await generateRecommendations(mockCartGame, mockProducts, mockModel);
    if (resGame.length === 4 && resGame[0].id === 1) {
        console.log("✅ PASÓ: Se limpió el markdown y se parseó el JSON correctamente.");
        console.log("   Recomendados:", resGame.map(p => p.name).join(", "));
    } else {
        console.error("❌ FALLÓ: Error al parsear respuesta con markdown.", resGame);
    }

    // TEST 4: Integrity - Manejo de errores
    console.log("\n🧪 Test 4: Manejo de Errores (Mock AI falla)");
    const errorModel = {
        generateContent: async () => { throw new Error("API Error"); }
    };
    const resError = await generateRecommendations(mockCartConsole, mockProducts, errorModel);
    // Debe retornar fallback (top 4 que no estén en carrito)
    // Cart has ID 1. All products 1..8. Should return 2,3,4,5
    if (resError.length === 4 && resError[0].id === 2) {
        console.log("✅ PASÓ: El sistema se recuperó del error de IA usando fallback.");
    } else {
        console.error("❌ FALLÓ: No se manejó el error correctamente.", resError);
    }

    console.log("\n=== PRUEBAS FINALIZADAS ===");
}

runTests();
