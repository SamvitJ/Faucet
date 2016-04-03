function requestStatus() {
    $.ajax({
        type:"GET",
        url: "http://10.8.220.169:8080/status", // "https://192.168.0.14:8080/status",
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