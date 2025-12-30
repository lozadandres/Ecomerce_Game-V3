const axios = require('axios');

async function testLogin() {
    try {
        console.log('Attempting login with: lozadaandres955@gmail.com / 12345678');
        const response = await axios.post('http://localhost:5000/login', {
            email: 'lozadaandres955@gmail.com',
            password: '12345678'
        });
        console.log('Login Success:', response.data);
    } catch (error) {
        if (error.response) {
            console.log('Login Failed:', error.response.status, error.response.data);
        } else {
            console.log('Error:', error.message);
        }
    }
}

testLogin();
