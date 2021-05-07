/******************************************************************************
***
* BTI425 – Assignment 1
* I declare that this assignment is my own work in accordance with Seneca Academic Policy.
* No part of this assignment has been copied manually or electronically from any other source
* (including web sites) or distributed to other students.
*
* Name: Min Hee Kang  Student ID: 160822815 Date: February 3rd, 2021
*
*
******************************************************************************
**/

// creates pagination 
function paginate(){
    
    var pageSize = 3;
    var len = $(".item").length;
    console.log(len);
    var pageCount = Math.ceil($(".item").length / pageSize);
    console.log("Pagecount " + pageCount);
    var htmlString ="";
    for(var i = 0; i < pageCount; i++){
        htmlString +=('<li><a href="#">'+(i+1)+'</a></li>');

    }
    console.log(htmlString);
    $("#pagin").html(htmlString);
    
    $("#pagin li").first().find("a").addClass("current");
    showPage = function(page){
        $(".item").hide();
        $(".item").each(function(n){
            if(n>=pageSize * (page - 1) && n < pageSize * page)
                $(this).show();
        });
    }
    showPage(1);

    $("#pagin li a").click(function(){
        $("pagin li a").removeClass("current");
        $(this).addClass("current");
        showPage(parseInt($(this).text()));
    });
    

}


// convert Unix time to Time string
function changeTime(unix){
    var date = new Date(unix * 1000);
    var timestr = date.toLocaleTimeString();
    console.log(date, timestr);
    return timestr;
}

function findWeather(Data, cityName, countryCode=""){
       
    console.log(cityName);
    console.log(countryCode);

    var myObj = JSON.parse(Data.responseText);

    //console.log(myObj[0].name);]
    console.log(myObj.length);

    var cityIdList = [];

    // find City ID 
    for(var i = 0; i < myObj.length; i++){
        if(cityName == myObj[i].name){
            if(countryCode != ""){
                console.log(countryCode);
                if(countryCode.trim() == myObj[i].country){
                    cityIdList.push(myObj[i].id);
                }
            }
            else{
                cityIdList.push(myObj[i].id);
            }

        }
    }

    console.log(cityIdList);

    //change the id list to search string
    var idString = "";
    for (var i = 0; i < cityIdList.length; i++){
        idString += cityIdList[i];
        if(i < cityIdList.length - 1)
            idString += ",";
    }

    console.log(idString);


    
    // extract JSON from openweatherapp API 
    $.ajax({
        type: "GET",
        url: "http://api.openweathermap.org/data/2.5/group?id="+idString+"&appid=947342898f8e6041e76203e485728246",
        dataType: "json",
        success: function(data){
            console.log(data.list[0]);
            console.log(data.list[0].sys.country);
            console.log(data.cnt);

            // divide to pages
            // css
            
            var cFlag = "";
            const htmlString = data.list.map(function(city){

                return `
                <li class="item"> 
                    <h4>${city.name}, ${city.sys.country}  <img class="${city.sys.country}">  <em>${city.weather[0].description}</em></h4>
                    <p><b>${(city.main.temp - 273.15).toFixed(1)}°С</b> temperature from ${(city.main.temp_min - 273.15).toFixed(1)} to ${(city.main.temp_max - 273.15).toFixed(1)}°С</p>
                    <p>wind: ${city.wind.speed}m/s  pressure: ${city.main.pressure} hpa  humidity: ${city.main.humidity}%</p>
                    <p>sunrise ${changeTime(city.sys.sunrise)},    sunset ${changeTime(city.sys.sunset)}</p>

                </li>`;
                
               
            })
            .join('');
         
            console.log(htmlString);
            $("#resultsList").html(htmlString);

            for(var i = 0; i < data.cnt; i++){
                var country = data.list[i].sys.country;
                console.log(country);
                $.ajax({
                    type: "GET",
                    url: "http://restcountries.eu/rest/v2/alpha/" + country,
                    dataType: "json",
                    success: function(flagData){
                        cFlag = flagData.flag;
                        console.log(cFlag);
                        
                        
                       
                        console.log(flagData.alpha2Code);
                        var classString = "." + flagData.alpha2Code;
                        console.log(  classString);
                        $(classString).attr("src", cFlag);
                        $(classString).width(30.875);
                        $(classString).height(16.25);

                        paginate();
        

            
                    
                    },
                    error: function(){alert("cannot find flag")}
                });
            }

        },
        error: function(){ alert('The city cannot be found!')},
            
    });

  


}

$(document).ready(function(){
    
    // search button click event handler
    $("#search").click(function(){
        var searchString = $("#searchWords").val();
        var splitString = searchString.split(",", 2);
        var cName = splitString[0];
        var cCode = splitString[1];
        console.log(cName);
        console.log(cCode);

        
        xmlhttp = new XMLHttpRequest();
        xmlhttp.onreadystatechange = function() {

            if (this.readyState == 4 && this.status == 200){
                findWeather(this, cName, cCode);
            }

            
        }
        xmlhttp.open("GET", "city.list.json", true);
        xmlhttp.send();

    });

    //event handler for enter key
    $("#searchWords").keypress(function(event){
        console.log("input");
        // enter key pressed
        if(event.which === 13){

            //prevent the form from actually submitting
            event.preventDefault();

            console.log("enter key pressed");
            //trgger search event
            $("#search").click();
        }
    });
});