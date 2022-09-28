import dotenv from "dotenv";

dotenv.config();

const {BOT_TOKEN, APP_ID, PUBLIC_KEY, COMMUNICATOR_ENDPOINT, DEV_COMMUNICATOR_ENDPOINT, BEARER_TOKEN } = process.env;

const IS_DEV = process.env.NODE_ENV === 'development';

const communicatorEndpoint = IS_DEV ? DEV_COMMUNICATOR_ENDPOINT : COMMUNICATOR_ENDPOINT;

export { BOT_TOKEN, APP_ID, PUBLIC_KEY, communicatorEndpoint, BEARER_TOKEN };