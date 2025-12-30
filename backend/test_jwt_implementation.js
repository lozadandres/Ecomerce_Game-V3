const axios = require('axios');

const API_URL = 'http://localhost:5000';

// Colors for console output
const colors = {
    reset: "\x1b[0m",
    green: "\x1b[32m",
    red: "\x1b[31m",
    yellow: "\x1b[33m",
    blue: "\x1b[34m"
};

async function runTests() {
    console.log(`${colors.blue}=== INICIANDO TEST DE VERIFICACIÓN JWT ===${colors.reset}\n`);

    let token = '';
    let adminEmail = 'testadmin@example.com';
    let adminPassword = 'password123';

    // 1. Intentar Login (o Registro si falla) para obtener Token
    // Primero intentamos registrar un admin de prueba por si no existe
    try {
        console.log("1. Intentando registrar usuario admin de prueba...");
        await axios.post(`${API_URL}/registro`, {
            name: "Test Admin",
            email: adminEmail,
            password: adminPassword,
            isAdmin: true
        });
        console.log(`${colors.green}✔ Usuario registrado correctamente${colors.reset}`);
    } catch (error) {
        if (error.response && error.response.status === 400) {
            console.log(`${colors.yellow}⚠ El usuario ya existe, procediendo al login.${colors.reset}`);
        } else {
            console.log(`${colors.red}✘ Error en registro: ${error.message}${colors.reset}`);
        }
    }

    // 2. Login para obtener token
    try {
        console.log("\n2. Intentando Login...");
        const response = await axios.post(`${API_URL}/login`, {
            email: adminEmail,
            password: adminPassword
        });

        if (response.data.token) {
            token = response.data.token;
            console.log(`${colors.green}✔ Login exitoso. Token recibido:${colors.reset}`);
            console.log(`${colors.green}${token.substring(0, 20)}...${colors.reset}`);
        } else {
            console.error(`${colors.red}✘ Login falló: No se recibió token en la respuesta.${colors.reset}`);
            process.exit(1);
        }
    } catch (error) {
        console.error(`${colors.red}✘ Error fatal en login: ${error.message}${colors.reset}`);
        if(error.response) console.log(error.response.data);
        process.exit(1);
    }

    // 3. Probar ruta protegida SIN token
    try {
        console.log("\n3. Probando acceso a ruta protegida (/usuarios) SIN token...");
        await axios.get(`${API_URL}/usuarios`);
        console.error(`${colors.red}✘ FALLO: La ruta permitió acceso sin token.${colors.reset}`);
    } catch (error) {
        if (error.response && error.response.status === 401) {
            console.log(`${colors.green}✔ ÉXITO: Acceso denegado correctamente (401).${colors.reset}`);
        } else {
            console.error(`${colors.red}✘ Respuesta inesperada: ${error.message}${colors.reset}`);
        }
    }

    // 4. Probar ruta protegida CON token
    try {
        console.log("\n4. Probando acceso a ruta protegida (/usuarios) CON token...");
        const response = await axios.get(`${API_URL}/usuarios`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.status === 200) {
            console.log(`${colors.green}✔ ÉXITO: Acceso autorizado correctamente.${colors.reset}`);
            console.log(`   Se obtuvieron ${response.data.length} usuarios.`);
        } else {
            console.error(`${colors.red}✘ Fallo: Status code ${response.status}${colors.reset}`);
        }
    } catch (error) {
        console.error(`${colors.red}✘ Error al acceder con token: ${error.message}${colors.reset}`);
        if(error.response) console.log(error.response.data);
    }

    console.log(`\n${colors.blue}=== FIN DEL TEST ===${colors.reset}`);
}

runTests();
