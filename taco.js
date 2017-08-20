/* eslint-disable  func-names */
/* eslint quote-props: ["error", "consistent"]*/
/**
 * This sample demonstrates a simple skill built with the Amazon Alexa Skills
 * nodejs skill development kit.
 * This sample supports multiple lauguages. (en-US, en-GB, de-DE).
 * The Intent Schema, Custom Slots and Sample Utterances for this skill, as well
 * as testing instructions are located at https://github.com/alexa/skill-sample-nodejs-fact
 **/

'use strict';

const Alexa = require('alexa-sdk');
var https = require('https');

const APP_ID = "amzn1.ask.skill.1fc839fb-5d90-4318-bc32-5e4dc60d61ed"; // TODO replace with your app ID (OPTIONAL).

String.prototype.insert = function(index, string) {
    if (index > 0)
        return this.substring(0, index) + string + this.substring(index, this.length);
    else
        return string + this;
};

String.prototype.replaceAt = function(index, replacement) {
    return this.substr(0, index) + replacement + this.substr(index + replacement.length);
}

var states = {
    START: '_START', 
    END: '_END' 
};

const startStateHandlers = Alexa.CreateStateHandler(states.START, {
    "NewSession": function() {
        this.handler.state = states.START;
        this.emitWithState("BusIntent");
    },
    'LaunchRequest': function() {
        this.handler.state = states.START;
        this.emitWithState("BusIntent");
    },
    'BusIntent': function() {
        tfl.call(this, this, function(args) {
            if (args.emitType == ":tell") {
                this.emit(args.emitType, args.speak);
            } else if (args.emitType == ":tellWithCard") {
                this.emit(args.emitType, args.speak, args.title, args.content);
            } else {
                this.emit(args.emitType, args.speak, args.reprompt, args.title, args.content);
            }
        });

    },
    'SessionEndedRequest': function() {
        console.log('session ended!');
        this.emit(':saveState', false);
    }

});

const endStateHandlers = Alexa.CreateStateHandler(states.END, {
    "NewSession": function() {
        this.handler.state = states.START;
        this.emitWithState("BusIntent");
    },
    'BusIntent': function() {
        tfl.call(this, this, function(args) {
            if (args.emitType == ":tell") {
                this.emit(args.emitType, args.speak);
            } else if (args.emitType == ":tellWithCard") {
                this.emit(args.emitType, args.speak, args.title, args.content);
            } else {
                this.emit(args.emitType, args.speak, args.reprompt, args.title, args.content);
            }
        });

    },
    'CompleteListIntent': function() {
        console.log(" in the complete intent")
        tfl.call(this, this, function(args) {
            this.emit(":tellWithCard", args.speak, args.title, args.content);
        }, function(buses) {
            var speakableText = "";
            Object.keys(buses).forEach(function(key) {
                var s = "The next " + key + " is in " + buses[key].join(" minutes, ") + " minutes.";
                var lastIndexOfComma = s.lastIndexOf(',');
                s = s.slice(0, lastIndexOfComma) + s.slice(lastIndexOfComma + 1, s.length);
                s = s.insert(lastIndexOfComma, " and");
                console.log(s)
                speakableText += s + " ";
            });
            return speakableText;
        });
        this.handler.state = states.END;

    },
    'AMAZON.HelpIntent': function() {
        this.handler.state = states.START;
        this.emit(':ask', "Say, Ask Taco when is the next bus", "Was I able to help?");
    },
    'AMAZON.CancelIntent': function() {
        this.emit(':tell', "Sure");
    },
    'AMAZON.StopIntent': function() {
        this.emit(':tell', "Ok");
    },
    "AMAZON.RepeatIntent": function() {
        this.handler.state = states.START;
        this.emitWithState("BusIntent");
    },
    "YesIntent": function() {
        console.log("in the yes Int  ent")
        this.emitWithState('CompleteListIntent');
    },
    "AMAZON.NoIntent": function() {
        this.emit(":tell", "Ok! have a great bus ride!");
    },
    "Unhandled": function() {
        var speechOutput = "Sorry, I am not sure";
        var reprompt = " Can you please repeat it?";
        this.emit(":ask", speechOutput + "." + reprompt, reprompt);
    },
    'SessionEndedRequest': function() {
        console.log('session ended!');
        this.emit(':saveState', false);
    }

});

