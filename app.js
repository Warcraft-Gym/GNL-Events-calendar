// Main application logic

const chrono = require('chrono-node')

var daylightSavings = true
const CALENDAR_ID = 'cepheidgaming@gmail.com'

module.exports.run = async function(sheets, calendar) {
    
    // get all the spreadsheet matches in format [datetime, player1, player2]
    let spreadsheetMatches = await getAllSpreadsheetMatches(sheets, createClanWarStrings())

    // get all the existing events on the calendar
    let allEvents = await getEvents(calendar)

    if (allEvents.length === 0) {
        console.log("No events were retrieved")
        //return
    }

    // first time use to add starting data to the calendar
    // DONT UNCOMMENT THIS UNLESS YOU ARE ERASING THE ENTIRE CALENDAR
    //await createInitialEvents(spreadsheetMatches, calendar)

    // checks all the existing events on the calendar against the spreadsheet, and updates the time.
    // (does not support changing the player)
    await updateMatchesByPlayers(spreadsheetMatches, allEvents)

    // check for events that the calendar does not have, and add the new ones
    await addNewEvents(spreadsheetMatches, calendar)


    //
    // ------------- FUNCTIONS -------------
    //

    /**
 * @param matches Matches in the format ['Iso string of datetime', 'player 1', 'player 2']
 * @param events All events from a google calendar as received by the Google Api (i.e. results.data.items)
 */

    async function addNewEvents(matches, calendar) {

        // matches comes in with all matches, some have times, some do not.

        let events = await getEvents(calendar)

        for (var i = matches.length; i>=0; i--) {
           let thisMatch = matches[i]

           if (!thisMatch) {
               //matches.splice(i, 1)
               continue
           }

           for (element in events) {
               let thisEvent = events[element]

               let regex = new RegExp(`${escapeRegExp(thisMatch[1])}|${escapeRegExp(thisMatch[2])}`,'g')
               
               let regexResult = thisEvent.summary.match(regex)

               // if there is already a match between these two players, remove them from the array of matches
               if (regexResult && regexResult.length === 2) {
                   matches.splice(i, 1)
               }
           }         
        }

        if (!matches[0]) {
            console.log("All events already up to date")
            return
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

            

            await sleep(500)
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
            console.log('Event updated');
        });

        return updatedEvent
    }

    async function getAllSpreadsheetMatches(sheets, cellRangesForMatches) {

        let allSpreadsheetMatches = []

        for (element in cellRangesForMatches) {
            let clanWar = await requestClanWar(sheets, cellRangesForMatches[element])
            for (element in clanWar) {
                if (clanWar[element] != undefined) {
                    // 1. convert date and time to iso format
                    // 2. create a new array with: [datetime of start, player1, player2]
                    // 3. push this array to "allSpreadsheetMatches"

                    let match = []

                    match.push(convertToIso(clanWar[element]))
                    match.push(clanWar[element][2])
                    match.push(clanWar[element][5])

                    if (match[0]) {
                        allSpreadsheetMatches.push(match)
                    }
                }
            }
        }

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

    function convertToIso(match) {

        let timezone
        if (daylightSavings) {
            timezone = "-04:00"
        } else {
            timezone = "-05:00"
        }
        
        if (match[0] != '' && match[1] != '') {
            // converts the data to a standard accepted by google calendar

            // create a new date object based on the date in the match field (thanks chrono)
            let parsedDate = new Date (chrono.parseDate(`${match[1]}`))
            // change the hours to the UTC time of the match (+4 hours thanks to EDT)
            let hours = parseInt(match[0].match(/\d{1,2}/)) + 4
            parsedDate.setUTCHours(`${hours}`)

            return parsedDate.toISOString()
        } else {
            return
        }
        
    }

    async function requestClanWar(sheets, range) {
        var requestPlayers = await sheets.spreadsheets.values.get({
            
            // GNL id: 1X3pV8NHzimYPmn99mgwFap8Y01j8hH5l9s2gtvUjt3g
            // test id: 1XX3EvIFvZ2irNI74ne1CKP4ONT49ZjiVHof3NAS9JTk
            
            spreadsheetId: '1X3pV8NHzimYPmn99mgwFap8Y01j8hH5l9s2gtvUjt3g',
            range: range
        })

        return requestPlayers.data.values
    }

    function createClanWarStrings() {
        let clanWar = []

        // matches are in blocks of 7 for each clan war.

        let cellRanges = [`D6:I12`,`D16:I22`,`D26:I32`]

        for (let i=1; i<=5; i++) {
            for (let j=0; j<=2; j++) {
                clanWar.push(`Week ${i}!${cellRanges[j]}`)
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