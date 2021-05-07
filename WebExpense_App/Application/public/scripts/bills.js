let dates = [];
let start;
let end;

// Filter
function filter(event) {
    var dateFrom = Number(document.getElementById("date-from").value);
    var dateTo = Number(document.getElementById("date-to").value);
    var amountFrom = Number(document.getElementById("amount-from").value);
    var amountTo = Number(document.getElementById("amount-to").value);
    var dateGood = false;
    var amountGood = false;
    url = "/bills?"
    if (!dateFrom) {
        dateFrom = 1;
    } if (!dateTo) {
        dateTo = 31;
    }
    if (dateFrom && dateTo) {
        if (dateFrom < 0 || dateTo < 0) {
            alert('Date cannot be less than 0!');
        } else if (dateFrom > 31 || dateTo > 31) {
            alert('Date cannot be greater than 31!');
        } else if (dateFrom > dateTo) {
            console.log("Date from: " + dateFrom);
            console.log("Date to: " + dateTo);
            alert("End amount must be greater than start amount!");
        } else {
            url += "dateFrom=" + dateFrom + "&dateTo=" + dateTo + "&";
            dateGood = true;
        }
    } else {
        dateGood = true;
    }
    if (!amountFrom) {
        amountFrom = 0.00;
    } if (!amountTo) {
        amountTo = 999999999999;
    }
    if (amountFrom < 0 || amountTo < 0) {
        alert('Amount cannot be less than 0!');
    } else if (amountFrom > amountTo) {
        alert("Maxiumum amount must be greater than minimum amount!");
    } else {
        url += "amountFrom=" + amountFrom + "&amountTo=" + amountTo + "&";
        amountGood = true;
    }
    
    console.log("From: " + amountFrom);
    console.log("To: " + amountTo);
    url = url.substr(0, url.length - 1);
    if (dateGood && amountGood) {
        window.location.replace(url);
    }
}

// Sort - all done
function sort(field) {
    var params = new URLSearchParams(window.location.search)
    var psort = params.get("sort");
    var start = params.get("startDate");
    var end = params.get("endDate");
    var lo = params.get("amountFrom")
    var hi = params.get("amountTo")
    var url = "/bills?";
    if (start && end) {
        url += "startDate=" + start + "&endDate=" + end + "&";
    }
    if (lo && hi) {
        url += "amountFrom=" + lo + "&amountTo=" + hi + "&";
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