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
var http = require('http');

const APP_ID = "kizzy";  // TODO replace with your app ID (OPTIONAL).


const handlers = {
    'LaunchRequest': function () {
        this.emit('GetQuote');
    },
    'KizzyQuote': function () {
        this.emit('GetQuote');
    },
    'GetQuote': function () {
        var quoteReponse ;
        var imageObj = {
            smallImageUrl: 'https://s-media-cache-ak0.pinimg.com/736x/cb/43/1a/cb431a937eefd5f2db41d12e09960873--wall-calendars-greeting-cards.jpg',
            largeImageUrl: 'https://s-media-cache-ak0.pinimg.com/736x/cb/43/1a/cb431a937eefd5f2db41d12e09960873--wall-calendars-greeting-cards.jpg'
        };
        http.get('http://api.forismatic.com/api/1.0/?method=getQuote&lang=en&format=json', (res) => {
            const { statusCode } = res;
            const contentType = res.headers['content-type'];

            let error;
            if (statusCode !== 200) {
                error = new Error('Request Failed.\n' +
                              `Status Code: ${statusCode}`);
            } else if (!/^application\/json/.test(contentType)) {
                error = new Error('Invalid content-type.\n' +
                              `Expected application/json but received ${contentType}`);
            }
            if (error) {
                console.error(error.message);
                // consume response data to free up memory
                res.resume();
                this.emit(':tellWithCard', "Here us your kizzy quote: All the rules are pro kizzy, by kizzy", "kizzy quote", "All the rules are pro kizzy");
                return;
            }

            res.setEncoding('utf8');
            let rawData = '';
            res.on('data', (chunk) => { rawData += chunk; });
            res.on('end', () => {
                try {
                  quoteReponse= JSON.parse(rawData);
                  console.log(quoteReponse);
                    var speakableString =  "All the rules are pro kizzy"
                    try{
                        speakableString = quoteReponse.quoteText + " by " + quoteReponse.quoteAuthor;
                        console.log(speakableString);
                    }catch(e){
                        console.log("Error "+ e);
                    }
                    const speechOutput = 'Here is your kizzy quote: '  + speakableString;
                    this.emit(':tellWithCard', speechOutput, "kizzy quote", speakableString, imageObj);
                 } catch (e) {
                  console.error(e.message);
                  this.emit(':tellWithCard', "Here us your kizzy quote: All the rules are pro kizzy, by kizzy", "kizzy quote", "All the rules are pro kizzy");
                }
            });
        }).on('error', (e) => {
            console.error(`Got error: ${e.message}`);
            this.emit(':tellWithCard', "Here us your kizzy quote: All the rules are pro kizzy, by kizzy", "kizzy quote", "All the rules are pro kizzy");
        });
        
    
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

exports.handler = function (event, context) {
    const alexa = Alexa.handler(event, context);
    alexa.APP_ID = APP_ID;
    alexa.registerHandlers(handlers);
    alexa.execute();
};
