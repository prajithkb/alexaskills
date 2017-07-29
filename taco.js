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

const APP_ID = "amzn1.ask.skill.1fc839fb-5d90-4318-bc32-5e4dc60d61ed";  // TODO replace with your app ID (OPTIONAL).


const handlers = {
    'LaunchRequest': function () {
        this.emit('GetBus');
    },
    'BusIntent': function () {
       getBus.call(this);
    },

   

   'AMAZON.HelpIntent': function () {
        const speechOutput = this.t('HELP_MESSAGE');
        const reprompt = this.t('HELP_MESSAGE');
        this.emit(':ask', speechOutput, reprompt);
    },
    'AMAZON.CancelIntent': function () {
        this.emit(':tell', this.t('STOP_MESSAGE'));
    },
    'AMAZON.StopIntent': function () {
        this.emit(':tell', this.t('STOP_MESSAGE'));
    },
};

 function getBus() {
    console.log("executing...");
        var options = {
        host: 'api.tfl.gov.uk',
            path: '/StopPoint/490003114S/arrivals',
            port: 443,
        };
        var speak = "Sorry I am not able to find it right now! but i love you";
        var body = "";
        var self = this;
        
        var request = https.get(options, function(res){
            var response ;
            
            res.on('data', function(data) {
                body += data;
            });

            var busesAndTimeRemaining = {};
            res.on('end', function() {
                try{
                response = JSON.parse(body);
                response.map(function(x){
                    var b = {
                        "bus" : x.lineName,
                        "timeRemaining" : Math.ceil(x.timeToStation/60)
                    };
                    return b;
                }).forEach(function(x){
                    if(busesAndTimeRemaining[x.bus] == null){
                        busesAndTimeRemaining[x.bus] = x.timeRemaining;
                    }
                });
                speak ="";
                
                console.log(JSON.stringify(busesAndTimeRemaining));

                Object.keys(busesAndTimeRemaining).forEach(function(key){
                    speak += "The next " + key + " is in " + busesAndTimeRemaining[key] + " minutes,"        
                });
                speak = speak.substring(0,speak.length-1);
                speak += ". Have a great bus ride!";
                
            }catch(e){
                console.log("Error ",e);
            }
            console.log(speak);
            self.emit(':tellWithCard',speak, "Your Next Bus",speak);
            });
             
            res.on('error', function(e) {
                console.log("Got error: " + e.message);
                self.emit(':tellWithCard',speak, "Your Bus",speak);
            });

           
        });
         
    }

exports.handler = function (event, context) {
    const alexa = Alexa.handler(event, context);
    alexa.APP_ID = APP_ID;
    alexa.registerHandlers(handlers);
    alexa.execute();
};
