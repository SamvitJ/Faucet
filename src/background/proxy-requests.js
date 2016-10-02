var paymentModuleIP = "http://10.8.125.119:8080"

function requestStatus() {
    $.ajax({
        type:"GET",
        url: paymentModuleIP + "/status",
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
