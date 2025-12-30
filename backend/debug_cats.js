const { Sequelize, DataTypes } = require("sequelize");
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, '.env') });

const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASSWORD, {
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  dialect: "postgres",
  logging: false,
});

const Categoria = sequelize.define("Categoria", {
  name: { type: DataTypes.STRING },
  type: { type: DataTypes.STRING },
});

(async () => {
    try {
        const cats = await Categoria.findAll();
        console.log("CATEGORIES_START");
        console.log(JSON.stringify(cats, null, 2));
        console.log("CATEGORIES_END");
    } catch (e) {
        console.error(e);
    } finally {
        await sequelize.close();
    }
})();
