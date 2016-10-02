Overview
-----------------

Faucet is a Chrome extension that allows a user to pay websites for access to pages or resources in Bitcoin.  

The project builds on the functionality provided by [Requestly](https://github.com/requestly/requestly-browser-extension), an extension that enables users to read and modify the headers of HTTP requests and responses in their browser.  


Setup
-----------------
- Run `git clone https://github.com/SamvitJ/Faucet`
- Navigate to the files [background.js](https://github.com/SamvitJ/Faucet/blob/master/src/background/background.js#L17) and [proxy-requests.js](https://github.com/SamvitJ/Faucet/blob/master/src/background/proxy-requests.js#L1) and replace the default IP addresses with the IP address of your running [client payment module](https://github.com/SamvitJ/21BC-client) instance
- Go to chrome://extensions/ in your Chrome browser
- Select the "Developer Mode" checkbox on the top right of the page
- Click on "Load unpacked extension" in the top left, and select the cloned source directory


Use
-----------------
- Visit any webpage that implements the [HTTP 402 Protocol](https://21.co/learn/21-lib-bitrequests/#the-21-bitrequests-library). You can try going to the [sample webpage](http://www.micropayments.tech) associated with this project, or set up your own [monetized webpage](https://github.com/SamvitJ/micropayments-webpage).


More information
-----------------
- See the [parent repository](https://github.com/SamvitJ/Bitcoin-micropayments) of this project.

