
```
                                                                                                            
_|_|_|_|_|  _|                                  _|_|_|                                                      
    _|          _|_|_|  _|_|      _|_|        _|          _|_|    _|  _|_|  _|      _|    _|_|    _|  _|_|  
    _|      _|  _|    _|    _|  _|_|_|_|        _|_|    _|_|_|_|  _|_|      _|      _|  _|_|_|_|  _|_|      
    _|      _|  _|    _|    _|  _|                  _|  _|        _|          _|  _|    _|        _|        
    _|      _|  _|    _|    _|    _|_|_|      _|_|_|      _|_|_|  _|            _|        _|_|_|  _|    
    
    
____ _  _    ____ ___  ____ ____ ____ _  _ ____ ____ _ ____    ___  ____ ____  _ ____ ____ ___ 
|__| |\ |    |  | |__] [__  |___ |__/ |  | |___ |__/ | [__     |__] |__/ |  |  | |___ |     |  
|  | | \|    |__| |__] ___] |___ |  \  \/  |___ |  \ | ___]    |    |  \ |__| _| |___ |___  |  
    
```    


Welcome to Time Server (an Observeris project)!


## Installing all the dependencies
You need both npm and bower 
    

    $ npm install

    $ bower install 

Finally to copy ntp.js from node_modules, since it doesn't have its own bower package, use: 

    $ gulp copy-ntpjs

## Running the server

1) Open `server.js` and start the app by clicking on the "Run" button in the top menu.

2) Alternatively you can launch the app from the Terminal:

    $ node server.js

Once the server is running, open the project in the shape of 'https://projectname-username.c9.io/'. As you enter your name, watch the Users list (on the left) update. Once you press Enter or Send, the message is shared with all connected clients.

## Project on top of default chat client.

1) This is a testbed project for the synchronizer https://github.com/calvinfo/socket-ntp 

2) Synchronizer client side is bower_components/socket-ntp/ntp.js

Client pseudocode (see index.html, powered by socket.io)
 - Initialize synchronizer on launch then check every 3 seconds, output into tx-out div at HTML page.
 - timerTick checks the current offset value. At first the value will be NaN since no communications ran yet.

3)Synchronizer server side is node-modules/socket-ntp, installed via "npm install socket-ntp"

Server pseudocode is (see server.js)

 - set up a callback: on an incoming socket, do ntp.sync(socket);

#NOTES

1) Both Client and Server need Socket.io library. The package.json and bower.json should have all the necessary dependencies in.

#References

   * Logo generated at http://bigtext.org/