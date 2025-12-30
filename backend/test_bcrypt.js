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

async function testBcrypt() {
    try {
        const [users] = await sequelize.query("SELECT * FROM \"Usuarios\" WHERE email = 'lozadaandres955@gmail.com'");
        if (users.length === 0) {
            console.log('User not found');
            return;
        }
        const user = users[0];
        console.log('User found:', user.email);
        console.log('Stored Hash:', user.password);
        
        const isMatch = await bcrypt.compare('12345678', user.password);
        console.log('Bcrypt Match:', isMatch);
        
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await sequelize.close();
    }
}

testBcrypt();
