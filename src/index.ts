import { App } from './app'
require('dotenv').config()

async function main() {
    const app = new App();
    await app.listen();
}

main();