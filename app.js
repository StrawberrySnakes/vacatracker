//Create constants for the form and form controls
const newVacationFormEl = document.getElementsByTagName("form")[0];
const startDateInputEl = document.getElementById("start-date");
const endDateInputEl = document.getElementById("end-date");
const pastVacationContainer = document.getElementById("past-vacations");

// listen to the form submissions 
newVacationFormEl.addEventListener("submit", (event)=> {
    // prevent the form from submitting to the server since we're doing everything on the client side
    event.preventDefault();

    //get dates from form
    const startDate = startDateInputEl.value;
    const endDate = endDateInputEl.value;

    // check if the dates are invalid 
    if (checkDatesInvalid(startDate, endDate)) {
        return; //don't submit the form, just exit
    }

    //store the new vacation in our client-side storage 
    storeNewVacation(startDate, endDate);

    //refresh the UI
    renderPastVacations();

    //reset the form
    newVacationFormEl.reset(); 
});

function checkDatesInvalid(startDate, endDate) {
    if (!startDate || !endDate || startDate > endDate) {
        // we're just going to clear the form, normally you would add an error message
        newVacationFormEl.reset();
        return true; //invalid
    } else {
        return false; //valid
    }
}

const STORAGE_KEY = "vaca-tracker";
function storeNewVacation(startDate, endDate) {
    // get existing vacations from storage
    const vacations = getAllStoredVacations(); //returns an array of objects

    vacations.push({startDate, endDate});

    //sort the array so newest to oldest 
    vacations.sort((a, b) => {
        return new Date(b.startDate) - new Date(a.startDate); // Correct date comparison
    });

    //store the new array back in storage
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(vacations));
}

function getAllStoredVacations() {
    //get the string of vacation from localStorage
    const data = window.localStorage.getItem(STORAGE_KEY);

    //if no vacations stored, default to an empty array
    const vacations = data ? JSON.parse(data) : [];
    return vacations;
}

function renderPastVacations() {
    //get the parsed string of vacations or an empty array if there aren't any
    const vacations = getAllStoredVacations();

    // exit if there are no vacations 
    if (vacations.length === 0) {
        return;
    }
    //clear list of past vacations since we're going to re-render it 
    pastVacationContainer.innerHTML = "";
    const pastVacationHeader = document.createElement("h2");
    pastVacationHeader.textContent = "Past Vacations";

    const pastVacationList = document.createElement("ul");

    //loop over all vacations and render them
    vacations.forEach((vacation) => {
        const vacationEl = document.createElement("li");
        vacationEl.textContent = `From ${formatDate(vacation.startDate)} to ${formatDate(vacation.endDate)}`;
        pastVacationList.appendChild(vacationEl);
    });

    pastVacationContainer.appendChild(pastVacationHeader);
    pastVacationContainer.appendChild(pastVacationList);
}

function formatDate(dataString) {
    //convert the date string to a Date object 
    const date = new Date(dataString);

    // format date into locale-specific string
    return date.toLocaleDateString("en-US", { timeZone: "UTC" });
}

//start the app by rendering the past vacations on load, if any
renderPastVacations();

//register the service worker 
if ("serviceworker" in navigator) {
    navigator.serviceWorker.register("sw.js")
    .then((registration) => {
        console.log("Service worker registered with scope:", registration.scope);
    })
    .catch((error) => {
        console.log("Service worker registration failed:", error);
    });
}

//listen for message from the service wokrer
navigator.serviceWorker.addEventListener("message", (event)=>{
    console.log("Received a message for service worker:",event.data);

    if(event.data.type === "update") {
        console.log("Update received:",event.data.data);
        //update your UI or perform some action
    }
});


//function to send message to service worker
// function sendMessageToSW(message) {
//     if(navigator.serviceWorker.controller) {
//         navigator.serviceWorker.controller.postMessage(message);
//     }
// }

document.getElementById("sendButton").addEventListener("click", () => {
    sendMessageToSW({type: "action", data: "Button clicked"});
});

//create a broadcast channel - name here needs to match the name in the sw
const channel = new BroadcastChannel("pwa_channel");

//listen for messages
channel.onmessage = (event) => {
    console.log("Received a massage in PWA:",event.data);
    document.getElementById('messages').insertAdjacentHTML("beforeend", `<p>Received: ${event.data}</p>`)
};

//send a message when the button is clicked
document.getElementById("sendButton").addEventListener("click", () => {
    const message = "Hello from PWA!";
    channel.postMessage(message);
    console.log("Sent message from PWA: ", message);
});

//open or create the database
let db;
const dbName = "SyncDatabase";
const request = indexedDB.open(dbName, 1);

request.onerror = function(event) {
    console.error("Database error"+event.target.error)
    
}

request.onsuccess = function (event) {
    db = event.target.result;
    console.log("Database opened successfully")
};

request.onupgradeneeded = function(event) {
    db = event.target.result;

    //create any new object stores for our db or delete any old ones from a previous version

    const objectSore = db.createObjectStore(
        "pendingData", {
            keyPath : "id",
            autoIncrement: true
        }
    );

};

//add data to our db, we need a transaction to accomplish it
function addDataToIndexDB(data) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(["pendingData"], "readwrite");
        const objectStore = objectStore("pendingData");
        const request = objectStore.add({data:data});

        request.onsuccess = function (event) {
            resolve();
        };
        request.onerror = function(event) {
            reject("Error storing data "+ error.target.error);
        };
    });//promise
}

document.getElementById("dataForm").addEventListener("submit", function(event) {
    event.preventDefault(); //dont sent to server now

    //get our data
    const data = document.getElementById("dataInput").value;

    //we need to check to see if both the service worker and the syncManger available
    if("serviceWorker" in navigator && "SyncManager" in window) {
        //were good to add the data to the database for offline persistance
        addDataToIndexDB(data)
        .then(() => navigator.serviceWorker.ready) //wait fo the sw to be ready
        .then((registration) => {
            //registers a sync event for when the device comes online
            return registration.sync.register("send-data");
        })

        .then(() => {
            //update the UI for successful registrations
            document.getElementById("status").textContent = "Sync registered. Data will be sent when offline.";
        })
        .catch ((error)=>{
            console.error("Error: ", error)
        });

    } else {
        sendData(data).then((result) => {
            //update UI
            document.getElementById("status").textContent = result;
        })
        .catch ((error)=>{
            document.getElementById("status").textContent = error.message;
        });
    }
}); //event listener

//simulate 
function sendData(data) {
    console.log("Attempting to send data: " + data);

    return new Promise((resolve, reject) => {
        setTimeout(() => {
            if(Math.random() > 0.5) {
                resolve("Data sent successfully");
            } else {
                reject(new Error("Failed to send data"))
            }
        }, 1000);
    })
}