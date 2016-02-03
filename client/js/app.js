(function(){

var app = angular.module('timesync', []);


    app.controller("TimeSyncController", ['$http', function($http) {
    
    //Dependency injection: we need an $http service!
    
           var gemsPromise = $http({method: 'GET', url: '/doSynchronize.json'});
    //Using Angular $http service to make async request to the server.
    
    //Other way would be:
    //var gemsPromise = $http.get('/products.json', {apiKey: 'myApiKey'});
    
    //BOTH return a promise object
    
    //Since we told $http to fetch JSON, the result will be automatically decoded into 
    //Javascript objects and arrays
    
        var TC = this; //Extra variable so we can refer to store from the callback.
    
        TC.data = []; //We need to initialize before request so page has something to show while loading.
        TC.fTitle = "UberTimeSync";
        gemsPromise.then(function(response)
            {
            TC.data = response.data;
            }, 
        function(response) {
    var data = response.data,
        status = response.status,
        header = response.header,
        config = response.config;
    // error handler
        alert("JSON Fetch Error!");
        });

       
    }]);
})();
    