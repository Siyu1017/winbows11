const readline = require('readline');
const fs = require('fs');
const path = require('path');

// Create an interface for input and output
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const askQuestion = (question) => {
    return new Promise((resolve) => {
        rl.question(question, (answer) => {
            resolve(answer);
        });
    });
};

// Main async function
const main = async () => {
    // Get user input using await
    const packagePath = await askQuestion('What is your package path? ');

    // Close the readline interface
    rl.close();

    try {
        const rawJson = fs.readFileSync(path.join(packagePath, '/package.json'));
        const json = await JSON.parse(rawJson);
        const files = json.files;
        if (files) {
            for (let i = 0; i < files.length; i++) {
                await fs.cpSync(path.join(packagePath, '/', files[i]), path.join('../wrt_modules/'));
            }
        }
    } catch (err) {

    }
};

// Call the main async function
main();