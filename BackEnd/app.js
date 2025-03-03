import express from 'express';
import connect from './db/db.js';
import cors from 'cors';

await connect();

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
    res.send('Hello World');
});

app.listen(3000, () => {
    console.log("Server is running on port 3000");
});
