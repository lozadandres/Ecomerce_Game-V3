const { Sequelize } = require('sequelize');
const bcrypt = require('bcryptjs');
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, '.env') });

const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASSWORD, {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: 'postgres',
    logging: false
});

async function resetPassword() {
    try {
        const hashedPassword = await bcrypt.hash('12345678', 10);
        const [updated] = await sequelize.query(`
            UPDATE "Usuarios" 
            SET password = '${hashedPassword}' 
            WHERE email = 'lozadaandres955@gmail.com'
        `);
        console.log('Password reset successfully for lozadaandres955@gmail.com to: 12345678');
    } catch (error) {
        console.error('Error resetting password:', error);
    } finally {
        await sequelize.close();
    }
}

resetPassword();
