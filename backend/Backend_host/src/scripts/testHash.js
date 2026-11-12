const bcrypt = require('bcryptjs');

async function test() {
    const pass = 'Skadmin@2001';
    const hash = await bcrypt.hash(pass, 10);
    console.log('HASH:', hash);
    const valid = await bcrypt.compare(pass, hash);
    console.log('Valid:', valid);
}
test();

