
/*
Deps and Command-line Specs
*/

var prompt = require('prompt')
 , Browser = require('zombie')
 , assert = require('assert')
 , util = require('util')
 , async = require('async')
 , spawn = require('child_process').spawn
 , fs = require('fs')
 , pace = require('pace');

var argv = require('optimist')
.usage("Usage: $0 -c <class> -n <number>")
.demand('c')
.default({'n': 1, 'k': 0})
.boolean(['s', 'd'])
.alias({
  'c': 'class',
  's': 'section',
  'n': 'number',
  'd': 'debug',
  'k': 'skip'
})
.describe({
  'c': 'Class code (eg: cs221)',
  's': 'Include section videos?',
  'n': 'Number of lectures to download',
  'd': 'Output debug information',
  'k': 'Skip videos from front'
})
.argv;

prompt.message = "vcurl";

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
Script
*/

function errorOut(err) {
  console.error("---");
  console.error(err);
  argv.showHelp();
  process.exit(1);
}

function checkRequiredArgs() {
  // flexible matching
  hacker.classTitle = classTitles[argv.class] || (function () {
    var title;
    for (code in classTitles) {
      if (classTitles.hasOwnProperty(code))
        if (argv.class.toLowerCase() === code.toLowerCase())
          return classTitles[code];
    }
  }());
  if (!hacker.classTitle)
    errorOut(new Error("Invalid class name: \"" + argv.class + "\""));
  // option activation
  browser.debug = argv.debug || false;
}

function getCredentials(callback) {
  browser.log('-- Gathering credentials needed to authenticate');
  prompt.start();

  prompt.get({ properties: {
    sunetid: {
      required: true
    },
    password: {
      hidden: true,
      required: true
    }
  }}, function (err, result) {
    if (err)
      errorOut(err);
    hacker.sunetid = result.sunetid;
    hacker.pw = result.password;
    callback();
  });
}

function flowLogin() {
  console.log("Getting video download links, please be patient");
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
        if (argv.section || !typetext.match(/problem\s+session/i)) {
          var wmplink = day.querySelector("a:contains(WMP)");
          if (vidpagelist.length < (argv.number + argv.skip)) {
            addToDownList(wmplink);
          }
        }
      });
    });
    vidpagelist.splice(0, argv.skip);
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
  browser.log("-- Lecture pages:\n" + vidpagelist.join('\n') + '\n');
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
  // Actually download the videos, using mplayer
  if (!fs.existsSync("./scpdvideos"))
    fs.mkdirSync("./scpdvideos");
  // make output directory - mkdir -p
  browser.log("-- Video links:\n" + downlinks.join('\n') + '\n');
  var progress = pace({ total: argv.number * expectedFileSize });
  var command = "mplayer";
  var args = ["-dumpstream", "-dumpfile"];
  var vidnum = 1;
  // download in reverse order to facilitate viewing right away
  downlinks.reverse();
  async.forEachSeries(downlinks, function (downlink, next) {
    var fname = argv.class + "-" + vidnum + ".wmv"
    var child = spawn(command, args.concat(fname, downlink), {
      stdio: "pipe",
      cwd: "./scpdvideos"
    });
    child.on('exit', function (code) {
      if (code !== 0) {
        return next(new Error(
          "Cmd: \'" + command + " " + args.concat(fname, downlink).join(" ")
            + "\' failed"
        ));
      }
      progress.op(vidnum * expectedFileSize);
      vidnum++;
      next(null);
    });
    child.stdout.on("data", function (data) {
      var match = String(data).match(/dump:\s+(\d+)\s+bytes/);
      if (match) {
        var bytes = Number(match[1]);
        var finished = bytes / expectedFileSize;
        progress.op((vidnum - 1) * expectedFileSize + bytes);
      }
    });
  }, function (err) {
    if (err)
      errorOut(err);
    console.log("Finished downloading " + downlinks.length + " videos");
  });
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
