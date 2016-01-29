
     ,-----.,--.                  ,--. ,---.   ,--.,------.  ,------.
    '  .--./|  | ,---. ,--.,--. ,-|  || o   \  |  ||  .-.  \ |  .---'
    |  |    |  || .-. ||  ||  |' .-. |`..'  |  |  ||  |  \  :|  `--, 
    '  '--'\|  |' '-' ''  ''  '\ `-' | .'  /   |  ||  '--'  /|  `---.
     `-----'`--' `---'  `----'  `---'  `--'    `--'`-------' `------'
    ----------------------------------------------------------------- 


Welcome to your Node.js project on Cloud9 IDE!

This chat example showcases how to use `socket.io` with a static `express` server.

## Running the server

1) Open `server.js` and start the app by clicking on the "Run" button in the top menu.

2) Alternatively you can launch the app from the Terminal:

    $ node server.js

Once the server is running, open the project in the shape of 'https://projectname-username.c9.io/'. As you enter your name, watch the Users list (on the left) update. Once you press Enter or Send, the message is shared with all connected clients.

## Extra project on top of default chat client.

1) This is a testbed project for the synchronizer https://github.com/calvinfo/socket-ntp 

2) Synchronizer client side is client/js/ntp.js

Client pseudocode (see index.html, powered by socket.io)
 - Initialize synchronizer on launch then check every 3 seconds, output into tx-out div at HTML page.
 - timerTick checks the current offset value. At first the value will be NaN since no communications ran yet.

3)Synchronizer server side is node-modules/socket-ntp, installed via "npm install socket-ntp"

Server pseudocode is (see server.js)

 - set up a callback: on an incoming socket, do ntp.sync(socket);