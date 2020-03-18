let cityToForecast; // city that user requested or the the newest record in the history list
//set search history stored as an empty array if no search history is stored in client
let searchHistoryStored = JSON.parse(localStorage.getItem("searchHistoryStored")) || []; 
let clientlocationProtocal;
if (location.protocol === 'http:') {
    clientlocationProtocal = "http:"
} else {
    clientlocationProtocal = "https:"
}

function updatePage() {
    //render weather info if there is a previous search history or user entered a city
    if (searchHistoryStored.length > 0) {
        renderTodaysWeather();
        renderForecastedWeather();
        renderSearchHistory();
    }
}
updatePage();


//add action to search btn
document.querySelector("form .btn").addEventListener("click", function (event) {
    event.preventDefault();
    cityToForecast = this.previousElementSibling.value.toLowerCase()
    //check if the city entered is valid (further validation is needed)
    if (cityToForecast.length > 1) {
        //format the city name
        cityToForecast = cityToForecast.charAt(0).toUpperCase() + cityToForecast.substring(1);

        //add the city to the search history list
        updateSearchHistory();

        // update the page with the new forecast
        updatePage();

    }
})


//add action to search history list 
document.querySelector("#search-history-list").addEventListener("click", function (event) {
    let cityClicked = event.target.textContent;
    cityToForecast = cityClicked;
    //shift the city selected to the beginning of search history list
    updateSearchHistory();

    // update the page with the new forecast
    updatePage();
})


//add the city entered or clicked by user to the search history list if not included, shift to the beginning if already included
function updateSearchHistory() {
    if (searchHistoryStored.includes(cityToForecast)) {
        searchHistoryStored = searchHistoryStored.filter(function (city) {
            return city !== cityToForecast
        })
    }
    searchHistoryStored.unshift(cityToForecast);

    //update local storage search history
    localStorage.setItem("searchHistoryStored", JSON.stringify(searchHistoryStored));
}


//update the search history list in the left section
function renderSearchHistory() {
    let searchHistoryContainer = document.querySelector("#search-history-list");
    //clean up the list rendered before
    searchHistoryContainer.innerHTML = "";

    //restrict the list to only the 10 most recent cities searched
    let listLength = (searchHistoryStored.length < 10 ? searchHistoryStored.length : 10)

    //render the list
    for (let i = 0; i < listLength; i++) {
        let city = document.createElement("a");
        city.textContent = searchHistoryStored[i];
        city.className = "list-group-item list-group-item-action";
        searchHistoryContainer.appendChild(city);
    }
}


//render current weather in the right top section
function renderTodaysWeather() {
    //collect the city name from users or get the latest city searched 
    cityToForecast = cityToForecast || searchHistoryStored[0];

    //render the city's name and date 
    document.querySelector("#city-name").textContent = cityToForecast
    document.querySelector("#current-date").textContent = " (" + moment().format("L") + ") ";

    //get current weather from OpenWeather forecast API
    let todaysWeatherURL = clientlocationProtocal+ "//api.openweathermap.org/data/2.5/weather?q=" + cityToForecast + "&units=imperial&appid=ac5b144a5d66349f6a02d23d24193989";
    fetch(todaysWeatherURL)
        .then(function (response) {
            if (response.ok) {
                return response.json();
            } else {
                throw Error(response);
            }
        })
        .then(function (response) {
            updateSearchHistory();
            //render current weather info 
            let iconNumber = response.weather[0].icon
            document.querySelector("#current-weather-icon").src = clientlocationProtocal+"//openweathermap.org/img/wn/" + iconNumber + "@2x.png"
            document.querySelector("#temperature").textContent = response.main.temp + " °F";
            document.querySelector("#humidity").textContent = response.main.humidity + " %";
            document.querySelector("#wind-speed").textContent = response.wind.speed + " MPH";

            //use coordination from response in the UV index API url
            let cityLat = response.coord.lat;
            let cityLon = response.coord.lon;
            let UVindexURL = clientlocationProtocal+"//api.openweathermap.org/data/2.5/uvi?lat=" + cityLat + "&lon=" + cityLon + "&appid=ac5b144a5d66349f6a02d23d24193989";
            //get uv index from OpenWeather uv index API
            fetch(UVindexURL)
                .then(uvResponse => uvResponse.json())
                .then(function (uvResponse) {
                    let uvIndex = uvResponse.value;
                    let uvIndexContainer = document.querySelector("#uv-index")
                    uvIndexContainer.textContent = uvIndex;

                    //color code UV index container
                    if (uvIndex < 2) {
                        uvIndexContainer.className = "p-2 rounded bg-success"
                    } else if (uvIndex > 8) {
                        uvIndexContainer.className = "p-2 rounded bg-danger"
                    } else {
                        uvIndexContainer.className = "p-2 rounded bg-warning"
                    }
                })
        })
        .catch((error) => {
            //remove the invalid city name from local storage and re-render the search history list
            searchHistoryStored.shift();
            localStorage.setItem("searchHistoryStored", JSON.stringify(searchHistoryStored));
            renderSearchHistory();
            alert("The city name you entered is invalid. Please try again.");
        })
};


// render 5-days forecast in right bottom section
function renderForecastedWeather() {
    let forecastCards = document.querySelectorAll(".card-body")
    //get forecast info from OpenWeather forecast API
    let weatherForecastURL = clientlocationProtocal+"//api.openweathermap.org/data/2.5/forecast?q=" + cityToForecast + "&units=imperial&appid=ac5b144a5d66349f6a02d23d24193989";
    fetch(weatherForecastURL)
        .then(function (response) {
            if (response.ok) {
                return response.json();
            } else {
                throw Error(response);
            }
        })
        .then(function (response) {

            let dayInAdvance = 1;
            let weatherIndex = 0
            forecastCards.forEach(function (card) {
                //add days in advance to current date
                let date = moment().add(dayInAdvance, 'days').format("MM/D")
                card.children[0].textContent = date;
                //render forecast info
                let iconNumber = response.list[weatherIndex].weather[0].icon;
                card.children[1].src = clientlocationProtocal+"//openweathermap.org/img/wn/" + iconNumber + "@2x.png"
                card.children[2].textContent = "Temp: " + response.list[weatherIndex].main.temp + " °F";
                card.children[3].textContent = "Humidity: " + response.list[weatherIndex].main.humidity + " %";

                //API returns 40 forecast info, 3 hours for each day. render the weather of the same hour with current moment for each day
                //day in advance increase by 1, weather Index from response increase by 8 
                dayInAdvance++;
                weatherIndex += 8;
            })
        })
}