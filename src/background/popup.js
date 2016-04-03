var bgPage = chrome.extension.getBackgroundPage();

document.addEventListener('DOMContentLoaded', function () {
    document.getElementById('status').textContent = "Requesting status...";
    $.getScript('/src/background/proxy-requests.js', function () {
        requestStatus();
    });
});