var newSessionHandlers = {
    "NewSession": function() {
        this.handler.state = states.START;
        this.emitWithState("BusIntent");
    },
    "LaunchRequest": function() {
        this.handler.state = states.START;
        this.emitWithState("BusIntent");
    },
    'BusIntent': function() {
        this.handler.state = states.START;
        console.log("I am here")
        tfl.call(this, this, function(args) {
            if (args.emitType == ":tell") {
                this.emit(args.emitType, args.speak);
            } else if (args.emitType == ":tellWithCard") {
                this.emit(args.emitType, args.speak, args.title, args.content);
            } else {
                this.emit(args.emitType, args.speak, args.reprompt, args.title, args.content);
            }
        });

    },
    "AMAZON.StartOverIntent": function() {
        this.handler.state = states.START;
        this.emitWithState("BusIntent");
    },
    "AMAZON.HelpIntent": function() {
        this.handler.state = states.START;
        this.emitWithState("AMAZON.HelpIntent");
    },
    "Unhandled": function() {
        var speechOutput = "Sorry, I am not sure ";
        var reprompt = " Can  please you repeat it?";
        this.emit(":ask", speechOutput + "." + reprompt, reprompt);
    },
    'SessionEndedRequest': function() {
        console.log('session ended!');
        this.emit(':saveState', false);
    }
};



function tfl(context, callback, speakableText) {
    var options = {
        host: 'api.tfl.gov.uk',
        path: '/StopPoint/490003114S/arrivals',
        port: 443,
    };
    var result = {};
    var speak = "Sorry I am not able to find it right now!";
    var displayText = "";
    var body = "";
    //this is the call
    var request = https.get(options, function(res) {
        var response;

        res.on('data', function(data) {
            body += data;
        });

        var busesAndTimeRemaining = {};
        var buses = {};
        res.on('end', function() {
            try {
                response = JSON.parse(body);
                response.sort(function(a, b) {
                    //Sort based on the ETA
                    if (a.timeToStation < b.timeToStation) {
                        return -1;
                    } else {
                        return 1;
                    }
                }).map(function(x) {
                    //Extract the information which is relevant
                    var b = {
                        "bus": x.lineName,
                        "timeRemaining": Math.floor(x.timeToStation / 60)
                    };
                    return b;
                }).forEach(function(x) {
                    // Extract two maps, one for speaking, one for showing.
                    if (busesAndTimeRemaining[x.bus] == null) {
                        busesAndTimeRemaining[x.bus] = x.timeRemaining;
                    }
                    if (buses[x.bus] == null) {
                        buses[x.bus] = [];
                    }
                    buses[x.bus].push(x.timeRemaining);
                });
                console.log(JSON.stringify(buses));
                Object.keys(buses).forEach(function(key) {
                    displayText += "Bus no - " + key + " (in mins): " + buses[key].join(",") + ".\n";
                });
                console.log(displayText);
                speak = "";
                if (!speakableText) {
                    Object.keys(busesAndTimeRemaining).forEach(function(key) {
                        speak += "The next " + key + " is in " + busesAndTimeRemaining[key] + " minutes,"
                    });
                    speak = speak.substring(0, speak.length - 1);
                } else {
                    console.log("Using injected speakable text transformer");
                    speak = speakableText(buses);
                }
                console.log(JSON.stringify(busesAndTimeRemaining));
                result.reprompt = ". Do you want to know the complete list?";
                console.log(speak);
                if (context.handler.state == states.END) {
                    result.speak = speak;
                    result.emitType = ":tellWithCard";
                } else {
                    context.handler.state = states.END;
                    result.speak = speak + " " + result.reprompt;
                    result.emitType = ":askWithCard";
                }

            } catch (e) {
                console.log("Error ", e);
                result.emitType = ":tell";
            }
            result.title = "Your Next Bus";
            result.content = displayText;
            callback.call(context, result);
        });

        res.on('error', function(e) {
            console.log("Got error: " + e.message);
            result.speak = speak;
            callback.call(context, result);
        });


    });
}


exports.handler = function(event, context) {
    var alexa = Alexa.handler(event, context);
    alexa.APP_ID = APP_ID;
    alexa.registerHandlers(newSessionHandlers, startStateHandlers, endStateHandlers);
    alexa.execute();
};
