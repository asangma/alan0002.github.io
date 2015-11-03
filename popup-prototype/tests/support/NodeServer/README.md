# NodeServer

It can be used to serve content from static files from a given directory and it works for both GET and POST requests.

### Getting Started

You can start this node server from grunt in the `startNodeServer` task:

```

    grunt.registerTask('startNodeServer', 'Runs Node Server', function() {
        var done = this.async();        
        var nodeUrl = properties.nodeServer;
        var host = nodeUrl.split(":")[1].split("//")[1];
        var port = nodeUrl.split(":")[2];    
        var options = {
          // The command to execute. It should be in the system path.
          cmd: "node",
          // An array of arguments to pass to the command.
          args: ["./tests/support/NodeServer/server.js", "./tests/support/mocking/Samples/", host, port]
        };    
        function doneFunction(error, result, code) {
          console.log(result);
          done();
        }    
        grunt.util.spawn(options, doneFunction);    
      });
      
```

You must specify static files directory in the 2nd index and the hostname and port are retrieved from the `grunt-config.json` file and placed in the 3rd and 4th index of the args array of options object which is used by `grunt.util.spawn` to start the node server. If you don't specify the hostname and port, localhost and 9099 will be taken by default.

Now you can retrieve the content from the static files by calling the url: `http://hostname.esri.com:9099/v1/api/json`. This means, it gets the content from the file `tests/support/mocking/Samples/json.json`. You can change the base or the port where node server runs, in the grunt.js file.

```
http://mbalumuri.esri.com:9099/v1/api/json

Response Headers:
Access-Control-Allow-Origin:*
Cache-Control:max-age=0, must-revalidate
Connection:close
Content-Length:93
Content-Type:application/json
Date:Tue, 02 Jun 2015 21:07:22 GMT
```

### JSONP

For jsonp, make sure you give the json file name with the extension '.jsonp'. It converts the file extension to '.json' reads the data from the file and returns it in jsonp format.

#### Example

```
http://mbalumuri.esri.com:9099/v1/api/jsonp?callback=dojo.io.script._jsonpCallback

Response Headers:
Access-Control-Allow-Origin:*
Cache-Control:max-age=0, must-revalidate
Connection:close
Content-Length:124
Content-Type:application/javascript
Date:Tue, 02 Jun 2015 21:07:53 GMT
```

Note: For jsonp requests, callback parameter is always required.