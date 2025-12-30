const { Sequelize } = require("sequelize");
require("dotenv").config();

const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASSWORD, {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: "postgres",
    logging: false,
});

async function migrateCategories() {
    try {
        console.log("🔄 Iniciando migración de categorías...\n");

        // 1. Buscar todos los productos que tienen CategoriaId
        const [productos] = await sequelize.query(`
      SELECT id, "CategoriaId" 
      FROM "Productos" 
      WHERE "CategoriaId" IS NOT NULL
    `);

        console.log(`📦 Encontrados ${productos.length} productos con categoría antigua\n`);

        if (productos.length === 0) {
            console.log("✅ No hay productos para migrar");
            await sequelize.close();
            return;
        }

        // 2. Para cada producto, crear la relación
        let migrated = 0;
        let skipped = 0;

        for (const producto of productos) {
            const [existing] = await sequelize.query(`
        SELECT * FROM "ProductoCategoria" 
        WHERE "ProductoId" = ${producto.id} 
        AND "CategoriaId" = ${producto.CategoriaId}
      `);

            if (existing.length === 0) {
                await sequelize.query(`
          INSERT INTO "ProductoCategoria" ("ProductoId", "CategoriaId", "createdAt", "updatedAt")
          VALUES (${producto.id}, ${producto.CategoriaId}, NOW(), NOW())
        `);
                console.log(`✅ Producto #${producto.id} → Categoría #${producto.CategoriaId}`);
                migrated++;
            } else {
                console.log(`⏭️  Producto #${producto.id} ya migrado`);
                skipped++;
            }
        }

        console.log(`\n✨ Migración completada:`);
        console.log(`   - ${migrated} relaciones creadas`);
        console.log(`   - ${skipped} ya existían\n`);

    } catch (error) {
        console.error("❌ Error:", error.message);
    } finally {
        await sequelize.close();
    }
}

migrateCategories();
