#!/usr/bin/env node

var fs = require('fs');
var program = require('commander');
var cheerio = require('cheerio');
var rest = require('restler');
var HTMLFILE_DEFAULT = "index.html";
var CHECKSFILE_DEFAULT = "checks.json";
var URL_DEFAULT = "http://pacific-river-4296.herokuapp.com";

var assertFileExists = function(infile) {
  var instr = infile.toString();
  if(!fs.existsSync(instr)) {
    console.log("%s does not exist. Exiting.", instr);
    process.exit(1);
  }
  return instr;
};

var cheerioHtmlFile = function(htmlfile) {
  return cheerio.load(fs.readFileSync(htmlfile));
};

var loadChecks = function(checksfile) {
  return JSON.parse(fs.readFileSync(checksfile));
};

var checkHtmlURL = function(url, checksfile) {
  rest.get(url).on('success', function(data, response) {
    $ = cheerio.load(data);
    var checkJson = checkHtml($, checksfile);
    var outJson = JSON.stringify(checkJson, null, 4);
    console.log(outJson);
  }).on('fail', function(data, response) {
    console.log(url + " recieved status code " + response + ". Exiting.");
    process.exit(1);
  }).on('error', function(data, response) {
    console.log("%s had an error occur. Exiting.", url);
    process.exit(1);
  });
};

var checkHtmlFile = function(htmlfile, checksfile) {
  $ = cheerioHtmlFile(htmlfile);
  return checkHtml($, checksfile);
};

var checkHtml = function($, checksfile) {
  var checks = loadChecks(checksfile).sort();
  var out = {};
  for(var ii in checks) {
    var present = $(checks[ii]).length > 0;
    out[checks[ii]] = present;
  }
  return out;
};

var clone = function(fn) {
  return fn.bind({});
};

if(require.main == module) {
  var parsed = program
    .option('-c, --checks <check_file>', 'Path to checks.json', clone(assertFileExists), CHECKSFILE_DEFAULT)
    .option('-f, --file <html_file>', 'Path to index.html', clone(assertFileExists), HTMLFILE_DEFAULT)
    .option('-u, --url <url>', 'URL to check')
    .parse(process.argv);
  if(typeof program.url === "undefined") {
    var checkJson = checkHtmlFile(program.file, program.checks);
    var outJson = JSON.stringify(checkJson, null, 4);
    console.log(outJson);
  } else {
    checkHtmlURL(program.url, program.checks);
  }
} else {
  exports.checkHtmlFile = checkHtmlFile;
}
