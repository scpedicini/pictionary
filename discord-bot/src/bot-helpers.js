import fetch from "node-fetch";
import * as config from "./bot-config.js";

/**
 * Checks if a buffer is of type png
 * @param {Buffer} buffer
 * @return {boolean}
 */
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

function tokenize(sentence) {
    const all_words = sentence.split(' ').map(word => word.trim().toLowerCase()).filter(word => word.length > 0);
    return all_words;
}

function removeStopWords(tokens) {
    const stopWords = ['the', 'a', 'an', 'and', 'or', 'but', 'to', 'from', 'of', 'in', 'on', 'at', 'by', 'for', 'with', 'about', 'as', 'into', 'like', 'through', 'after', 'over', 'between', 'out', 'against', 'during', 'without', 'before', 'under', 'around', 'among'];
    return tokens.filter(token => !stopWords.includes(token));
}

function allWordsInSentence(sentence1, sentence2) {
    const tokens1 = removeStopWords(tokenize(sentence1));
    const tokens2 = removeStopWords(tokenize(sentence2));
    const allTokensFound = allTokensInArray(tokens1, tokens2);
    return allTokensFound;
}

function allTokensInArray(tokens, array) {
    return tokens.every(token => array.includes(token));
}

function getItemByWeightedProbability(itemArray, weights) {
    const totalWeight = weights.reduce((a, b) => a + b, 0);
    const randomWeight = Math.random() * totalWeight;
    let weightSum = 0;
    for (let i = 0; i < weights.length; i++) {
        weightSum += weights[i];
        if (randomWeight < weightSum) {
            return itemArray[i];
        }
    }
}

function getRandomItemFromArray(array, shouldRemove = false) {
    const index = Math.floor(Math.random() * array.length);
    const item = array[index];
    if (shouldRemove) {
        array.splice(index, 1);
    }
    return item;
}

export {checkForPngSignature, fetchEndpoint, getRandomItemFromArray, allWordsInSentence, getItemByWeightedProbability};