import express from 'express';
import bodyParser from 'body-parser';
import axios from 'axios';

const app = express();
import * as dotenv from 'dotenv'
import path from 'path';
import fs from 'fs';
import {createResponseBody} from "./helpers.js";

dotenv.config({path: path.resolve('../.env')})

const LOCAL_WIN_PORT = process.env.LOCAL_WIN_PORT || 3000;
const EXTERNAL_WAN_PORT = process.env.EXTERNAL_WAN_PORT || 4000;
const BEARER_TOKEN = `Bearer ${process.env.BEARER_TOKEN}`;
const STABLE_DIFFUSION_ENDPOINT = process.env.STABLE_DIFFUSION_ENDPOINT;

const FAKE_GENERATED_JSON = JSON.parse(fs.readFileSync(path.resolve('../samples/generate-sample.json'), 'utf8'));

const authenticateRequest = (req, res, next) => {
    const {authorization} = req.headers;
    if (authorization === BEARER_TOKEN) {
        next();
    } else {
        res.status(401).send('Unauthorized');
    }
}

let isGenerating = false;

// use authenticationRequest middleware to authenticate requests
app.use(authenticateRequest);
app.use(bodyParser.json());

app.get('/hello', (req, res) => res.send('Goodbye!'));

app.get('/fake-generate', (req, res) => {
    res.status(200).json(FAKE_GENERATED_JSON);
});

app.get('/is-busy', (req, res) => {
    res.status(200).json({isGenerating});
});

app.get('/generate', async (req, res) => {
    try {
        if(!isGenerating) {
            isGenerating = true;
            const prompt = req.query.prompt;
            const steps = req.query.steps || 30;

            console.log("prompt: ", prompt);

            const body = JSON.stringify(createResponseBody({prompt, steps}));
            console.log(body);

            const response = await axios.get(STABLE_DIFFUSION_ENDPOINT, {
                data: body
            });

            if (response.status === 200 && response.data) {
                res.status(200).json(response.data);
                return;
            }
        } else {
            res.status(500).json({error: 'Already generating'});
            return;
        }

    } catch (error) {
        console.log(error);
    } finally {
        isGenerating = false;
    }

    res.status(500).json({error: 'Something went wrong'});
});

// listen
app.listen(LOCAL_WIN_PORT, () => console.log(`Listening on port ${LOCAL_WIN_PORT}`));