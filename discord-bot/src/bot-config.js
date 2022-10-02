import dotenv from "dotenv";

dotenv.config();

const {BOT_TOKEN, APP_ID, COMMUNICATOR_ENDPOINT, DEV_COMMUNICATOR_ENDPOINT, BEARER_TOKEN } = process.env;

console.log(`BOT_TOKEN: ${BOT_TOKEN}, APP_ID: ${APP_ID}, COMMUNICATOR_ENDPOINT: ${COMMUNICATOR_ENDPOINT}, DEV_COMMUNICATOR_ENDPOINT: ${DEV_COMMUNICATOR_ENDPOINT}, BEARER_TOKEN: ${BEARER_TOKEN}`);

const IS_DEV = process.env.NODE_ENV === 'development';

const communicatorEndpoint = IS_DEV ? DEV_COMMUNICATOR_ENDPOINT : COMMUNICATOR_ENDPOINT;

export { BOT_TOKEN, APP_ID, communicatorEndpoint, BEARER_TOKEN };