import { isJapanese, isKana, isHiragana, isKatakana, isRomaji, isMixed, toKana, toHiragana, toKatakana, toRomaji } from 'wanakana';

export const handler = async (event) => {
    // event.resource is e.g. "/v1/is/hiragana" => cut the leading "/v1/"
    switch (event.resource.substring(4)) {
        case "is/japanese":
            return formatResponse({a: isJapanese(event.queryStringParameters.q)});
        case "is/kana":
            return formatResponse({a: isKana(event.queryStringParameters.q)});
        case "is/hiragana":
            return formatResponse({a: isHiragana(event.queryStringParameters.q)});
        case "is/katakana":
            return formatResponse({a: isKatakana(event.queryStringParameters.q)});
        case "is/romaji":
            return formatResponse({a: isRomaji(event.queryStringParameters.q)});
        case "is/mixed":
            return formatResponse({a: isMixed(event.queryStringParameters.q)});
        case "to/kana":
            return formatResponse({a: toKana(event.queryStringParameters.q)});
        case "to/hiragana":
            return formatResponse({a: toHiragana(event.queryStringParameters.q)});
        case "to/katakana":
            return formatResponse({a: toKatakana(event.queryStringParameters.q)});
        case "to/romaji":
            return formatResponse({a: toRomaji(event.queryStringParameters.q)});
    }
}

// format the response for API Gateway in the Lambda function response format 1.0
function formatResponse(body) {
    return {
        "statusCode": 200,
        "headers": {
            "Content-Type": "application/json"
        },
        "isBase64Encoded": false,
        "body": JSON.stringify(body)
    }
}
