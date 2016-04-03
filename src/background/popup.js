var bgPage = chrome.extension.getBackgroundPage();

function setProxyIP() {
  // bgPage.console.log("setProxyIP called");
  var proxyIP = document.getElementById("proxyip").value;

  bgPage.console.log("Proxy IP: " + proxyIP);
  console.log("Proxy IP: " + proxyIP);
}

function requestStatus() {
    $.ajax({
        type:"GET",
        url: "http://10.8.220.169:8080/status", // "http://192.168.0.14:8080/status",
        crossDomain: true,
        success: function(resp) {
            bgPage.console.log("Status received...");
            walletStatus = resp;
            document.getElementById('status').textContent = walletStatus;
        },
        failure: function(err) {
            alert(err)
        }
    });
};

document.addEventListener('DOMContentLoaded', function () {
    document.getElementById("submit").addEventListener("click", setProxyIP());
    
    document.getElementById('status').textContent = "Requesting status...";
    requestStatus();
});