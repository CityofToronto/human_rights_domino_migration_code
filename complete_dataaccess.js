process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
const migrate = require('./migrate');

const https = require('https');
//const authParam = 'AuthSession be4536b9-29dd-43a9-b7a6-b337ba61a748';
//const authParam = 'AuthSession 7ee2f638-f262-4888-be93-9591fd5a8fda';
//const authParam = 'AuthSession 2acedbc1-648b-4030-928a-c543a65e8d18';
const authParam = 'AuthSession e96aa9b1-f632-401d-8708-2374e231cf4a';

/////////////////////////////////////

function csvCell(value) {
    if (value == null) {
        value = '-';
    }
    value = String(value);
    value.replace(/"/g, '""');
    if (value.indexOf(',') !== -1) {
        value = `"${value}"`
    }
    return value;
}

function csvRow(...values) {
    const cells = values.map(value => csvCell(value));
    return `${cells.join(',')}\r\n`;
}

const fs = require('fs');

//const dateString = new Date().toISOString();
//const dateString = new Date().toISOString().replace('.', '-');
const dateString = new Date().getTime();
const writeStreamSuccess = fs.createWriteStream(`${dateString}_success.csv`);
const writeStreamFailed = fs.createWriteStream(`${dateString}_failed.csv`);

writeStreamSuccess.write(csvRow('DataAccess ID', 'Domino ID', 'API File Name', 'Domino File Name', 'BIN ID'), 'utf-8');
writeStreamFailed.write(csvRow('DataAccess ID', 'Domino ID', 'Domino File Name', 'Error'), 'utf-8');

const dataaccessRequestOptions = {
    protocol: 'https:',
    //host: 'config.cc.toronto.ca',
    //port: 49093,
    //path: '/c3api_data/v2/DataAccess.svc/experiment/hr4'
    // FOR DEV 
    host: 'was-intra-sit.toronto.ca',
    // FOR QA 
    //host: 'was-intra-qa.toronto.ca',
    //port: 443,
    //path: '/c3api_data/v2/DataAccess.svc/human_rights/human_rights'
    // FOR PROD
    //host: 'insideto-secure.toronto.ca',
    //port: 443,
    path: '/c3api_data/v2/DataAccess.svc/human_rights/human_rights'
};

const dominoBaseRequestOptions = {
    protocol: 'https:',
    host: 'dom01d.toronto.ca',
    port: 443,
    //   path: '/inter/cmo/staffhumanrights.nsf'
    // FOR DEV 
    ////path: '/decom/migration/staffhumanrights_2019_07_17.nsf'
    // FOR QA 
    ////path: '/decom/migration/staffhumanrights_2019_06_17.nsf'
    ////path: '/decom/migration/staffhumanrights_2019_08_16.nsf'
    ///path: '/staffhumanrights_2019_09_24.nsf'
    path: '/inter/cmo/copy/staffhumanrights.nsf'
};

const uploadServiceRequestOptions = {
    protocol: 'https:',
    // FOR DEV 
    host: 'was-intra-sit.toronto.ca',
    // FOR QA 
    //host: 'was-intra-qa.toronto.ca',
    // FOR PROD
    //host: 'insideto-secure.toronto.ca',
    //port: 443,
    //    host: 'maserati.corp.toronto.ca',
    //    port: 49097,
    path: '/c3api_upload/upload/human_rights/ref'

};

Promise.resolve()
    .then(() => {
        return new Promise((resolve, reject) => {
            const protocol = dataaccessRequestOptions.protocol || 'https:';
            const host = dataaccessRequestOptions.host;
            const port = dataaccessRequestOptions.port || 443;
            const path = `${dataaccessRequestOptions.path}?$count=true&$select=id&$skip=0&$top=1`;

            const method = 'GET';
            const headers = {
                'Accept': 'application/json',
                'Authorization': authParam
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

            request.end();
        });
    })
    .then((data) => {
        return new Promise((resolve, reject) => {
            const protocol = dataaccessRequestOptions.protocol || 'https:';
            const host = dataaccessRequestOptions.host;
            const port = dataaccessRequestOptions.port || 443;
            const path = `${dataaccessRequestOptions.path}?$skip=0&$top=${data['@odata.count']}`
            //?$select=id,dominoDocId,uploadedFilesPath&$skip=0&$top=${data['@odata.count']}`;

            const method = 'GET';
            const headers = {
                'Accept': 'application/json',
                'Authorization': authParam
                //c55d86d9-b3b2-4132-a8af-489a109780d2'
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

            request.end();
        })
    })
    .then((data) => {
        ///    console.log(data);
        return data.value.reduce((promise, item, index, array) => {
            return promise.then(function () {
                function checkStatus(currentValue) {
                    return currentValue.status == 'success' && currentValue.name != "";
                }
             ///   console.log("111",item.uploadedFiles,"222",item.uploadedFiles != null && item.uploadedFiles.length != 0 && item.uploadedFiles.every(checkStatus));
                if (item.uploadedFiles != null && item.uploadedFiles.length != 0 && item.uploadedFiles.every(checkStatus)) {
                    return;
                }
                // console.log(item);
                let uploadedFiles = [];
                // let successFiles = [];
                // let failureFiles = [];
                return Promise.resolve()
                    .then(function () {
                        const detailId = item.dominoDocId;
                        const attNames = item.uploadedFilesPath;
                        if (attNames) {
                            return attNames.reduce((promise, attName, index, array) => {
                                return promise.then(function () {
                                //    console.log("----attName---",attName);
                                    if (attName == "") {
                                        return;
                                    }

                                    if (item.uploadedFiles != null && item.uploadedFiles[index] != null
                                        && item.uploadedFiles[index].status === 'success'
                                        && item.uploadedFiles[index].bin_id != null) {

                                        uploadedFiles[index] = {
                                            name: item.uploadedFiles[index].name,
                                            type: item.uploadedFiles[index].type,
                                            size: item.uploadedFiles[index].size,
                                            bin_id: item.uploadedFiles[index].bin_id,
                                            file_name: item.uploadedFiles[index].file_name,
                                            status: item.uploadedFiles[index].status
                                        };

                                        return;
                                    }

                                    return migrate.migrateFile({ dominoBaseRequestOptions, detailId, fileName: attName, uploadServiceRequestOptions }).then(function (metadata) {
                                        uploadedFiles[index] = {
                                            name: metadata.name,
                                            // NEW FOR UPLOADS
                                            file_name: metadata.BIN_ID[0].file_name,
                                            type: metadata.type,
                                            size: metadata.size,
                                            bin_id: metadata.BIN_ID[0].bin_id,
                                            status: 'success'
                                        };
                                        // successFiles.push(uploadedFiles[index]);
                                        // writeStreamSuccess.write(`"${item.id}", "${detailId}", "${metadata.name}", "${attName}","${metadata.BIN_ID[0].bin_id}"\r\n`, 'utf-8');
                                        writeStreamSuccess.write(csvRow(item.id, detailId, metadata.name, attName, metadata.BIN_ID[0].bin_id, metadata.BIN_ID[0].file_name), 'utf-8');
                                    }, function (error) {
                                        uploadedFiles[index] = {
                                            fileName: attName,
                                            detailId: detailId,
                                            status: 'failure'
                                        };
                                        // writeStreamFailed.write(`"${item.id}", "${detailId}", "${attName}", "${JSON.stringify(error).replace(/"/g, '""')}"\r\n`, 'utf-8');
                                        //docAttStatus = false;
                                        //   writeStreamFailed.write(csvRow(item.id, detailId, attName, JSON.stringify(error)), 'utf-8');
                                        writeStreamFailed.write(csvRow(item.id, detailId, attName, "error"), 'utf-8');

                                        console.log('ERROR BYPASSED', error, attName, detailId);
                                    });
                                });
                            }, Promise.resolve());
                        }
                    })
                    .then(function () {
                        return new Promise((resolve, reject) => {
                            const protocol = dataaccessRequestOptions.protocol || 'https:';
                            const host = dataaccessRequestOptions.host;
                            const port = dataaccessRequestOptions.port || 443;
                            const path = dataaccessRequestOptions.path + "('" + item.id + "')";

                            const method = 'PATCH';
                            const headers = {
                                'Accept': 'application/json',
                                'Content-Type': 'application/json',
                                'Authorization': authParam
                            };

                            console.log(method, protocol, host, port, path);
                         //   console.log("333",JSON.stringify({
                         //       uploadedFiles: uploadedFiles
                         //   }
                         //   ));
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
                            request.write(JSON.stringify({
                                uploadedFiles: uploadedFiles
                            }
                            ));

                            request.end();
                        })
                    });
            });
        }, Promise.resolve());

    })
    .catch((error) => {
        console.log(error);
    })
    .finally(() => {
        // close the stream
        writeStreamSuccess.end();
        writeStreamFailed.end();
    });
