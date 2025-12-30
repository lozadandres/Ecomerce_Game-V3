const { Sequelize, DataTypes } = require("sequelize");
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, '.env') });

const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASSWORD, {
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  dialect: "postgres",
  logging: false,
});

const Usuario = sequelize.define("Usuario", {
  name: { type: DataTypes.STRING, allowNull: false },
  email: { type: DataTypes.STRING, allowNull: false, unique: true },
  password: { type: DataTypes.STRING, allowNull: false },
  isAdmin: { type: DataTypes.BOOLEAN, defaultValue: false },
  isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
});

async function promote() {
    try {
        await sequelize.authenticate();
        console.log("Conectado a DB.");
        const user = await Usuario.findOne({ where: { email: 'testadmin@example.com' } });
        if (user) {
            user.isAdmin = true;
            await user.save();
            console.log("Usuario testadmin@example.com promovido a ADMIN.");
        } else {
            console.log("Usuario no encontrado.");
        }
    } catch (e) {
        console.error(e);
    } finally {
        await sequelize.close();
    }
}
promote();
