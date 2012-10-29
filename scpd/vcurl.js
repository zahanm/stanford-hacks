
/*
Deps
*/

var vcurl = require('commander');
var Browser = require('zombie');
var assert = require('assert');
var util = require('util');

/*
Globals
*/

var browser = new Browser({
  debug: true,
  loadCSS: false,
  runScripts: false
});
var expectedFileSize = 444448768;
var hacker = {};
var classTitles = {
  "CS229": "Machine Learning",
  "CS221": "Artificial Intelligence: Principles and Techniques",
  "CS224N": "Natural Language Processing",
};

/*
Command-line specs
*/

vcurl
  .version('0.0.1')
  .option('-c, --class <name>', 'Class name')
  .parse(process.argv);

/*
Script
*/

function errorOut(err) {
  console.error("---");
  console.error(err);
  vcurl.help();
}

function checkRequiredArgs() {
  var required = [ "class" ]
  required.forEach(function (arg) {
    if (!vcurl[arg])
      errorOut(new Error("Missing required argument \"" + arg + "\""));
  });
  hacker.classTitle = classTitles[vcurl["class"]] || (function () {
    var title;
    for (code in classTitles) {
      if (classTitles.hasOwnProperty(code))
        if (vcurl["class"].toLowerCase() === code.toLowerCase())
          return classTitles[code];
    }
  }());
  if (!hacker.classTitle)
    errorOut(new Error("Invalid class name: \"" + vcurl["class"] + "\""));
}

function getCredentials(callback) {
  vcurl.prompt("sunetid: ", function (sunetid) {
    vcurl.password("password: ", function (pw) {
      hacker.sunetid = sunetid;
      hacker.pw = pw;
      callback();
    });
  });
}

function flowLogin() {
  browser.on("error", errorOut);
  browser.visit("https://myvideosu.stanford.edu")
  .then(function () {
    // login
    browser.fill("username", hacker.sunetid);
    browser.fill("password", hacker.pw);
    browser.pressButton("Login", browser.wait.bind(browser, flowClassSelection));
  });
}

function flowClassSelection() {
  // myvideosu page
  var link = browser.link(hacker.classTitle);
  browser.clickLink(link, browser.wait.bind(browser, flowLectures));
}

function flowLectures() {
  browser.dump();
}

function main() {
  checkRequiredArgs();
  getCredentials(flowLogin);
}

/*
Boilerplate
*/

if (require.main === module) {
  main();
} else {
  console.log("This script is meant for interactive use only");
}
