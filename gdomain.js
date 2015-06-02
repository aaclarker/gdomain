/*
 * Utility to update the IP address of a Google Domains DNS record.
 *
 * Google Domains documentation available at https://support.google.com/domains/answer/6147083?hl=en
 */
var request = require('sync-request');
var CronJob = require('cron').CronJob;
var config  = require('./config');
var fs = require('fs');

function log(level, message) {
    var timestamp = new Date()..toISOString();
    var logfile = config.log || 'gdomain.log';

    fs.appendFileSync(logfile, timestamp + ' - ' + level + ' - ' + message + '\n');
}

function getIp() {
    var res = request('GET', 'http://api.ipify.org?format=json');
    var body = JSON.parse(res.getBody());

    process.env['PUBLIC_IP'] = body.ip;
    return body.ip;
}

function updateDomains(ip) {
    var user = config.user,
        pass = config.pass,
        host = config.host;

    var domainsUrl = 'https://' + user + ':' + pass + '@domains.google.com/nic/update?hostname=' + host + '&myip=' + ip;
    var res = request('POST', domainsUrl);
    var body = res.getBody().toString();

    return body;
}

function run() {
    var oldIp = process.env['PUBLIC_IP'];
    var newIp = getIp();
    var res;

    log("INFO", "Running");
    log("ERROR", "Running");
    console.log(new Date() + " - tick");
    if (newIp !== oldIp) {
       res = updateDomains(newIp);
    }
    
    if (res) {
       if (res === 'nochg ' + newIp) log("INFO", "No change in IP");
       else if (res === 'good ' + newIp) log("INFO", "IP updated to " + newIp);
       else log("ERROR", "An error has occured: " + res);
    }
}

var cronSchedule = config.cron || '00 */15 * * * *';
var job = new CronJob({
    cronTime: cronSchedule,
    onTick: function() {
        run();
    },
    start: true
});

job.start();
