
var fs = require("fs");
var io = require("socket.io-client");

var botnick = "echo";
var socket = io("http://www.windows93.net:8081");

var responding = false;
var running = true;
var replaceWord = "shit";
var clearId = null;

var blacklist = {};
var admins = {};

function decodeHtmlEntity(str) {
    return str.replace(/&#(\d+);/g, function(match, dec) {
        return String.fromCharCode(dec);
    });
}

function shitify(msg) {
    var words = msg.split(/\s+/);
    var repl = ["shit", "fuck"];
    var i = Math.floor(Math.random() * words.length);
    var j = Math.floor(Math.random() * repl.length);
    //words[i] = repl[j];
    words[i] = replaceWord;
    return words.join(" ");
}

function getCmd (txt) {
    var m = txt.match(/^\/echo ([a-z]+)\s?(.*)/)
    if (m) return { cmd: m[1], val: m[2] }
}

function runAdmin(nick, cmd) {
    switch (cmd.cmd) {
        case "block": 
            blacklist[cmd.val] = true;
            break;

        case "unblock": 
            blacklist[cmd.val] = null;

        default:
            return true;
    }
    return false;
}

function runCmd(nick, cmd, admin=false) {
    if (blacklist[nick] && !admin)
        return;

    //admin = admin || admins[nick];

    switch (cmd.cmd) {
        case "help":
            socket.emit("message", "echo bot available commands: \n" + 
                    "die - does something (or not)\n" +
                    "status - show status\n" +
                    "off - turn off echoing\n" +
                    "on - turn on echoing\n" +
                    "fuckers - show blacklisted nicks\n" +
                    "word [new-word] - change replace word\n" 
            );
            break;

        case "die": 
            socket.emit("message", "### no you die, " + nick);
            break;

        case "status": 
            var status = running ? "on" : "off";
            socket.emit("message", "### echo is " + status + ", replace word is " + replaceWord);
            break;
        case "off": 
            running = false; 
            clearTimeout(clearId);
            socket.emit("message", "### echo is off");
            break;
        case "fuckers": 
            socket.emit("message", "### echo blacklist: " + Object.keys(blacklist).join(", "));
            break;
        case "on": 
            socket.emit("message", "### echo is on");
            running = true; 
            break;

        case "word":
            replaceWord = cmd.val.split(" ")[0] || "shit";
            socket.emit("message", "### echo replace word is now " + replaceWord);
            break;

        case "color":
            var color = cmd.val.split(" ")[0] || "red";
            socket.emit("user joined", botnick, color);
            break;

        default:
            var nope = true;
            if (admin)
                nope = runAdmin(nick, cmd);
            if (nope)
                socket.emit("message", nick + " is shit");
    }
}

socket.emit("user joined", botnick, "#00FFFF");

socket.on("message", function(data) {
    data.msg = decodeHtmlEntity(data.msg);

    var list = [ ];
    var nick = data.nick || '●';
    var cmd = getCmd(data.msg);


    console.log(">>>", nick, " :: ", data.msg);

    if (cmd)
        return runCmd(nick, cmd);

    if (!running)
        return;

    //if (responding)
        //return;
    //responding = true;
    var isSingleLine = data.msg.split("\n").length == 1;
    var respond = (isSingleLine && Math.random() < 0.9) || 
        list.indexOf(nick) >= 0;

    clearId = setTimeout(function() {
        if (data.nick != botnick && respond) {
            //socket.emit("message", (data.nick || '●') + " fucking said "  + data.msg);
            //socket.emit("message", "@"+(data.nick ||) + " | " +  shitify(decodeHtmlEntity(data.msg)));
            socket.emit("message", shitify(data.msg));
        }
        responding = false;
    }, 2000 + Math.random()*3000); 
});


var lineReader = require('readline').createInterface({
      input: process.stdin,
});

lineReader.on('line', function (line) {
    line = (line || "").trim();
    if (!line)
        return;

    var data = { nick: botnick, msg: line};
    var cmd = getCmd(data.msg);

    if (cmd)
        return runCmd(botnick, cmd, true);

    socket.emit("message", '@@' + line);
});


