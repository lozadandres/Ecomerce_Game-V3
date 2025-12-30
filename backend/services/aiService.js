const { GoogleGenerativeAI } = require("@google/generative-ai");

require("dotenv").config();

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

/**
 * Generate product recommendations based on cart items.
 * @param {Array} cartItems - List of items in the cart (with name, category, etc.)
 * @param {Array} allProducts - List of all available products (to map back suggestions to real DB items)
 * @param {Object} modelOverride - Optional mock model for testing.
 * @returns {Promise<Array>} - List of recommended product objects.
 */
async function generateRecommendations(cartItems, allProducts, modelOverride = null) {
    const targetModel = modelOverride || model;

    if (!cartItems || cartItems.length === 0) {
        // Return first 4 items as "Trending" if cart is empty
        return allProducts.slice(0, 4);
    }

    // Helper to extract platform/family
    const getPlatforms = (items) => {
        const platforms = new Set();
        items.forEach(item => {
            const cats = item.Categorias || (item.Categoria ? [item.Categoria] : []);
            cats.forEach(c => {
                if (c.type === 'Plataforma') {
                    platforms.add(c.name.toLowerCase());
                }
            });
        });
        return Array.from(platforms);
    };

    const cartPlatforms = getPlatforms(cartItems);

    // FILTER CATALOG: Zero Tolerance starts here.
    // If cart has a platform, catalog only contains items of that same platform family.
    let filteredCatalog = allProducts;
    if (cartPlatforms.length > 0) {
        filteredCatalog = allProducts.filter(p => {
            const pCats = p.Categorias || (p.Categoria ? [p.Categoria] : []);
            const pPlatforms = pCats.filter(c => c.type === 'Plataforma').map(c => c.name.toLowerCase());
            
            // If product has no platform, include it (merchandise/general)
            if (pPlatforms.length === 0) return true;
            
            // If product has a platform, it MUST match one of the cart's platforms
            return pPlatforms.some(pp => cartPlatforms.includes(pp));
        });
    }

    // Helper to format categories clearly for AI
    const formatCatsDetailed = (obj) => {
        const cats = obj.Categorias || (obj.Categoria ? [obj.Categoria] : []);
        const platforms = cats.filter(c => c.type === 'Plataforma').map(c => c.name);
        const series = cats.filter(c => c.type === 'Serie').map(c => c.name);
        const genres = cats.filter(c => c.type === 'Genero').map(c => c.name);
        
        let detail = "";
        if (platforms.length > 0) detail += `PLATAFORMA: ${platforms.join(', ')} | `;
        if (series.length > 0) detail += `SERIE: ${series.join(', ')} | `;
        if (genres.length > 0) detail += `GÉNERO: ${genres.join(', ')}`;
        return detail || "General";
    };

    // Prepare context
    const cartContext = cartItems.map(item =>
        `- ${item.name} (${formatCatsDetailed(item)}, Precio: $${item.price})`
    ).join("\n");

    const productCatalog = filteredCatalog.map(p =>
        `- ID: ${p.id}, Nombre: ${p.name}, ${formatCatsDetailed(p)}, Precio: $${p.price}`
    ).join("\n");

    const prompt = `
    Eres un asistente de ventas experto en videojuegos.
    
    PRODUCTOS EN EL CARRITO:
    ${cartContext}
    
    CATÁLOGO DISPONIBLE (FILTRADO POR PLATAFORMA COMPATIBLE):
    ${productCatalog}
    
    INSTRUCCIONES CRÍTICAS:
    1. **CANTIDAD:** Recomienda **exactamente 4** productos del catálogo. Es MANDATORIO llegar a este número si el catálogo tiene suficientes productos de la misma plataforma/familia.
    2. **REGLA DE CONSOLA:** Si el usuario tiene un juego pero NO tiene una consola en el carrito, puedes recomendar la consola de la MISMA PLATAFORMA.
    3. **PRIORIDAD (BROAD MATCH):**
       - Nivel 1: Misma Serie (ej. Xbox 360) + Mismo Género (ej. Acción).
       - Nivel 2: Misma Serie + Diferente Género. **(IMPORTANTE: Recomienda estos si no hay más del Nivel 1)**.
       - Nivel 3: Misma Familia (ej. Xbox) + Mismo Género.
       - Nivel 4: Misma Familia + Diferente Género.
    4. **OBJETIVO:** El usuario quiere ver variedad dentro de su consola. NO te limites solo al género. Si compra un juego de fútbol, también recomiéndale juegos de disparos o acción SIEMPRE QUE sean para la misma consola.
    
    Devuelve SOLAMENTE un array JSON con los IDs de los Productos.
    Ejemplo: [1, 2, 3, 4]
  `;

    try {
        const result = await targetModel.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        const cleanedText = text.replace(/```json/g, "").replace(/```/g, "").trim();
        const recommendedIds = JSON.parse(cleanedText);

        if (!Array.isArray(recommendedIds)) return [];

        // Return only items that were in the filtered catalog
        return filteredCatalog.filter(p => recommendedIds.includes(p.id));

    } catch (error) {
        console.error("Error generating recommendations:", error);
        const cartIds = cartItems.map(i => i.id);
        return filteredCatalog.filter(p => !cartIds.includes(p.id)).slice(0, 4);
    }
}

