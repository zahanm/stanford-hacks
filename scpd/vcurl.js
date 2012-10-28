
/*
Deps
*/

var vcurl = require('commander');
var Browser = require('zombie');
var assert = require('assert');

/*
Globals
*/

var browser = new Browser();
var expectedFileSize = 444448768;

/*
Command-line specs
*/

vcurl
  .version('0.0.1')
  .option('-c, --class', 'Class name')
  .parse(process.agrv);

/*
Script
*/

function errorOut(err) {
  console.error(err);
  process.exit(1);
}

function main() {
  vcurl.class = vcurl.class.toLowerCase();
  browser.on("error", errorOut);
  browser.visit("https://myvideosu.stanford.edu")
  .then(function () {
    debugger;
  })
}

/*
Boilerplate
*/

if (require.main === module) {
  main();
} else {
  console.log("This script is meant for interactive use only");
}
