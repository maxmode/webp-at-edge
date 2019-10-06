'use strict';

const superagent = require('superagent');

module.exports.webp = async (event) => {
    const originUrl = event.pathParameters.proxy;
    console.log('OriginURL: ' + originUrl);
    try {
        const response = await superagent.get(originUrl).responseType('blob');

        const RESOURCES_DIR = `${process.env.LAMBDA_TASK_ROOT}/libweb/`;
        process.env.PATH += `:${RESOURCES_DIR}`;
        process.env.LD_LIBRARY_PATH += `:${RESOURCES_DIR}`;

        const CWebp = require("cwebp");
        let encoder = CWebp(response.body);
        let buffer = await encoder.toBuffer();

        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'image/webp',
                'Cache-Control': 'public, max-age=31557600',
            },
            body: buffer.toString('base64'),
            isBase64Encoded: true
        };
    } catch (e) {
        return {
            statusCode: 404,
            body: 'Not found',
        };
    }

};

