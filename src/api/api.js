// Generic API caller
export function callApi(reqmethod, url, data, responseHandler, token = null) {
    let headers = {
        "Content-Type": "application/json"
    };

    // Attach JWT if provided
    if (token) {
        headers["Authorization"] = "Bearer " + token;
    }

    let options = {
        method: reqmethod,
        headers: headers
    };

    if (reqmethod !== "GET" && reqmethod !== "DELETE") {
        options.body = JSON.stringify(data);   // 🔹 Changed
    }

    fetch(url, options)
        .then(async response => {
            const result = await response.json();  // 🔹 Changed
            responseHandler(result);
        })
        .catch(error => {
            console.error("Network error:", error);
            alert("Network error. Please try again.");
        });
}


// Set cookie/session
export function setSession(name, value, expDays) {
    let d = new Date();
    d.setTime(d.getTime() + expDays * 24 * 60 * 60 * 1000);

    document.cookie = `${name}=${value};expires=${d.toUTCString()};path=/`;
}


// Get cookie/session
export function getSession(name) {
    let decodedCookie = decodeURIComponent(document.cookie);
    let cookies = decodedCookie.split(';');

    name = name + "=";

    for (let i = 0; i < cookies.length; i++) {
        let c = cookies[i].trim();
        if (c.indexOf(name) === 0) {
            return c.substring(name.length, c.length);
        }
    }

    return "";
}
