const { Sequelize } = require('sequelize');
const fs = require('fs');
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, '.env') });

const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASSWORD, {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: 'postgres',
    logging: false
});

async function checkUsers() {
    try {
        const [users] = await sequelize.query('SELECT id, name, email, password, "isAdmin" FROM "Usuarios"');
        const output = JSON.stringify(users, null, 2);
        fs.writeFileSync('check_users_output.txt', output);
        console.log("Done writing to file.");
    } catch (error) {
        console.error('Error fetching users:', error);
    } finally {
        await sequelize.close();
    }
}

checkUsers();
