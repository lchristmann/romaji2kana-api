import express from "express";
import { isJapanese, isKana, isHiragana, isKatakana, isRomaji, isMixed, toKana, toHiragana, toKatakana, toRomaji } from 'wanakana';

const app = express();
const PORT = 3000;

app.get('/', (req, res) => {
    res.send('Hello world!');
});

const endpoints = ['/v1/is/japanese', '/v1/is/kana', '/v1/is/hiragana', '/v1/is/katakana', '/v1/is/romaji', '/v1/is/mixed',
    '/v1/to/kana', '/v1/to/hiragana', '/v1/to/katakana', '/v1/to/romaji'];

app.get(endpoints, (req, res) => {
    // pack path and query params into an event object structure like the Lambda function receives
    // so ideally there's as little difference as possible between this local development API version and the real one
    const event = {
        path: req.url.split('?')[0],
        queryStringParameters: req.query.q
    };
    res.send(handler(event));
});

// this function simulates the handler() function from the Lambda (event structure same, regarding those 2 params)
function handler(event) {
    console.log(`---------- ${event.path} ----------`);
    console.log(`q: ${event.queryStringParameters}`);

    // cut off the "/v1/" from the URL and evaluate which operation to execute
    switch ((event.path).substring(4)) {
        case "is/japanese":
            return {result: isJapanese(event.queryStringParameters)};
        case "is/kana":
            return {result: isKana(event.queryStringParameters)};
        case "is/hiragana":
            return {result: isHiragana(event.queryStringParameters)};
        case "is/katakana":
            return {result: isKatakana(event.queryStringParameters)};
        case "is/romaji":
            return {result: isRomaji(event.queryStringParameters)};
        case "is/mixed":
            return {result: isMixed(event.queryStringParameters)};
        case "to/kana":
            return {result: toKana(event.queryStringParameters)};
        case "to/hiragana":
            return {result: toHiragana(event.queryStringParameters)};
        case "to/katakana":
            return {result: toKatakana(event.queryStringParameters)};
        case "to/romaji":
            return {result: toRomaji(event.queryStringParameters)};
    }
}

// Running the app on the server
app.listen(PORT, () => {
    console.log(`App is running on port ${PORT}`);
});