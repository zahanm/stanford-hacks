
var vcurl = require('commander');

vcurl
  .version('0.0.1')
  .option('-v, --video-url', 'HTTP Video URL')
  .parse(process.agrv);

console.log("hello");
