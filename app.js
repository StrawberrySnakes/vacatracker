//Create constants for the form and form controls
const newVacationFormEl = document.getElementsByTagName("form")[0];
const startDateInputEl = document.getElementById("start-date");
const endDateInputEl = document.getElementById("end-date");
const pastVacationContainer = document.getElementById("past-vacations");

// listen to the form submissions 
newVacationFormEl.addEventListener("submit", (event)=>{
    // prevent the form from submitting to the server
    //since we're doing everything on the client side
    event.preventDefault();

    //get dates from form
    const startDate = startDateInputEl.value;
    const endDate = endDateInputEl.value;

    // check if the dates are invalid 
    if(checkDatesInvalid(startDate, endDate)) {
        return; //don't submit the form, just exit
    }

    //store the new vacation in our client side storage 
    storeNewVacation(startDate, endDate);

    //refresh the UI
    renderPastVacations();

    //reset the form
    newVacationFormEl.reset(); 
});

function checkDatesInvalid(startDate, endDate) {
    if (!startDate || !endDate || startDate>endDate) {
        // we're just gonna clear form normally you would add error message
        newVacationFormEl.reset();

        return true; //invalid
    } else {
        return false; //valid
    }
}

const STORAGE_KEY = "vaca-tracker";
function storeNewVacation(startDate, endDate) {
    // get data from storage 
    // const vacations = getAllStoredVacations(); //returns an array of objects

    vacations.push({startDate, endDate});

    //sort the array so newest to oldest 
    vacations.sort((a, b)=> {
        return new Date(b.startDate - new Date(a.startDate));
    });

    //store the new array back in storage
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(vacations));

} //storeNewVacation

function getAllStoredVacations() {
    //get the string of vacation from localStorage
    const data = window.localStorage.getItem(STORAGE_KEY);

    //if no vatactions stored, default to an empty array
    //otherwise return stored data (JSON string) as parsed JSON

    // ? works like an if then else, but it returns a value ? -- like a then --> leads to return the parse. the : looks like an else 
    // let vacations = [];
    // if (data) {
    //     vacations = JSON.parse(data);
    // } else {
    //     vacations = [];
    // } -- this is what that line is doing
    const vacations = data ? JSON.parse(data) : [];
    return vacations;
} //get all stored values

function renderPastVacations() {
    //get the parsed string of vacations or an empty array in there aren't any
    const vacations = getAllStoredVacations();

    // exit is there are no vacations 
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
        vacationEl.textContent = `From ${formatDate(vacation.startDate)}
         to ${formatDate(vacation.endDate)}`;
        pastVacationList.appendChild(vacationEl);
    });

    pastVacationContainer.appendChild(pastVacationHeader);
    pastVacationContainer.appendChild(pastVacationList);

} // renderPast acations

function formatDate(dataString) {
    //convert the date string to a Date object 
    const date = new Date(dataString);

    // format date into local specific string
    //include your local for a better user experience 
    return date.toLocaleDateString("en-US", {timeZone: "UTC"});

}//formatDate

//start the app by rendering the past vactaions on load, if any
renderPastVacations();
