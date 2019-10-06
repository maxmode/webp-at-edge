'use strict';

/**
 * Send back next-gen images in case client supports them
 */
let config = [
    {
        accept: 'image/webp',
        fileTypes: ['jpg', 'jpeg', 'png', 'gif', 'tiff'],
        domainName: '{CODE_OF_YOUR_API_GATEWAY}.execute-api.us-east-1.amazonaws.com',
        path: '/prod/webp/https://{YOUR_WEBSITE_DOMAIN}',
    }
];

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
        }
    }
    callback(null, request);
};