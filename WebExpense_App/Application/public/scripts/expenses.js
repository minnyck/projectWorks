let dates = [];
let start;
let end;

// Filter
function filter(event) {
    months = {
    "January": "01",
    "February": "02",
    "March": "03",
    "April": "04",
    "May": "05",
    "June": "06",
    "July": "07",
    "August": "08",
    "September": "09",
    "October": "10",
    "November": "11",
    "December": "12"
    }
    var month = months[String(document.getElementById("month").value)];
    var year = String(document.getElementById("year").value);
    var from = String(document.getElementById("from").value);
    var to = String(document.getElementById("to").value);
    var start;
    var end;
    if (from && to) {
        if (from > to) {
            start = to;
            end = from;
        } else {
            start = from;
            end = to;
        }
    } else {
        start = year + "-";
        end = year + "-";
        if (month) {
            start += month + "-01";
            end += month + "-31";
        } else {
            start += "01-01";
            end += "12-31";
        }
    }
    url = "/expenses?startDate=" + start + "&endDate=" + end;
    window.location.replace(url);
}

// Sort - all done
function sort(field) {
    var params = new URLSearchParams(window.location.search)
    var psort = params.get("sort");
    var start = params.get("startDate");
    var end = params.get("endDate");
    var url = "/expenses?";
    if (start && end) {
        url += "startDate=" + start + "&endDate=" + end + "&";
    }
    url += "sort=";
    if (psort) {
        var split = psort.split(",");
        if (split[0] != field) {
            url += field + ",d";
        } else {
            if (split[1] == "d") {
                url += field + ",a"
            }
        }
    } else {
        url += field + ",d";
    }
    window.location.replace(url);
}

// Initialize
function init() {
    // Sort the sorted field
    var params = new URLSearchParams(window.location.search);
    if (params.has("sort")) {
        var sort = params.get("sort");
        var field = sort.split(",")[0]
        Array.from(document.getElementsByClassName("td-" + field)).forEach((element, index, array) => {
            element.className = "td-sorted";
        });
    }    
}