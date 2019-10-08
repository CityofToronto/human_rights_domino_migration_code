process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

const https = require('https');
const FormData = require('form-data');

module.exports.migrate = ({ dominoCollectionRequestOptions, count = 100, page = 0, dominoCollectionDataFilter = (data) => data,
    dominoDetailRequestOptions, dominoDetailDataFilter = (data) => data, valueMapFromDominoToDataaccess = (data) => data,
    dataaccessRequestOptions }) => {

    let dominoCollectionDataCount;

    return new Promise((resolve, reject) => {
        const protocol = dominoCollectionRequestOptions.protocol || 'https:';
        const host = dominoCollectionRequestOptions.host;
        const port = dominoCollectionRequestOptions.port || 443;
        const path = `${dominoCollectionRequestOptions.path}?count=${count}&page=${page}`;

        // const method = 'GET';
        // const headers = { 'Accept': 'application/json' };

        // console.log(method, protocol, host, port, path);
        // const request = https.request({ protocol, host, port, path, method, headers }, (response) => {

        console.log('GET', `${protocol}//${host}:${port}${path}`);
        const request = https.get(`${protocol}//${host}:${port}${path}`, (response) => {
            let chunks = [];

            response.on('data', (chunk) => {
                chunks.push(chunk);
            });

            response.on('end', () => {
                let data;

                if (chunks.length > 0) {
                    data = JSON.parse(dominoCollectionDataFilter(Buffer.concat(chunks).toString('utf8')));
                }

                if (response.statusCode === 200) {
                    resolve(data);
                } else {
                    reject(data);
                }
            });
        });

        request.on('error', (error) => {
            reject(error);
        });
    }).then((dominoCollectionData) => {
        dominoCollectionDataCount = dominoCollectionData.length;
        console.log('DOCUMENT COUNT', dominoCollectionDataCount);

        const dataaccessDataArray = [];
        return dominoCollectionData.reduce((promise, value, index, array) => {
            return promise.then(() => {
                return new Promise((resolve, reject) => {
                    const protocol = dominoDetailRequestOptions.protocol || 'https:';
                    const host = dominoDetailRequestOptions.host;
                    const port = dominoDetailRequestOptions.port || 443;
                    const path = `${dominoDetailRequestOptions.path}/${value['@unid']}`;

                    // const method = 'GET';
                    // const headers = { 'Accept': 'application/json' };

                    // console.log(method, protocol, host, port, path);
                    // const request = https.request({ protocol, host, port, path, method, headers }, (response) => {

                    console.log('GET', `${protocol}//${host}:${port}${path}`);
                    const request = https.get(`${protocol}//${host}:${port}${path}`, (response) => {
                        let chunks = [];

                        response.on('data', (chunk) => {
                            chunks.push(chunk);
                        });

                        response.on('end', () => {
                            let data;

                            if (chunks.length > 0) {
                                data = JSON.parse(dominoDetailDataFilter(Buffer.concat(chunks).toString('utf8')));
                            }

                            if (response.statusCode === 200) {
                                resolve(data);
                            } else {
                                reject(data);
                            }
                        });
                    });

                    request.on('error', (error) => {
                        reject(error);
                    });
                }).then((dominoDetailData) => {
                    return valueMapFromDominoToDataaccess(dominoDetailData);
                }).then((dataaccessData) => {
                    if (dataaccessData) {
                        dataaccessDataArray.push(dataaccessData);
                    }
                });
            });
        }, Promise.resolve()).then(() => {
            return new Promise((resolve, reject) => {
                const payload = JSON.stringify(dataaccessDataArray);

                const protocol = dataaccessRequestOptions.protocol || 'https:';
                const host = dataaccessRequestOptions.host;
                const port = dataaccessRequestOptions.port || 443;
                const path = dataaccessRequestOptions.path;

                const method = 'POST';
                const headers = {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    'Content-Length': Buffer.byteLength(payload)
                };

                console.log(method, protocol, host, port, path);
                const request = https.request({ protocol, host, port, path, method, headers }, (response) => {
                    let chunks = [];

                    response.on('data', (chunk) => {
                        chunks.push(chunk);
                    });

                    response.on('end', () => {
                        let data;

                        if (chunks.length > 0) {
                            data = JSON.parse(Buffer.concat(chunks).toString('utf8'));
                        }

                        if (response.statusCode === 200) {
                            resolve(data);
                        } else {
                            reject(data);
                        }
                    });
                });

                request.on('error', (error) => {
                    reject(error);
                });

                request.write(payload);

                request.end();
            });
        });
    }).then(() => {
        console.log('NEXT', dominoCollectionDataCount === count);
        if (dominoCollectionDataCount === count) {
            return migrate({
                dominoCollectionRequestOptions,
                count,
                page: page + 1,
                dominoCollectionDataFilter,
                dominoDetailRequestOptions,
                dominoDetailDataFilter,
                valueMapFromDominoToDataaccess,
                dataaccessRequestOptions
            });
        }
    });
}

module.exports.convertToString = (value, joiner = ', ') => {
    if (value == null) {
        return null;
    }

    if (typeof value === 'string') {
        return value;
    }

    if (Array.isArray(value)) {
        return value.map((item) => item.trim()).join(joiner);
    }

    return String(value);
}

module.exports.convertToDate = (value) => {
    value = module.exports.convertToString(value);

    if (typeof value === 'string') {
        try {
            return (new Date(Date.parse(value))).toISOString();
        } catch {
            return null;
        }
    }

    return null;
}

module.exports.convertToArray = (value) => {
    if (value == null || Array.isArray(value)) {
        return value;
    }

    return [value];
}

module.exports.migrateFile = function ({ dominoBaseRequestOptions, detailId, fileName, uploadServiceRequestOptions }) {
    let type, size;
    return new Promise((resolve, reject) => {
        const form = new FormData();

        const protocol = dominoBaseRequestOptions.protocol || 'https:';
        const host = dominoBaseRequestOptions.host;
        const port = dominoBaseRequestOptions.port || 443;
        const path = `${dominoBaseRequestOptions.path}/${detailId}/$File/${encodeURIComponent(fileName)}`;

        // const method = 'GET';
        // const headers = { 'Accept': 'application/json' };

        // console.log(method, protocol, host, port, path);
        // const request = https.request({ protocol, host, port, path, method, headers }, (response) => {

        console.log('GET', `${protocol}//${host}:${port}${path}`);
        const request = https.get(`${protocol}//${host}:${port}${path}`, (response) => {
            type = response.headers['content-type'];
            size = response.headers['content-length'] ? +response.headers['content-length'] : null;
            form.append('file', response);
            resolve(form);
        });

        request.on('error', (error) => {
            reject(error);
        });
    }).then((form) => {
        return new Promise((resolve, reject) => {
            const protocol = uploadServiceRequestOptions.protocol || 'https:';
            const host = uploadServiceRequestOptions.host;
            const port = uploadServiceRequestOptions.port || 443;
            const path = uploadServiceRequestOptions.path;

            console.log('POST', `${protocol}//${host}:${port}${path}`);
            form.submit(`${protocol}//${host}:${port}${path}`, (err, response) => {
                let chunks = [];

                response.on('data', (chunk) => {
                    chunks.push(chunk);
                });

                response.on('end', () => {
                    let data;

                    if (chunks.length > 0) {
                        data = JSON.parse(Buffer.concat(chunks).toString('utf8'));
                    }

                    if (response.statusCode === 200) {
                        data.type = type;
                        data.size = size;
                        data.name = fileName;
                        resolve(data);
                    } else {
                        reject({data, response, err});
                    }
                });
            });
        });
    });
}