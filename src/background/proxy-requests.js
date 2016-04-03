function requestStatus() {
    $.ajax({
        type:"GET",
        url: "https://10.8.220.169:8080/status",
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