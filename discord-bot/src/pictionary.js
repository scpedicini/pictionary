import fs from 'fs';
import path from 'path';
import {getItemByWeightedProbability, getRandomItemFromArray} from "./bot-helpers.js";

class WordGenerator {

    /**
     * A dictionary of words by category
     * @type {Object<string, string[]>}
     */
    wordLists

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
        this.wordLists = {};
        this.artists = [];
        this.mediums = [];
    }

    initialize(rootDirectory, specificPackFiles) {

        // load word lists
        const category_folder = path.join(rootDirectory, 'categories');

        if (specificPackFiles) {
            // load specific packs
            for (const packFile of specificPackFiles) {
                const wordList = JSON.parse(fs.readFileSync(path.join(category_folder, packFile), 'utf8'));
                const name = packFile.split('.')[0];
                this.wordLists[name] = wordList;
            }
        } else {
            const files = fs.readdirSync(category_folder).filter(file => file.endsWith('.json'));
            files.forEach(file => {
                const wordList = JSON.parse(fs.readFileSync(path.join(category_folder, file), 'utf8'));
                const name = file.split('.')[0];
                this.wordLists[name] = wordList;
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
        clone.wordLists = JSON.parse(JSON.stringify(this.wordLists));
        clone.artists = JSON.parse(JSON.stringify(this.artists));
        clone.mediums = JSON.parse(JSON.stringify(this.mediums));
        clone.styles = JSON.parse(JSON.stringify(this.styles));
        clone.modifiers = JSON.parse(JSON.stringify(this.modifiers));
        return clone;
    }

    getRandomWordFromCategory(category, removeFromCategory = false) {
        const wordList = this.wordLists[category];
        const word = getRandomItemFromArray(wordList, removeFromCategory);
        return word;
    }

    getRandomWordFromRandomCategory(removeFromCategory) {
        const category = getRandomItemFromArray(Object.keys(this.wordLists));
        const word = this.getRandomWordFromCategory(category, removeFromCategory);
        return word;
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
masterWordGenerator.initialize(path.resolve('packs'), ['animals.json', 'places.json', 'people.json', 'starwars.json']);

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

    getRandomWord() {
        const word = this.wordGenerator.getRandomWordFromRandomCategory(false);
        this.usedWords.push(word);

        const artist = this.wordGenerator.getRandomArtist();
        const style = this.wordGenerator.getRandomStyle();

        const artist_or_style = getItemByWeightedProbability([artist, style], [0.75, 0.25]);

        const medium = this.wordGenerator.getRandomMedium();
        const modifier = this.wordGenerator.getRandomModifier();

        return { word: word, artist: artist_or_style, medium: medium, modifier: Math.random() < 0.1 ? modifier : undefined };
    }

}

export {Pictionary};