node-irc
=============

An eventful irc library for Node.js -- soon to be done ;-)

TODO: 
- Add more commands and events
- Make objects instead of arrays
- Fill in the blanks

What I got so far:

    var ircClient = require('./lib/client.js');
    var client = new ircClient('irc.freenode.net', 6667, 'someNick', 'someFullName');
    client.connect();
    client.on('ready', function () {
      client.join('#Node.js');
    });

    client.on('PRIVMSG', function (data) {
      var from = data[0]
      , to = data[1]
      , message = data[2];
      console.log(from + ': ' + message);
    });

    client.on('CHANMSG', function (data) {
      var from = data[0]
      , to = data[1]
      , message = data[2];
      console.log(to + " " + from + ": " + message);
    });

