
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

# Time Server (an Observeris project)!
## Installing all the dependencies
You need both npm and bower.

```
$ npm install

$ bower install
```

Finally, to copy  `socket.io.js` from node_modules, (since `socket.io` bower does not contain `socket.io.js`) use:

```
$ gulp copy-js
```

## Running the project
1) Open `server.js` and start the app by clicking on the "Run" button in the top menu.

2) Alternatively you can launch the app from the Terminal:

```
$ node server.js
```

Once the server is running, open the project in the shape of '[https://projectname-username.c9.io/](https://projectname-username.c9.io/)'. As you enter your name, watch the Users list (on the left) update. Once you press Enter or Send, the message is shared with all connected clients.

## Project description
### Browser-server NTP synchronization
1) Synchronizer client side is implemented from scratch, referenced by the `socket-ntp/ntp.js`. All the implementation is  now encapsulated in `client/app/services/socket-ntp-sync.js`

2) Synchronizer server side is node-modules/socket-ntp, installed via "npm install socket-ntp"  ([https://github.com/calvinfo/socket-ntp](https://github.com/calvinfo/socket-ntp) ), see the package.json dependencies. All the implementation is in `server.js`

3) Both Client and Server need Socket.io ([http://socket.io/](http://socket.io/)) library installed.

### Server-NTP.ORG synchronization
Server-NTP.ORG synchronization is implemented in `timeServer.js`, powered by `ntp-client` NodeJS module: [https://github.com/moonpyk/node-ntp-client](https://github.com/moonpyk/node-ntp-client)

## Unit Testing
Starting to write unit tests based on this tutorial: [http://www.bradoncode.com/tutorials/angularjs-unit-testing/](http://www.bradoncode.com/tutorials/angularjs-unit-testing/)

# References
- Logo generated at [http://bigtext.org/](http://bigtext.org/)
