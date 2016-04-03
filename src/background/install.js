var bgPage = chrome.extension.getBackgroundPage();

function setProxyIP() {
  // bgPage.console.log("setProxyIP called");
  var proxyIP = document.getElementById("proxyip").value;

  bgPage.console.log("Proxy IP: " + proxyIP);
  console.log("Proxy IP: " + proxyIP);
}

document.addEventListener('DOMContentLoaded', function () {
    document.getElementById("form").addEventListener("submit", setProxyIP());
    
    document.getElementById('status').textContent = "Requesting status...";
    $.getScript('/src/background/proxy-requests.js', function () {
        requestStatus();
    });
});