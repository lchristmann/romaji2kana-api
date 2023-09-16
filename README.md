# Romaji2Kana API <!-- omit in toc -->

## Table of Contents <!-- omit in toc -->

- [1. Installations, Dependencies, Build \& Deployment](#1-installations-dependencies-build--deployment)
  - [1.1. Installations](#11-installations)
  - [1.2. Dependencies](#12-dependencies)
  - [1.3. Build](#13-build)
  - [1.4. Deployment](#14-deployment)
- [2. Cloud Infrastructure](#2-cloud-infrastructure)
  - [2.1. Amazon Route 53 OR gateway IDK](#21-amazon-route-53-or-gateway-idk)
  - [2.3. Amazon API Gateway](#23-amazon-api-gateway)
  - [2.4. Lambda Function](#24-lambda-function)
- [3. Code](#3-code)
  - [3.1. `main` and `release` branch](#31-main-and-release-branch)
  - [3.2. `main` branch](#32-main-branch)
  - [3.3. `release` branch](#33-release-branch)
- [4. API Tests](#4-api-tests)
- [5. API Documentation](#5-api-documentation)
- [6. Miscellaneous Notes](#6-miscellaneous-notes)
  - [6.1. Possible values of "queryStringParameters" in event given to Lambda](#61-possible-values-of-querystringparameters-in-event-given-to-lambda)

<br>

## 1. Installations, Dependencies, Build & Deployment

### 1.1. Installations

The Romaji2Kana API project only requires Javascript Runtime `Node.js 18 (LTS)` to be installed. On my local computer I use [Node v18.12.1](https://nodejs.org/de/blog/release/v18.12.0) and on AWS the Runtime *Node.js 18.x* is selected.

For testing the API the `Postman` API Platform is used, which can be [installed](https://www.postman.com/downloads/) (recommended) or used in the web version.

<br>

### 1.2. Dependencies

The dependencies are managed via the `npm` package manager, that comes with Node.js. They can be installed by running the command `npm install`.

- [wanakana@5.1.0](https://github.com/WaniKani/WanaKana): a JavaScript library for detecting and transliterating Hiragana, Katakana and Romaji in all directions

On top of that, *the local development version* of the API (lying in this `main` branch) additionally has a server framework installed to serve the API.

> See [3. Code Structure](#3-code-structure) for a comparison between the local development and the deployed Cloud version (`main` vs. `release` branch).

- [express@4.18.2](https://github.com/expressjs/express): a fast, unopinionated, minimalist web framework for Node.js

<br>

### 1.3. Build

> Execute the following commands in the working directory of the project.

For the local development version in `main` branch:

1. Install all the dependencies with `npm install`.
2. Serve the app with `node .` (takes default entrypoint `index.js`) or `node index.js`.


For the cloud deployment version in `release` branch:

1. Install all the dependencies with `npm install`.

<br>

### 1.4. Deployment

> Execute the following commands in the working directory of the project, in the `release` branch.

To deploy the API to the cloud into production:

1. Run the npm script "zip" (defined in the `package.json` of that branch) to build a ZIP: `npm run zip`
2. Upload the Lambda function
   - either manually: in the Lambda AWS Management Console > Code > Upload from > .zip file
   - or automatically: run `npm run deploy` (npm script using the AWS CLI)

> **Important:** from here we can only change behaviour of the Lambda function. If we'd like to change major things about the API, like adding or removing endpoints, we'd have to go to API Gateway Management Console and edit it there! Mind the whole infrastructure, see [2. Cloud Infrastructure](#2-cloud-infrastructure).

<br>

## 2. Cloud Infrastructure

The following diagram shows the cloud infrastructure of the API in AWS.

![Cloud Architecture Diagram](docs/cloud-architecture.drawio.svg)

### 2.1. Amazon Route 53 OR gateway IDK

custom domain configured for API gateway

### 2.3. Amazon API Gateway

For the API Gateway, the REST API type was chosen, [because we need features such as API keys, Per-client rate limiting, etc. - the HTTP API type is not enough](https://docs.aws.amazon.com/apigateway/latest/developerguide/http-api-vs-rest.html).

For all resources of that REST API, CORS is activated, see [this explanation](https://aws.amazon.com/de/what-is/cross-origin-resource-sharing/). And we need to enable it (with the OPTIONS method) for all resources, [since it does NOT apply recursively down the tree! And follow this guide](https://docs.aws.amazon.com/apigateway/latest/developerguide/how-to-cors-console.html). This is how to [test the CORS](https://docs.aws.amazon.com/apigateway/latest/developerguide/apigateway-test-cors.html).

You can reach the API resources, e.g. via:

- https://87z45zhkj3.execute-api.eu-central-1.amazonaws.com/prod/v1/is/hiragana

Security see [Proecting your REST API](https://docs.aws.amazon.com/apigateway/latest/developerguide/rest-api-protect.html)

<br>

### 2.4. Lambda Function

The formatError() function has this header x-amzn-errortype because its necessary: https://docs.aws.amazon.com/apigateway/latest/developerguide/handle-errors-in-lambda-integration.html

The length of the query string can be many thousand characters, see: https://stackoverflow.com/questions/812925/what-is-the-maximum-possible-length-of-a-query-string

<br>

1. Incoming requests to the domain `romaji2kana.com` first arrive at **Route53**, because it has the authoritative name servers responsible for my domain. Here will be the value of the "DNS A record" returned, which is `d15f3h5j74nmwf.cloudfront.net`.
2. This value is the endpoint of my **CloudFront** distribution (a content delivery network). It serves cached copies of my static website's files, which I have put in an S3 bucket.
3. This CloudFront distribution takes a SSL certificate created for "romaji2kana.com" in **AWS Certificate Manager** and applies it to the website's connections.
4. The origin from which CloudFront takes these website files is an **S3 bucket** named "romaji2kana.com", where I put all the static files that make up my website.

<br>

Explanation of the different regions:

- Route53 and CloudFront are global services
- the S3 bucket is located in Frankfurt (eu-central-1), because it's is the preferred and closest region for me
- the SSL certificate is located in North Virginia (us-east-1), because this is the only region allowed by the CloudFront service for certificates.

<br>

## 3. Code

- `main` branch: local development version of the API
- `release` branch: cloud deployed version of the API

### 3.1. `main` and `release` branch

Both branches share much in common.

- they **both receive an HTTP request**: the local development API anyways, because it gets called directly on `localhost:3000` and the cloud deployed API receives an HTTP request forwarded *as-is* (not processed or anything) packed in the event object, by which it is triggered.
- they both rely on a handler function that does the heavy lifting
  - they both analyze which API resource has been requested
  - they both just use a wanakana function to fulfill a request

<br>

### 3.2. `main` branch

- uses Express Js to serve the API. Hence, there is some code (`import express, express(), app.listen(), app.get('/'),...`) from it there, to start the server and listen on specified endpoints.
- artificially creates an event like AWS would send one to trigger the Lambda function (this lets us copy the code to the `release` branch better!)

<br>

### 3.3. `release` branch

- some details might be specific here, but its largely just the `main` branch stripped off all the simulation stuff, and the server framework... It's pretty short and understandable.

> Note: You might come across code ([like this one](https://github.com/awsdocs/aws-lambda-developer-guide/blob/main/sample-apps/nodejs-apig/function/index.js)), that does extensive packaging of the Lambda response to put it in a API Gateway understandable format. This isn't necessary anymore, since now with "Lambda function response format 2.0" [API Gateway can infer the response format](https://docs.aws.amazon.com/apigateway/latest/developerguide/http-api-develop-integrations-lambda.html).

<br>

## 4. API Tests

There will be an extensive test suite for the cloud deployed API in Postman.

Postman Schema Validation with Tiny Validator 4: [Schema Validation](https://postman-quick-reference-guide.readthedocs.io/en/latest/schema-validation.html)

<br>

## 5. API Documentation

The API documentation will be published on Postman.

<br>

## 6. Miscellaneous Notes

### 6.1. Possible values of "queryStringParameters" in event given to Lambda

HTTP request has...

- ... no query params:

```
"queryStringParameters": null
```

- ... has q param:

```
"queryStringParameters": {
        "q": "わたしはおとこです。"
}
```

- ... has q param, but left it empty (`q=`):

```
"queryStringParameters": {
        "q": ""
}
```

- ... has other param (`x=532`):

```
"queryStringParameters": {
        "x": "532"
}
```

- ... has multiple params, including the q param (`q=watata&x=532`):

```
"queryStringParameters": {
        "q": "watata",
        "x": "532"
}
```

<br>