import express, { Request, Response } from 'express';
import { promises as fs } from 'fs';
import cors = require('cors');
const cookieParser = require('cookie-parser');

const app = express();
const port = 7070;
const dataFilePath = './data.json';

type Person = {
  name: string; // Name of the person
  browsers: string[]; // List of cookies, unique id's of the browser
  passphrase: string; // Pasphrase user uses
  isFlagged?: boolean;
  timesFlagged: number;
};

type Data = {
  people: Person[];
  flags: Person[]; 
  uuid: number; // Current UUID, used to increment the UUID
  visits: number; // Number of visits
};

async function readJsonFile<T>(filePath: string): Promise<T> {
  try {
    const fileContent = await fs.readFile(filePath, 'utf8');
    return JSON.parse(fileContent) as T;
  } catch (error) {
    throw new Error(`Error reading file from disk: ${error}`);
  }
}

async function writeJsonFile<T>(filePath: string, data: T): Promise<void> {
  try {
    const jsonData = JSON.stringify(data, null, 2); // Pretty prints the JSON
    await fs.writeFile(filePath, jsonData, 'utf8');
  } catch (error) {
    throw new Error(`Error writing file to disk: ${error}`);
  }
}

async function checkLogin(name: string, passphrase: string, uuid: number): Promise<boolean> {
  const data = await readJsonFile<Data>(dataFilePath);
  const person = data.people.find((person) => person.name === name);

  if (!person) {
    return false;
  }

  if (person.passphrase === passphrase && person.browsers.includes(uuid.toString())) {
    return true;
  }

  // Flag the user if the passphrase is correct but the browser is not in the list
  if(person.passphrase === passphrase && !person.browsers.includes(uuid.toString())) {
    person.timesFlagged++;
    
    if(!person.isFlagged){
      person.isFlagged = true;
      data.flags.push(person);
    }

    await writeJsonFile(dataFilePath, data);
    return false;
  }

  console.log("Shouldnt be here?\n ", name, passphrase, uuid);

  return false;
}

async function main() {
  app.use(express.json());
  app.use(cookieParser({
    withCredentials: true 
  }));
  app.use(cors({
    origin: 'http://127.0.0.1:8443',
    credentials: true,
  }));

  app.get('/', async (req: Request, res: Response) => {
    const data = await readJsonFile<Data>(dataFilePath);

    const uuid = parseInt(req.cookies.uuid);    

    data.visits++;
    await writeJsonFile(dataFilePath, data);
    
    if(!uuid) {
      const oneYearInMs = 365 * 24 * 60 * 60 * 1000; // Milliseconds in a year
      res.cookie('uuid', (data.uuid + 1).toString(), { maxAge: oneYearInMs, expires: new Date(Date.now() + oneYearInMs) , httpOnly: true, sameSite: 'none', secure: true, path: '/'});
      // Add 1 to the uuid in data file
      data.uuid++;
      await writeJsonFile(dataFilePath, data);

      res.send('Welcome to the site! Your UUID is: ' + (data.uuid) + "\nVisits: " + data.visits);
      return;
    }

    res.send("Welcome back! Your UUID is: " + uuid + "\nVisits: " + data.visits);
  });

  // Login check
  app.get('/check', (req: Request, res: Response) => {
    const name = req.query.name as string;
    const passphrase = req.query.pass as string;
    const uuid = parseInt(req.cookies.uuid);

    console.log(uuid);
    console.log(passphrase);
    console.log(name);

    if (!name || !uuid || !passphrase) {
      res.status(400).send('Invalid input: '+ name + " "  + uuid + " " +  passphrase);
      return;
    }

    checkLogin(name, passphrase, uuid).then((result) => {
      console.log(result);
      res.send({result});
    });
  });

  app.get('/checkuuid', (req: Request, res: Response) => {
    const uuid = parseInt(req.query.uuid as string);

    if (!uuid) {
      res.status(400).send('Invalid input');
      return;
    }

    const check = async () => {
      const data = await readJsonFile<Data>(dataFilePath);
      const person = data.people.find((person) => person.browsers.includes(uuid.toString()));

      if(person){
        return true;
      }
      return false;
    };

    check().then((result) => {
      console.log(result);
      res.send({result});
    });
  });

  // This gest the people from the data file
  app.get('/people', async (req: Request, res: Response) => {
    const data = await readJsonFile<Data>(dataFilePath);
    res.json(data.people);
  });

  // This gets one person from the data file
  app.get('/people/:name', async (req: Request, res: Response) => {
    const data = await readJsonFile<Data>(dataFilePath);
    const name = req.params.name;
    const person = data.people.find((person) => person.name === name);
    if (!person) {
      res.status(404).send('Person not found');
      return;
    }
    res.json(person);
  });

  // This gets the flags from the data file
  app.get('/flags', async (req: Request, res: Response) => {
    const data = await readJsonFile<Data>(dataFilePath);
    res.json(data.flags);
  });

  // This adds a new user
  app.post('/people', async (req: Request, res: Response) => {
    const data = await readJsonFile<Data>(dataFilePath);
    const newPerson = req.body as Person;
    data.people.push(newPerson);
    await writeJsonFile(dataFilePath, data);
    res.json(newPerson);
  });

  // This updates the passphrase of a user
  app.put('/passphrase/:name', async (req: Request, res: Response) => {
    const data = await readJsonFile<Data>(dataFilePath);
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


  app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  });

  app.use((req, res) => {
    res.status(404).send('Page not found');
  });

  app.use((err: Error, req: Request, res: Response) => {
    console.error(err.stack);
    res.status(500).send('Something went wrong');
  });

  process.on('SIGINT', function() {
    console.log( "\nGracefully shutting down from SIGINT (Ctrl-C)" );
    // some other closing procedures go here
    process.exit(0);
  });

  console.log('Server is starting...');
}

main().catch(console.error);