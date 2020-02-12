const exec = require('child_process').exec;
const readline = require('readline');
let jestCommand = "set NODE_ENV=development&&node --expose-gc node_modules/jest/bin/jest";
const jestHideLogCommand = `${jestCommand} --setupTestFrameworkScriptFile ./tests/setup.js`;

console.log(`
=============================
         jest start          
=============================

`);
const question = "Do you want to show console output message? (Y/N) ";
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const onStreamData = child => {
    console.log();

    child.stdout.on('data', data => {
        console.log(data.replace(/\r\n$|\n$/, ""));
    });

    child.stderr.on('data', data => {
        console.log(data.replace(/\r\n$|\n$/, ""));
    });

    child.on('close', () => {
        console.log("\nAll done!");
        process.exit();
    });
};

const askConsoleLog = () => {
    rl.question(question, answer => {
        let child;
        switch (answer.toUpperCase()) {
            case "Y":
            case "YES":
                child = exec(jestCommand);
                onStreamData(child);

                rl.close();
                break;
            case "N":
            case "NO":
                child = exec(jestHideLogCommand);
                onStreamData(child);

                rl.close();
                break;
            default:
                console.log("Please input Y or N.\n");

                askConsoleLog();
                break;
        }
    });
};

askConsoleLog();