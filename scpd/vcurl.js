
/*
Deps
*/

var vcurl = require('commander');
var Browser = require('zombie');
var assert = require('assert');
var util = require('util');
var async = require('async');

/*
Globals
*/

var browser = new Browser({
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
var vidpagelist = [];

/*
Command-line specs
*/

vcurl
  .version('0.0.1')
  .option('-c, --class <name>', 'Class code (eg: cs221)')
  .option('-s, --section', 'Add to include section videos')
  .option('-n, --number <num>', 'Number of lectures to download')
  .option('-d, --debug', 'Output debug information')
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
  // type coercion
  vcurl.number = Number(vcurl.number);
  // required
  var required = [ "class", "number" ];
  required.forEach(function (arg) {
    if (!vcurl[arg])
      errorOut(new Error("Missing required argument \"" + arg + "\""));
  });
  // flexible matching
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
  // option activation
  browser.debug = vcurl.debug || false;
}

function getCredentials(callback) {
  browser.log('-- Gathering credentials needed to authenticate');
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
    browser.log("-- Filling out login form");
    browser.fill("username", hacker.sunetid);
    browser.fill("password", hacker.pw);
    return browser.pressButton("Login");
  })
  .then(flowClassSelection);
}

function flowClassSelection() {
  browser.wait(function () {
    // myvideosu page
    browser.log("-- Navigating to class page");
    var link = browser.link(hacker.classTitle);
    browser.clickLink(link)
    .then(flowLectures);
  });
}

function flowLectures() {
  browser.wait(function () {
    // class lectures page
    browser.log("-- Finding relevant lecture pages");
    var weeks = browser.queryAll("#course_sections table");
    weeks.forEach(function (week) {
      var days = week.getElementsByTagName("tr");
      // remove header row
      days = Array.prototype.slice.call(days, 1);
      days.forEach(function (day) {
        var typetext = day.cells[2].textContent;
        if (vcurl.section || !typetext.match(/problem\s+session/i)) {
          var wmplink = day.querySelector("a:contains(WMP)");
          if (vidpagelist.length < vcurl.number) {
            addToDownList(wmplink);
          }
        }
      });
    });
    flowVideoLinks();
  });
}

function addToDownList(lecture) {
  // extracting url from -- javascript:void(window.open('.. [url] ..'))
  var matches = lecture.href.match(/window\.open\('(.*)'\)/)
  if (!matches) {
    console.error("Bad vidpage url: " + util.inspect(lecture));
    return;
  }
  var vidpage = matches[1].split(/\s+/).join('');
  vidpagelist.push(vidpage);
}

function flowVideoLinks() {
  // visit each video page in series
  browser.log("-- Lecture pages: " + util.inspect(vidpagelist));
  var page = 1;
  async.mapSeries(vidpagelist, function (vidpage, next) {
    browser.visit(vidpage, function () {
      browser.log("-- Looking at video page " + page);
      var wmplayer = browser.query("#WMPlayer");
      if (!wmplayer)
        next(new Error("Video page is missing #WMPlayer component"));
      var httplink = wmplayer.attributes["data"].value
      var mmshlink = "mmsh" + httplink.match(/http(.*)/)[1] + "?MSWMExt=.asf";
      page++;
      next(null, mmshlink);
    });
  }, function (err, downlinks) {
    if (err)
      errorOut(err);
    flowDownloads(downlinks);
  });
}

function flowDownloads(downlinks) {
  console.log(util.inspect(downlinks));
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
