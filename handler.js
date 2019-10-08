'use strict';

const superagent = require('superagent');

module.exports.cwebp = async (event) => {
    const originUrl = event.pathParameters.proxy.replace('.mxx.webp', '');

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
        console.log(e.message);
        return {
            statusCode: 404,
            body: 'Not found',
        };
    }
};

module.exports.im = async (event) => {
    const originUrl = event.pathParameters.proxy.replace('.mxx.jp2', '');
    console.log('OriginURL: ' + originUrl);
    try {
        const toPath = '/tmp/download';
        const outPath = '/tmp/output';
        const fs = require("fs");

        const stream = fs.createWriteStream(toPath);
        const response = await superagent.get(originUrl).responseType('blob');
        await stream.write(response.body);
        stream.close();

        const BIN_PATH = `${process.env.LAMBDA_TASK_ROOT}/imagemagick/bin/`;
        const gm = require('gm').subClass({
            imageMagick: true,
            appPath: BIN_PATH,
        });
        process.env.PATH = `${process.env.PATH}:${BIN_PATH}`;
        process.env.LD_LIBRARY_PATH =  './imagemagick/lib';

        let promise = new Promise((resolve, reject) => {
            gm(toPath).setFormat('jp2').define('jp2:rate=32').write(outPath, function(err){
                if (!err) {
                        resolve();
                } else {
                    reject(err);
                }
            });
        });
        await promise;

        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'image/jp2',
                'Cache-Control': 'public, max-age=31557600',
            },
            body: fs.readFileSync(outPath).toString('base64'),
            isBase64Encoded: true
        };
    } catch (e) {
        console.log(e.message);
        return {
            statusCode: 404,
            body: 'Not found',
        };
    }
};

