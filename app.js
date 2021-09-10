// Main application logic

const chrono = require('chrono-node')

const CALENDAR_ID = process.env.CALENDAR_ID || 'cepheidgaming@gmail.com';
const SHEET_ID = process.env.SHEET_ID || '1l5LoaIEPECoR-cMHhsy-gkgEPOLs3WfhrgeJ9byRs0k'; // S8 Test Sheet
const WEEKS = process.env.WEEKS || 5;
const CELL_RANGES = [`B5:I14`,`B17:I26`,`B29:I38`];
const TWITCH_URL = `https://www.twitch.tv/`;

// GNL S4 id: 1X3pV8NHzimYPmn99mgwFap8Y01j8hH5l9s2gtvUjt3g
// GNL S5 id: 1kSpVRFMthBJc_FLILAQAFH7UvqUMbtZWaegVA9i858Y
// GNL S6 id: 1h864L0Knq-l6rLgLNsRJ0tAeioNSYgu2OawsLggO3nc
// test id: 1XX3EvIFvZ2irNI74ne1CKP4ONT49ZjiVHof3NAS9JTk
// S8 test: 1l5LoaIEPECoR-cMHhsy-gkgEPOLs3WfhrgeJ9byRs0k

module.exports.run = async function(sheets, calendar) {

    console.log("Scanning spreadsheet...")
    
    // get all the spreadsheet matches in format [datetime, player1, player2]
    let spreadsheetMatches = await getAllSpreadsheetMatches(sheets)

    // get all the existing events on the calendar
    let allEvents = await getEvents(calendar)

    if (allEvents.length === 0) {
        console.log("No events were retrieved")
    }

    // first time use to add starting data to the calendar
    // DONT UNCOMMENT THIS UNLESS YOU ARE ERASING THE ENTIRE CALENDAR
    //await createInitialEvents(spreadsheetMatches, calendar)

    // checks all the existing events on the calendar against the spreadsheet, and updates the time.
    // (does not support changing the player)
    await updateMatchesByPlayers(spreadsheetMatches, allEvents)

    // check for events that the calendar does not have, and add the new ones
    await addNewEvents(spreadsheetMatches, calendar)

    /**
 * @param matches Matches in the format ['Iso string of datetime', 'player 1', 'player 2']
 * @param calendar Authenticated Google Calendar object
 */

    async function addNewEvents(matches, calendar) {

        // matches comes in with all matches, some have times, some do not.

        let events = await getEvents(calendar)

        for (var i = matches.length; i>=0; i--) {
           let thisMatch = matches[i]

           if (!thisMatch) {
               continue
           }

            if (!matches[0]) {
                console.log("All events already up to date")
                return
            }

           if (events.length != 0) {
               for (element in events) {
                   // remove all existing calendar events from consideration to prevent duplicates
                   let thisEvent = events[element]
                   let regex = new RegExp(`${escapeRegExp(thisMatch[1])}|${escapeRegExp(thisMatch[2])}`,'g')
                   let regexResult = thisEvent.summary.match(regex)

                   if (regexResult && regexResult.length === 2) {
                       match.splice(i, 1)
                   }
               }
           }
        }

        for (element in matches) {
            let newMatch = matches[element]

            let end = new Date(newMatch[0])
            end.setHours(end.getHours() + 1)

            if (newMatch[0] === undefined) continue // this means no time has been set for the match yet

            var event = {
                'summary': `GNL Match - ${newMatch[1]} vs ${newMatch[2]}`,
                'location': 'Gym Discord',
                'description': 'A GNL Season 4 Match',
                'start': {
                    'dateTime': `${newMatch[0]}`
                },
                'end': {
                    'dateTime': `${end.toISOString()}`
                },
            }

            await sleep(250)
            createEventOnCalendar(event, calendar)

            function sleep(ms) {
                return new Promise((resolve) => {
                  setTimeout(resolve, ms);
                });
            }   
        }
    }

    /**
 * @param matches Matches in the format ['Iso string of datetime', 'player 1', 'player 2']
 * @param events All events from a google calendar as received by the Google Api (i.e. results.data.items)
 */

    async function updateMatchesByPlayers(matches, events) {
        // matches comes from the spreadsheet, events comes from the calendar
        // this function returns an array containing all events that are new and must be added to the calendar

        let correctMatchIds = []
        
        for (element in matches) {
            let thisMatch = matches[element]

            for (element in events) {
                // check all the events in the calendar for the player names in the description
                let thisEvent = events[element]

                if (thisMatch[0] == undefined || thisMatch[1] == undefined || thisMatch[2] == undefined) continue

                let regex = new RegExp(`${escapeRegExp(thisMatch[1])}|${escapeRegExp(thisMatch[2])}`,'g')

                let regexMatch = thisEvent.summary.match(regex)
                
                if (regexMatch && regexMatch.length === 2) {
                    // the calendar has a match listed between these two players
                    let spreadsheetDatetime = new Date(thisMatch[0]).toISOString()
                    let calendarDatetime = new Date(thisEvent.start.dateTime).toISOString()

                    if (spreadsheetDatetime === calendarDatetime) {
                        // spreadsheet and calendar agree on the start time
                        correctMatchIds.push(thisEvent.id)
                        continue
                    } else {
                        // spreadsheet and calendar do not agree on the starttime
                        // this will mean the starting time has been changed on the spreadsheet - therefore update
                        let updatedEvent = await updateEventStarttime(thisEvent, calendar, spreadsheetDatetime)
                        correctMatchIds.push(updatedEvent.id)

                    }
                }
            }
        }

        return correctMatchIds
    }

    async function updateEventStarttime(event, calendar, start) {

        let updatedEvent = event
        updatedEvent.start.dateTime = start

        let end = new Date(start)
        end.setHours(end.getHours() + 1)

        updatedEvent.end.dateTime = end
        
       calendar.events.update({
            calendarId: CALENDAR_ID,
            eventId: event.id,
            resource: updatedEvent
        }, function(err, event) {
            if (err) {
                console.log('There was an error contacting the Calendar service: ' + err);
                return;
            }
            console.log(`Event updated: ${event.summary}`);
        });

        return updatedEvent
    }

    async function getAllSpreadsheetMatches(sheets) {

        let cellRangesForMatches = createClanWarStrings(); // [`Week 1!B5:I14`, `Week 1!B17:I26`, ... etc ]
        let allSpreadsheetMatches = []

        for (element in cellRangesForMatches) {
            
            let clanWar = await requestGNLClanWarDataBlock(sheets, cellRangesForMatches[element]) 
            let teamNames = [clanWar[0][4], clanWar[0][7]];
            let timezone = clanWar[0][2];

            clanWar.shift(); // remove the header row
            
            for (element in clanWar) {
                if (clanWar[element] != undefined) {

                    if (clanWar[element][2] == undefined) return

                    let match = []

                    if (clanWar[element][2] && clanWar[element][3]) { // must have TIME and DATE
                        
                        let matchStartTime = convertToIso(`${clanWar[element][2]} ${clanWar[element][3]}`, timezone);
                        
                        if (matchStartTime != null) {
                            match.push(matchStartTime);
                        }
                    }
                    else {
                        continue;
                    }
                    match.push(clanWar[element][4])
                    match.push(clanWar[element][7])

                    if (match != undefined && match[0] && match.length == 3) {
                        allSpreadsheetMatches.push(match)
                    }
                }
            }
        }

        console.log(allSpreadsheetMatches)

        return allSpreadsheetMatches
        
    }

    async function getEvents(calendar) {
        const results = await calendar.events.list({
            calendarId: CALENDAR_ID,
            showDeleted: false,
            maxResults: 2500
        })

        const events = results.data.items

        return events

    }

    function createEventOnCalendar(event, calendar) {
        calendar.events.insert({
            calendarId: CALENDAR_ID,
            resource: event,
        }, function(err, event) {
            if (err) {
                console.log('There was an error contacting the Calendar service: ' + err);
                return;
            }
            console.log('Event created: ');
            console.log(event.data.summary)
        });
    }

    function convertToIso(match, timezone) {

        let timezoneMatch = timezone.match(/EDT|EST|UTC|CEST|CET/)
        let timezoneString;
        let adjustment;
        
        if (timezoneMatch != null) {
            timezoneString = timezoneMatch[0]
        } else {
            timezoneString = `EST`;
        }

        switch(timezoneString){
            case(`EST`):
                adjustment = 5;
                break;
            case(`EDT`):
                adjustment = 4;
                break;
            case(`UTC`):
                adjustment = 0;
                break;
            case(`CEST`):
                adjustment = -2;
                break;
            case(`CET`):
                adjustment = -1;
                break;
            default:
                adjustment = 5;
                break;
        }
        
        if (match != '' && match != undefined) { // converts the data to a standard accepted by google calendar

            // create a new date object based on the date in the match field (thanks chrono)
            let parsedDate = new Date (chrono.parseDate(`${match}`))
            // change the hours to the UTC time of the match (+4 hours thanks to EDT)
            let hours = parseInt(match[0].match(/\d{1,2}/)) + adjustment
            parsedDate.setUTCHours(`${hours}`)
            
            if (!isNaN(parsedDate.getTime())) {
                return parsedDate.toISOString()
            } else {
                return null;
            }
        }
    }

    async function requestGNLClanWarDataBlock(sheets, range) {
        var requestPlayers = await sheets.spreadsheets.values.get({
            
            spreadsheetId: SHEET_ID,
            range: range
        })

        return requestPlayers.data.values
    }

    function createClanWarStrings() {
        
        let clanWar = [] // matches are in blocks of 9 for each clan war, and have a header line

        for (let i=1; i<=WEEKS; i++) {
            for (let j=0; j<=2; j++) {
                clanWar.push(`Week ${i}!${CELL_RANGES[j]}`)
                // create 18 strings which correspond to the date and time cells for each match
            }
        }

        return clanWar
    }

    function escapeRegExp(string){
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
    }

    // ------------------
    // Function to add the initial batch of events to the calendar, only to be run once.
    // ------------------

        // async function createInitialEvents(matches, calendar) {
    //     let eventBatch = []

    //     for (matchup in matches) {
    //         // format each match to an event object that the google calendar accepts, then add to the batch

    //         let thisMatch = matches[matchup]

    //         if (thisMatch[0] === undefined) continue
            
    //         let end = new Date(thisMatch[0])
    //         end.setHours(end.getHours() + 1)

    //         var event = {
    //             'summary': `GNL Match - ${thisMatch[1]} vs ${thisMatch[2]}`,
    //             'location': 'Gym Discord',
    //             'description': 'A GNL Season 4 Match',
    //             'start': {
    //               'dateTime': `${thisMatch[0]}`
    //             },
    //             'end': {
    //               'dateTime': `${end.toISOString()}`
    //             },
    //         }
    //         eventBatch.push(event)
    //     }

    //     for (element in eventBatch) {
    //         // loop through the batch and push all events to the calendar
    //         createEventOnCalendar(eventBatch[element], calendar)
    //     }
    // }
}
