import fetch from "node-fetch";
import * as config from "./bot-config.js";

function checkForPngSignature(buffer) {
    const pngSignature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
    return buffer.slice(0, 8).equals(pngSignature);
}

async function fetchEndpoint(endpoint, params) {
    const url = new URL(`${config.communicatorEndpoint}${endpoint}`);
    url.search = new URLSearchParams(params).toString();
    const request = await fetch(url, {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${config.BEARER_TOKEN}`
        }
    });

    if (request.ok) {
        const response = await request.json();
        return response;
    }

    throw new Error(`Request failed with status code ${request.status}`);
}

export { checkForPngSignature, fetchEndpoint };