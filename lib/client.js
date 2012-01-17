var events = require('events');

function ircClient (server, port, nick, fullname) {
  this.host = (server || 'irc.freenode.net');
  this.port = (port || 6667);
  this.nick = (nick || 'SomeBot');
  this.fullname = (fullname || 'SomeBot');
  this.verbosity = 0; // 0 => Silent, 1 => Normal, 2 => Info, 3 => Debug
 
  events.EventEmitter.call(this);
  return this;
}

ircClient.super_ = events.EventEmitter;
ircClient.prototype = Object.create(events.EventEmitter.prototype);

ircClient.prototype.connect = function () {
  var that = this;
  var net = require('net');
  var client = net.createConnection(that.port, that.host);

  client.addListener('connect', function() {
  	client.write('NICK ' + that.nick + '\r\n');
    client.write('USER ' + that.nick + ' 0 * :' + that.fullname + '\r\n');
    that.logger('Client connected', 1);
  });

  client.addListener('data', function(data) {
    var response = data.toString();
    that.dispatcher(response);
  });

  client.addListener('close', function(data) {
    logger('Disconnected from server', 1);
  });
  
  this.client = client;
};

// FORMALITY HANDLERS

ircClient.prototype.dispatcher = function (data) {
  var response = data.split('\n')
  , formatResponse
  , preparedResponse
  , sortedResponse;

  if (data.match('^PING')) {
  	console.log
    this.pingHandler(data);
  } else {
    for (var i = 0;i < response.length;i++) {
      preparedResponse = trim(response[i]);
      preparedResponse = preparedResponse.split(" ");
      if(preparedResponse[1] === '376') { // If MOTD has been written
        this.emit('ready');
      } else { 
        sortedResponse = formatter(preparedResponse);
        this.messageHandler(sortedResponse[0], sortedResponse[1], sortedResponse[2], sortedResponse[3]);
      }
    }
  }
};

ircClient.prototype.messageHandler = function (method, receiver, sender,  message) {
  if (method === 'PRIVMSG') {
    var data = [sender, receiver, message];
    if (receiver.match('^#')) {
    	this.emit('CHANMSG', data);
    } else {
    	this.emit('PRIVMSG', data); 
    }
  }
};

ircClient.prototype.pingHandler = function (response) {
  var splitResponse = [];
  splitResponse = response.split(" ");  
  this.client.write('PONG ' + splitResponse[1] + '\r\n');
}

// USER COMMANDS

ircClient.prototype.join = function (channel) {
  if(channel.match('^#')) {
    this.client.write('JOIN ' + channel + '\r\n'); 
  } else {
    this.client.write('JOIN #' + channel + '\r\n');
  }
};

ircClient.prototype.quit = function (message) {
  this.client.write('QUIT ' + message + '\r\n');
};

ircClient.prototype.part = function (channel) {
  this.client.write('PART ' + message + '\r\n');
};

ircClient.prototype.say = function (channel) {
  this.client.write('SOMETHING ' + message + '\r\n');
};

// TOOLBOX

ircClient.prototype.logger = function (message, level) {
  if ((this.verbosity !== 0) && (this.verbosity >= level)) {
  		console.log('Level ' + level + ': ' + message)
  }
}

function trim (string) {
  string = string.replace(/(^\s*)|(\s*$)/gi,"");
  string = string.replace(/[ ]{2,}/gi," ");
  string = string.replace(/\n /,"\n");
  return string;
}

function formatter (response) {
  var method = response[1];
  var receiver = response[2];
  var sender = response[0];
  // Concatenate the rest of the array consisting of the message
  var message  = response.slice(3).join(" ").substring(1); 
  
  // In case sender is a nick!user@host, parse the nick.
  try {
    var formatUserhost = new RegExp(/\b[^]*(.*?)!/); // :nick!user@host => 
    var nick = formatUserhost.exec(sender);          // [n,i,c,k,!] =>
    var s = nick.join("");                           // nick! => 
    sender = (s.substring(0,(s.length-1)));          // nick => Done.
  } catch(e) {
  	sender = undefined;
  }
  
  var formattedReturn = [method, receiver, sender, message];
  return formattedReturn;
}

module.exports = ircClient;