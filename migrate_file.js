const migrate = require('./migrate');

const dominoBaseRequestOptions = {
    protocol: 'https:',
    host: 'dom01d.toronto.ca',
    port: 443,
    path: '/inter/cmo/staffhumanrights.nsf' // modify it
};

const detailId = 'E7684EC2CC915C588525841E0070200A';

const fileName = 'SW Addendum.pdf';

const uploadServiceRequestOptions = {
    protocol: 'https:',
    host: 'config.cc.toronto.ca', // modify it to QA
    //  port: 443; // for all https for QA
    port: 49097, // modify it to QA
    path: '/c3api_upload/upload/human_rights/ref'
};

migrate.migrateFile({
    dominoBaseRequestOptions: dominoBaseRequestOptions,
    detailId: detailId,
    fileName: fileName,
    uploadServiceRequestOptions: uploadServiceRequestOptions
}).then(function(data) {
    console.log('MIGRATION SUCCESS', data);
}, function(error) {
    console.log('MIGRATE ERROR', error);
});