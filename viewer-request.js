'use strict';

const myWebsite = 'https://mxx.news'; //todo: change to your website name

exports.handler = (event, context, callback) => {
    const request = event.Records[0].cf.request;

    if(request.uri !== "/") {
        let paths = request.uri.split('/');
        let lastPath = paths[paths.length - 1];
        let isFile = lastPath.split('.').length > 1;
        let fileType = lastPath.split('.').pop();

        if(isFile) {
            if (['jpg', 'jpeg', 'png', 'gif', 'tiff', 'JPG', 'JPEG', 'PNG', 'GIF', 'TIFF'].indexOf(fileType) >= 0) {

                // Detect Safari by User-Agent and supply with JP2 image
                if (request.headers.hasOwnProperty('user-agent')
                    && request.headers['user-agent'][0].value.search(/Version\/[\.\d]+ Safari\/[\.\d]+/) >= 0) {
                    const response = {
                        status: '301',
                        statusDescription: 'Moved Permanently',
                        headers: {
                            location: [{
                                key: 'Location',
                                value: `${myWebsite}${request.uri}.mxx.jp2`,
                            }],
                        },
                    };
                    callback(null, response);

                // Detect support of WebP by Accept header
                } else if (request.headers.hasOwnProperty('accept')
                    && request.headers['accept'][0].value.indexOf('image/webp') >= 0) {
                    const response = {
                        status: '301',
                        statusDescription: 'Moved Permanently',
                        headers: {
                            location: [{
                                key: 'Location',
                                value: `${myWebsite}${request.uri}.mxx.webp`,
                            }],
                        },
                    };
                    callback(null, response);
                }
            }
        }
    }
    callback(null, request);
};