/**
 * Process a chat message using user context (cart, behavior).
 */
async function processChatRequest(userMessage, cartItems = [], behaviorContext = {}, allProducts = []) {
    const chatModel = model;

    const cartStr = cartItems.map(i => `- ${i.name} ($${i.price})`).join('\n') || "El carrito está vacío.";
    const behaviorStr = behaviorContext.type === 'abandonment' 
        ? "El usuario parece estar a punto de abandonar la página o lleva mucho tiempo inactivo."
        : "Navegación normal.";

    // Provide a small sample of the catalog so it knows what we have
    const catalogSample = allProducts.length > 0
        ? allProducts.slice(0, 10).map(p => `- ${p.name}: $${p.price}`).join('\n')
        : "Catálogo no disponible.";

    const prompt = `
    Eres "Joystick AI", un asistente de ventas experto, amigable y entusiasta para una tienda de videojuegos y tecnología llamada EpicPlay Store.
    
    INFORMACIÓN IMPORTANTE DE LA TIENDA:
    - Envío: GRATIS en compras mayores a $150. Para el resto, el costo es de $10 y tarda de 2 a 4 días hábiles.
    - Ubicación: Somos una tienda 100% online con cobertura nacional.
    
    CONTEXTO DEL USUARIO:
    - Productos en Carrito:
    ${cartStr}
    - Comportamiento Detectado: ${behaviorStr}
    
    ALGUNOS PRODUCTOS DISPONIBLES:
    ${catalogSample}
    
    INSTRUCCIONES:
    1. Si el usuario pregunta por tiempos de entrega, responde: "El envío tarda de 2 a 4 días hábiles".
    2. Si pregunta por costos de envío, menciona que es gratis en compras superiores a $150.
    3. Si el usuario parece estar abandonando, ofrécele ayuda amablemente.
    4. Responde SIEMPRE en español de forma concisa (máximo 3 frases).
    5. No inventes precios. Si no sabes el precio de algo específico, invita al usuario a revisar el catálogo.
    
    MENSAJE DEL USUARIO:
    "${userMessage}"
    
    Respuesta:`;

    try {
        const result = await chatModel.generateContent(prompt);
        const response = await result.response;
        return response.text().trim();
    } catch (error) {
        console.error("Error in processChatRequest:", error);
        return "¡Hola! Soy tu asistente. Estoy teniendo un problema momentáneo para conectarme a mi base de datos de conocimiento, pero puedo decirte que el envío es gratis en compras mayores a $150. ¿En qué más puedo ayudarte?";
    }
}

module.exports = {
    generateRecommendations,
    processChatRequest
};
