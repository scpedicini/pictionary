import fs from 'fs';
import path from 'path';
import {getItemByWeightedProbability, getRandomItemFromArray} from "./bot-helpers.js";
import './typings.js';

class WordGenerator {

    /**
     * A dictionary of words by category
     * @type {Pack[]}
     */
    wordPacks

    /**
     * List of artists
     * @type {string[]}
     */
    artists

    /**
     * List of mediums
     * @type {string[]}
     */
    mediums

    constructor() {
        this.wordPacks = [];
        this.artists = [];
        this.mediums = [];
    }

    initialize(rootDirectory, specificPackFiles) {

        // load word lists
        const category_folder = path.join(rootDirectory, 'categories');

        if (specificPackFiles) {
            // load specific packs
            for (const packFile of specificPackFiles) {
                const pack = JSON.parse(fs.readFileSync(path.join(category_folder, packFile), 'utf8'));
                this.wordPacks.push(pack);
            }
        } else {
            const files = fs.readdirSync(category_folder).filter(file => file.endsWith('.json'));
            files.forEach(file => {
                const pack = JSON.parse(fs.readFileSync(path.join(category_folder, file), 'utf8'));
                this.wordPacks.push(pack);
            });
        }

        // load artists
        this.artists = JSON.parse(fs.readFileSync(path.join(rootDirectory, "artists.json"), 'utf8'));

        // load mediums
        this.mediums = JSON.parse(fs.readFileSync(path.join(rootDirectory, "mediums.json"), 'utf8'));

        // load styles
        this.styles = JSON.parse(fs.readFileSync(path.join(rootDirectory, "styles.json"), 'utf8'));

        // load modifiers
        this.modifiers = JSON.parse(fs.readFileSync(path.join(rootDirectory, "modifiers.json"), 'utf8'));
    }

    /**
     * Clone the generator for a channel, so we can remove words safely in a single game
     * @return {WordGenerator}
     */
    cloneWordGenerator() {
        const clone = new WordGenerator();
        clone.wordPacks = JSON.parse(JSON.stringify(this.wordPacks));
        clone.artists = JSON.parse(JSON.stringify(this.artists));
        clone.mediums = JSON.parse(JSON.stringify(this.mediums));
        clone.styles = JSON.parse(JSON.stringify(this.styles));
        clone.modifiers = JSON.parse(JSON.stringify(this.modifiers));
        return clone;
    }

    /**
     * @return {Pack}
     */
    getRandomPack() {
        return getRandomItemFromArray(this.wordPacks);
    }

    getRandomArtist() {
        return getRandomItemFromArray(this.artists);
    }

    getRandomMedium() {
        return getRandomItemFromArray(this.mediums);
    }

    getRandomStyle() {
        return getRandomItemFromArray(this.styles);
    }

    getRandomModifier() {
        return getRandomItemFromArray(this.modifiers);
    }

}

const masterWordGenerator = new WordGenerator();
masterWordGenerator.initialize(path.resolve('packs') /*[
    'animals.json',
    'places.json',
    'people.json',
    'starwars.json',
    'cartoons.json',
    'disney.json'
]*/);

/**
 * Represents a self-contained game of pictionary
 */
class Pictionary {

    static STOPPED = "STOPPED";
    static GENERATING = "GENERATING";
    static NEXT_ROUND = "NEXT_ROUND";

    /**
     * Is Initial state
     * @returns {boolean}
     */
    initialState;

    /**
     * List of players (discord ids)
     * @type {string[]}
     */
    players;

    /**
     * State of the game
     * @type {string}
     */
    state;

    /**
     * Used words
     * @type {string[]}
     */
    usedWords;

    /**
     * Word generator for this game
     * @type {WordGenerator}
     */
    wordGenerator;

    constructor() {
        this.players = [];
        this.state = Pictionary.STOPPED;
        this.initialState = true;
        this.usedWords = [];
        this.wordGenerator = masterWordGenerator.cloneWordGenerator();
    }

    startGame() {
        this.state = Pictionary.GENERATING;
        this.initialState = true;
    }

    getRandomPrompt(packName) {
        const pack = packName ? this.wordGenerator.wordPacks.find(w => w.name === packName) : this.wordGenerator.getRandomPack();
        const word = getRandomItemFromArray(pack.words);
        this.usedWords.push(word);

        const artist = this.wordGenerator.getRandomArtist();
        const style = this.wordGenerator.getRandomStyle();

        const artist_or_style = getItemByWeightedProbability([artist, style], [0.65, 0.35]);

        const medium = this.wordGenerator.getRandomMedium();
        const modifier = this.wordGenerator.getRandomModifier();

        let prompt = `${word}`;
        if(Array.isArray(pack.tags) && pack.tags.length > 0) {
            prompt += ` ${pack.tags.join(' ')}`;
        }

        prompt += `, ${artist_or_style}, ${medium}`;
        if(Math.random() < 0.1) {
            prompt += `, ${modifier}`;
        }

        prompt = prompt.trim();

        return {
            word: word,
            prompt: prompt
        };
    }

}

export {Pictionary};