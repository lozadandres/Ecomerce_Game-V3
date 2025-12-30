const { Sequelize } = require("sequelize");
require("dotenv").config();

const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASSWORD, {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: "postgres",
    logging: false,
});

async function checkStructure() {
    try {
        // Ver columnas de Productos
        const [columns] = await sequelize.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'Productos'
      ORDER BY ordinal_position
    `);

        console.log("📋 Columnas de la tabla Productos:\n");
        columns.forEach(c => console.log(`  - ${c.column_name} (${c.data_type})`));

        // Ver datos de ProductoCategoria
        const [relations] = await sequelize.query(`
      SELECT * FROM "ProductoCategoria" LIMIT 5
    `);

        console.log(`\n🔗 Relaciones en ProductoCategoria: ${relations.length} registros\n`);
        if (relations.length > 0) {
            console.log("Ejemplo:", relations[0]);
        }

    } catch (error) {
        console.error("❌ Error:", error.message);
    } finally {
        await sequelize.close();
    }
}

checkStructure();
