
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

### Global tools installation

You need to have these globally installed:
* `NodeJS` (https://nodejs.org/en/, version >= 4.3.1)
* `npm` (by default is installed with Node, but use the script below to update to latest, to make sure version >= 3.7.5)
* `bower` (version >= 3.9.1)
* `gulp` (version >= 1.7.7)

```
$ sudo npm install npm@latest -g
$ sudo npm install -g gulp
$ sudo npm install -g bower
```

### Local dependencies installation

Run `npm install` to pull all the dependencies (both server-side and client-side with `bower`), and to run the ES6 -> JS Babel transcoding.

```
$ npm install

```

## Running the server
1) Open `server.js` and start the app by clicking on the "Run" button in the top menu.

2) Alternatively you can launch the app from the Terminal:

```
$ node server.js
```

## Transcoding the client
Client is written in ES6, so to properly run it in any server, it needs to be transcoded via `Babel`.
We have a gulp default task to do that, including watch and transcode, simply start this in a separate terminal:

```
$ gulp
```
> NOTE: transcoded sources are placed in `client/app/` folder, from where its read by both client and unit test HTMLs. That folder is not part of git repo, and is going to be ignored by git, but the `npm install` step should run the transcoding

## Unit Testing

Open `client/unit_test.html` in a local browser to run a Jasmine unit test suite.


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
