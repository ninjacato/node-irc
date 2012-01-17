var events = require('events');

function ircClient (server, port, nick, fullname) {
  this.host = (server || 'irc.freenode.net');
  this.port = (port || 6667);
  this.nick = (nick || 'SomeBot');
  this.fullname = (fullname || 'SomeBot');
  this.client = undefined;
  this.verbosity = 0; // Log level: 0 = Silent, 1 = Info, 2 = Debug
  this.connected = false;
 
  events.EventEmitter.call(this);
  return this;
}

ircClient.super_ = events.EventEmitter;
ircClient.prototype = Object.create(events.EventEmitter.prototype);

function trim(s) {
  s = s.replace(/(^\s*)|(\s*$)/gi,"");
  s = s.replace(/[ ]{2,}/gi," ");
  s = s.replace(/\n /,"\n");
  return s;
}

ircClient.prototype.connect = function () {
  var that = this;
  var net = require('net');
  var client = net.createConnection(that.port, that.host);

  client.addListener('connect', function() {
    console.log('Client connected');
  });

  client.addListener('data', function(data) {
    var response = data.toString();
    that.dispatcher(response);
    if (data == 'close') client.end();
  });

  client.addListener('close', function(data) {
    console.log('Disconnected from server');
  });
  
  this.client = client;
}

// FORMALITY HANDLERS

ircClient.prototype.dispatcher = function (data) {
  var temp = data.split('\n');
  var response = data;
  console.log(response);
  for(var i = 0;i < temp.length;i++) {
    var line = trim(temp[i]);
    line = line.split(" ");
    if(line[1] === '376') { 
      this.emit('ready');
    } else {
      var method = line[1];
      var receiver = line[2];
      var sender = line[0];
      var message  = line.slice(3).join(" ").substring(1);
      this.interpreter(method, receiver, sender, message);
    }
  }
  if (response.match('PING')) {
    this.pingHandler(response);
  }
  if (response.match('Found your hostname')) {
    this.client.write('NICK ' + this.nick + '\r\n');
    this.client.write('USER ' + this.nick + ' 0 * :' + this.fullname + '\r\n');
  }
}

ircClient.prototype.interpreter = function (method, receiver, sender,  message) {
  if (method === 'PRIVMSG') {
    var m_message = [receiver, message];
    this.emit('PRIVMSG', m_message); 
  }
}

ircClient.prototype.pingHandler = function (response) {
  var splitResponse = [];
  splitResponse = response.split(" ");  
  this.client.write('PONG ' + splitResponse[1] + '\r\n');
  console.log('PONG ' + splitResponse[1]);
}

// USER COMMANDS

ircClient.prototype.join = function (channel) {
  if(channel.match('#')) {
    this.client.write('JOIN ' + channel + '\r\n'); 
    console.log(' JOINED ' + channel);
  } else {
    this.client.write('JOIN #' + channel + '\r\n');
    console.log('JOINED #' + channel);
  }
}

ircClient.prototype.quit = function (message) {
  this.client.write('QUIT ' + message + '\r\n');
}

ircClient.prototype.part = function (channel) {
  this.client.write('PART ' + message + '\r\n');
}

ircClient.prototype.say = function (channel) {
  this.client.write('SOMETHING ' + message + '\r\n');
}



module.exports = ircClient;
