'use strict';

chrome.runtime.onInstalled.addListener(details => {
  console.log('previousVersion', details.previousVersion);
});

chrome.browserAction.setBadgeText({text: 'c+k'});

console.log('\'Allo \'Allo! Event Page for Browser Action');


chrome.commands.onCommand.addListener(function(command) {
  console.log('Command:', command);
});
