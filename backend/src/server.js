require('dotenv').config();
const app = require('./app');
require('./config/db');

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`🚀 Server running on: http://localhost:${PORT}`);
    console.log(`📖 Swagger API Docs:  http://localhost:${PORT}/api-docs`);
});
