'use strict';

const myWebsiteDomain = 'example.com'; //todo: change to domain name of your website
const myAPIGatewayDomain = '123456789.execute-api.us-east-1.amazonaws.com'; //todo: result of "sls deploy" execution
let config = [
    {
        accept: 'image/svg+xml',//Safari do not say that it supports image/jp2. But they mention 'image/svg+xml'
        fileTypes: ['jpg', 'jpeg', 'png', 'gif', 'tiff', 'JPG', 'JPEG', 'PNG', 'GIF', 'TIFF'],
        domainName: myAPIGatewayDomain,
        path: '/prod/jp2/https://' + myWebsiteDomain,
    }, {
        accept: 'image/webp',
        fileTypes: ['jpg', 'jpeg', 'png', 'gif', 'tiff', 'JPG', 'JPEG', 'PNG', 'GIF', 'TIFF'],
        domainName: myAPIGatewayDomain,
        path: '/prod/webp/https://' + myWebsiteDomain,
    }
];

/**
 * Send back next-gen images in case client supports them
 */
exports.handler = (event, context, callback) => {
    const request = event.Records[0].cf.request;
    let fileExt = request.uri.split('.').pop();
    for (let f in config) {
        if (!config.hasOwnProperty(f)) continue;
        if (config[f].fileTypes.indexOf(fileExt) >= 0
            && request.headers.hasOwnProperty('accept')
            && request.headers['accept'][0].value.indexOf(config[f].accept) >= 0) {

            request.origin = {
                custom: {
                    domainName: config[f].domainName,
                    port: 443,
                    protocol: 'https',
                    path: config[f].path,
                    sslProtocols: ['TLSv1', 'TLSv1.1'],
                    readTimeout: 5,
                    keepaliveTimeout: 30,
                    customHeaders: {}
                }
            };
            request.headers['host'] = [{ key: 'host', value: config[f].domainName}];
            break;
        }
    }
    callback(null, request);
};