const migrate = require('./migrate');

const dominoCollectionRequestOptions = {
    protocol: 'https:',
    host: 'dom01d.toronto.ca',
    port: 443,
    path: '/inter/cmo/staffhumanrights.nsf/api/data/collections/name/export'
};

const count = 100;

const page = 0;

const dominoCollectionDataFilter = function (str) {
    return str;
}

const dominoDetailRequestOptions = {
    protocol: 'https:',
    host: 'dom01d.toronto.ca',
    port: 443,
    path: '/inter/cmo/staffhumanrights.nsf/api/data/documents/unid'
};

const dominoDetailDataFilter = function (str) {
    // all data transform happens here
    return str;
}

const dataaccessRequestOptions = {
    protocol: 'https:',
    host: 'config.cc.toronto.ca',
    port: 49093,
    path: '/c3api_data/v2/DataAccess.svc/experiment/hr4'
}

const dominoBaseRequestOptions = {
    protocol: 'https:',
    host: 'dom01d.toronto.ca',
    port: 443,
    path: '/inter/cmo/staffhumanrights.nsf'
};

const uploadServiceRequestOptions = {
    protocol: 'https:',
    host: 'maserati.corp.toronto.ca',
    port: 49097,
    path: '/c3api_upload/upload/human_rights/ref'
};

const valueMapFromDominoToDataaccess = function (json) {
    const uploadedFiles = [];
 //   console.log(json); // record data
    let docAttStatus;
    return Promise.resolve()
    // for attachments
    /*
        .then(function () {

            const detailId = migrate.convertToString(json['@unid']);
            const attNames = migrate.convertToArray(json['attNames']);

            if (attNames) {
                return attNames.reduce((promise, attName, index, array) => {
                    return promise.then(function () {
                        return migrate.migrateFile({ dominoBaseRequestOptions, detailId, fileName: attName, uploadServiceRequestOptions }).then(function (metadata) {
                            uploadedFiles[index] = {
                                name: metadata.name, //data.BIN_ID[0].file_name
                                type: metadata.type,
                                size: metadata.size,
                                bin_id: metadata.BIN_ID[0].bin_id,
                                status: 'success'
                            };
                        }, function (error) {
                            uploadedFiles[index] = {
                                fileName: attName,
                                detailId: detailId,
                                status: 'failure'
                            };
                            docAttStatus = false;
                            console.log('ERROR BYPASSED', error, attName, detailId);
                        });
                    });
                }, Promise.resolve());
            }
        })
*/
// migrating records
        .then(function() {

            // for debugging purposes uncomment below
            // return false; // record doesn't get created on dataaccess

            return {
                // all data manipulations should be implemented here
                'Created': migrate.convertToDate(json.Year),
                'first_name': migrate.convertToString(json.fName),
                'last_name': migrate.convertToString(json.LName),
                'dominoDocId' : migrate.convertToString(json['@unid']),
                'uploadedFilesPath': migrate.convertToArray(json['attNames'])
            //    'uploadedFiles': uploadedFiles,
            //    'docAttStatus': docAttStatus
            }
        });
};


console.log('MIGRATION BEGINS');

migrate.migrate({
    dominoCollectionRequestOptions: dominoCollectionRequestOptions,
    count: count, // max 100
    page: page,
    dominoCollectionDataFilter: dominoCollectionDataFilter,
    dominoDetailRequestOptions: dominoDetailRequestOptions,
    dominoDetailDataFilter: dominoDetailDataFilter,
    valueMapFromDominoToDataaccess: valueMapFromDominoToDataaccess,
    dataaccessRequestOptions: dataaccessRequestOptions
}).then(() => {
    console.log('MIGRATION ENDS');
}, (error) => {
    console.log('MIGRATE ERROR', error);
});

function transformRepeatControl(data) {
    var repArray = [{
        'add_firstName': data.A2FName, 'add_lastName': data.A2LName,
        'add_title': data.A2Title, 'add_role': data.A2Role, 'add_roleOther': data.A2RoleOther,
        'add_phone': data.A2Phone, 'add_altPhone': data.A2PhoneAlt, 'add_address': multiTransform(data.A2Address, ' '),
        'add_email': data.A2Email, 'add_cityEmployee': data.A2Emp, 'add_cotEmployeeType': setEmpType(data.A2EmpType),
        'add_cotJobType': setJobType(data.A2JobType), 'add_cotDivision': setDivision(data.A2Division)
    },
    {
        'add_firstName': data.A3FName, 'add_lastName': data.A3LName,
        'add_title': data.A3Title, 'add_role': data.A3Role, 'add_roleOther': data.A3RoleOther,
        'add_phone': data.A3Phone, 'add_altPhone': data.A3PhoneAlt, 'add_address': multiTransform(data.A3Address, ' '),
        'add_email': data.A3Email, 'add_cityEmployee': data.A3Emp, 'add_cotEmployeeType': setEmpType(data.A3EmpType),
        'add_cotJobType': setJobType(data.A3JobType), 'add_cotDivision': setDivision(data.A3Division)
    },
    {
        'add_firstName': data.A4FName, 'add_lastName': data.A4LName,
        'add_title': data.A4Title, 'add_role': data.A4Role, 'add_roleOther': data.A4RoleOther,
        'add_phone': data.A4Phone, 'add_altPhone': data.A4PhoneAlt, 'add_address': multiTransform(data.A4Address, ' '),
        'add_email': data.A4Email, 'add_cityEmployee': data.A4Emp, 'add_cotEmployeeType': setEmpType(data.A4EmpType),
        'add_cotJobType': setJobType(data.A4JobType), 'add_cotDivision': setDivision(data.A4Division)
    }
    ];
    return repArray;
}