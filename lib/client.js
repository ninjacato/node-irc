(function () {
    var events = require('events');

    function ircClient(server, port, nick, fullname) {
        this.host = server;
        this.port = port;
        this.nick = nick;
        this.fullname = fullname;
        this.verbosity = 1; // 0 => Silent, 1 => Normal, 2 => Info, 3 => Debug
        events.EventEmitter.call(this);
        return this;
    }

    ircClient.super_ = events.EventEmitter;
    ircClient.prototype = Object.create(events.EventEmitter.prototype);

    ircClient.prototype.connect = function () {
        var that = this,
            net = require('net'),
            client = net.createConnection(that.port, that.host);

        client.addListener('connect', function () {
            client.write('NICK ' + that.nick + '\r\n');
            client.write('USER ' + that.nick + ' 0 * :' + that.fullname + '\r\n');
            that.logger('Client connected', 1);
        });

        client.addListener('data', function (data) {
            that.dispatcher(data.toString());
        });

        client.addListener('close', function (data) {
            that.logger('Disconnected from server', 1);
        });
 
        this.client = client;
    };

    // FORMALITY HANDLERS

    ircClient.prototype.dispatcher = function (data) {
        var response = data.split('\n'),
            formatResponse,
            preparedResponse,
            sortedResponse,
            i;

        if (data.match('^PING')) {
            this.pingHandler(data);
        } else {
            for (i = response.length; i--;) {
                rawResponse = response[i].split(" ");
                if(rawResponse[1] === '376') { // If MOTD has been written
                    this.emit('ready');
                } else { 
                    this.eventHandler(assembleResponse(rawResponse));
                }
            }
        }
    };

    ircClient.prototype.eventHandler = function (data) {
        if (data.method === 'PRIVMSG') {
            if (data.receiver.match('^#')) {
    	       this.emit('CHANMSG', data);
            } else {
    	       this.emit('PRIVMSG', data); 
            }
        }
        else if (data.method === 'JOIN') {
            // Remove preceding semi-colon
            data.receiver = data.receiver.substring(1, data.receiver.length);
            this.emit('JOIN', data);
        }
    };

    ircClient.prototype.pingHandler = function (response) {
        var splitResponse = [];
        splitResponse = response.split(" ");  
        this.client.write('PONG ' + splitResponse[1] + '\r\n');
    };

    ircClient.prototype.logger = function (message, level) {
        if ((this.verbosity !== 0) && (this.verbosity >= level)) {
            console.log('Level ' + level + ': ' + message);
        }
    };

    // USER COMMANDS

    ircClient.prototype.join = function (channel) {
        this.logger('JOIN ' + channel, 1);
        this.client.write('JOIN ' + channel + '\r\n');   
    };

    ircClient.prototype.quit = function (message) {
        this.logger('QUIT :' + message, 1);
        this.client.write('QUIT :Quit: ' + message + '\r\n');
    };

    ircClient.prototype.part = function (channel) {
        this.logger('PART ' + message, 1);
        this.client.write('PART ' + channel + '\r\n');
    };

    ircClient.prototype.say = function (message) {
        this.logger('PRIVMSG ' + message, 1);
        this.client.write('PRIVMSG ' + message + '\r\n');
    };

    // TOOLBOX
    function assembleResponse (response) {
        var sender,
            formatUserhost,
            formatNick,
            formattedReturn,
            nick;
 
        // In case sender is a nick!user@host, parse the nick.
        try {
            formatUserhost = new RegExp(/\b[^]*(.*?)!/); // :nick!user@host => 
            nick = formatUserhost.exec(response[0]);          // [n,i,c,k,!] =>
            formatNick = nick.join("");                           // nick! => 
            sender = (formatNick.substring(0,(formatNick.length-1)));          // nick => Done.
        } catch(e) {
            if (response[0].match('^:')) {
                sender = response[0].substring(1, response[0].length);
            } else {
                sender = undefined;    
            }
        }
        var returnObject = {
            method: response[1],
            receiver: response[2],
            sender: sender,
            message: response.slice(3).join(" ").substring(1)
        };

        return returnObject;
    }

    module.exports = ircClient;
})();
