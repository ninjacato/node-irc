node-irc
=============

An eventful irc library for Node.js -- soon to be done ;-)

What I got so far:

var ircClient = require('./lib/client.js');
var client = new ircClient('irc.freenode.net', 6667, 'someNick', 'someFullName');
client.connect();
client.on('ready', function () {
  client.join('#Node.js');
});

client.on('PRIVMSG', function (data) {
  var from = data[0];
  var to = data[1];
  var message = data[2];
  console.log(from + ': ' + message);
});

client.on('CHANMSG', function (data) {
  var from = data[0];
  var to = data[1];
  var message = data[2];
  console.log(to + " " + from + ": " + message);
});

