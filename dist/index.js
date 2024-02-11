"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const fs_1 = require("fs");
const app = (0, express_1.default)();
const port = 8000;
const dataFilePath = './data.json';
async function readJsonFile(filePath) {
    try {
        const fileContent = await fs_1.promises.readFile(filePath, 'utf8');
        return JSON.parse(fileContent);
    }
    catch (error) {
        throw new Error(`Error reading file from disk: ${error}`);
    }
}
async function writeJsonFile(filePath, data) {
    try {
        const jsonData = JSON.stringify(data, null, 2); // Pretty prints the JSON
        await fs_1.promises.writeFile(filePath, jsonData, 'utf8');
    }
    catch (error) {
        throw new Error(`Error writing file to disk: ${error}`);
    }
}
async function main() {
    // end points which get the people from the data file,
    //  and the flags from the data file, and returns them as a json,
    //   also an endpoint which flags a user based on their name,
    //    and an endpoint (post) which adds a new user,
    //     and an endpoint put which flags a user based on their name,
    //     and a put endpoint which changes the pasphrase of a user,
    //      and an endpoint (get) which checks if the user is entering in the correct passphrase,
    //       return true or false based on the given passphrase
    app.use(express_1.default.json());
    // This gest the people from the data file
    app.get('/people', async (req, res) => {
        const data = await readJsonFile(dataFilePath);
        res.json(data.people);
    });
    // This gets the flags from the data file
    app.get('/flags', async (req, res) => {
        const data = await readJsonFile(dataFilePath);
        res.json(data.flags);
    });
    // This flags a user based on their name
    app.put('/flag/:name', async (req, res) => {
        const data = await readJsonFile(dataFilePath);
        const name = req.params.name;
        const person = data.people.find((person) => person.name === name);
        if (!person) {
            res.status(404).send('Person not found');
            return;
        }
        person.isFlagged = true;
        data.flags.push(person);
        await writeJsonFile(dataFilePath, data);
        res.json(person);
    });
    // This adds a new user
    app.post('/people', async (req, res) => {
        const data = await readJsonFile(dataFilePath);
        const newPerson = req.body;
        data.people.push(newPerson);
        await writeJsonFile(dataFilePath, data);
        res.json(newPerson);
    });
    // This updates the passphrase of a user
    app.put('/passphrase/:name', async (req, res) => {
        const data = await readJsonFile(dataFilePath);
        const name = req.params.name;
        const person = data.people.find((person) => person.name === name);
        if (!person) {
            res.status(404).send('Person not found');
            return;
        }
        person.passphrase = req.body.passphrase;
        await writeJsonFile(dataFilePath, data);
        res.json(person);
    });
    // Checks if the user is entering in the correct passphrase
    app.get('/passphrase/:name', async (req, res) => {
        const data = await readJsonFile(dataFilePath);
        const name = req.params.name;
        const person = data.people.find((person) => person.name === name);
        if (!person) {
            res.status(404).send('Person not found');
            return;
        }
        res.json(person.passphrase === req.query.passphrase);
    });
    app.listen(port, () => {
        console.log(`Server is running on port ${port}`);
    });
    app.use((req, res) => {
        res.status(404).send('Page not found');
    });
    app.use((err, req, res) => {
        console.error(err.stack);
        res.status(500).send('Something went wrong');
    });
    console.log('Server is starting...');
}
main().catch(console.error);
