// server.js

// BASE SETUP
// ===================================================================

// call the packages we need
var express = require("express"),
  multer = require("multer"),
  bodyParser = require('body-parser'),
  fs = require("fs"),
  path = require("path");

// get port number and static files path from arguments of the command
var argv = process.argv.slice(2),
  host = argv[1] || "localhost",
  port = argv[2] || 9099,
  dirPath = argv[0];

// define mime types
var mimeTypes = {
  "json": "application/json",
  "txt": "text/plain",
  "xml": "application/xml",
  "jsonp": "application/javascript"
};

// define the server using express
var server = express();

console.log(dirPath);

// Multer is a node.js middleware for handling multipart/form-data.
server.use(multer({ dest: './uploads/'}).array());
server.use(bodyParser.urlencoded({ extended: false }))

// ROUTES FOR OUR API
//==================================================================
var router = express.Router();

router.use("/json", function(request, response){
  var filePath = path.join(dirPath, "json.json");
  var mimeType = mimeTypes["json"];
  sendResponse(request, response, filePath, mimeType);
});

router.use("/xml", function(request, response){
  var filePath = path.join(dirPath, "xml.xml");
  var mimeType = mimeTypes["xml"];
  sendResponse(request, response, filePath, mimeType);
});

router.use("/text", function(request, response){
  var filePath = path.join(dirPath, "text.txt");
  var mimeType = mimeTypes["txt"];
  sendResponse(request, response, filePath, mimeType);
});

router.use("/jsonp", function(request, response){
  var filePath = path.join(dirPath, "json.json");
  var mimeType = mimeTypes["jsonp"];
  var callbackName = request.query.callback;
  sendResponse(request, response, filePath, mimeType, callbackName);
});

router.post("/uploadForm", function(request, response){
  var data = request.body;
  var mimeType = mimeTypes["json"];

  // Set CORS headers
  response.setHeader('Access-Control-Allow-Origin', '*');

  //Set Cache Control
  response.setHeader('Cache-Control', 'max-age=0, must-revalidate');
  response.setHeader('Content-Type', mimeType);
  response.setHeader('Connection', 'close');

  response.json(data);
});

router.use("/stopServer", function(request, response){
  process.kill(process.pid);
  response.end();
});

// router is used to handle all the request with urls prefixed with /v1/api
server.use('/v1/api', router);

// ROUTES FOR OUR STANDALONE SERVER
//==================================================================
var standaloneRouter = express.Router();

standaloneRouter.use("/rest/info", function(request, response){
  // Set CORS headers
  response.setHeader('Access-Control-Allow-Origin', '*');
  response.setHeader('Access-Control-Allow-Credentials', true);

  //Set Cache Control
  response.setHeader('Cache-Control', 'max-age=0, must-revalidate');
  var data = {
    "currentVersion": 10.3,
    "fullVersion": "10.3.0",
    "soapUrl": "http://" + host + ":" + port + "/arcgis/services",
    "secureSoapUrl": "http://" + host + ":" + port + "/arcgis/services",
    "authInfo": {
      "isTokenBasedSecurity": true,
      "tokenServicesUrl": "http://" + host + ":" + port + "/arcgis/tokens/",
      "shortLivedTokenValidity": 60
    }
  };
  response.json(data);
});

standaloneRouter.use(["/tokens/", "/tokens/generateToken"], function(request, response){
  response.header("Access-Control-Allow-Origin", "*");
  var data = {};
  if(request.method === "POST"){
    data = {
      "token": "Uc-CSbig0sO-4BjvGUkaSVe_jUTORUKgXYY0bulMXZM.",
      "expires": Date.now() + Number(request.body.expiration || "3600000")
    };
    response.send(data);

  } else {
    data.error = {
      "code": 405,
      "message": "'" + request.method + "'" + " method not supported.",
      "details": []
    };
    response.status(405).send(data);
  }
});

standaloneRouter.get("/rest/services/SecureServer/FeatureServer/0/", function(request, response){
  response.header("Access-Control-Allow-Origin", "*");
  var data = {};
  var token = request.query.token;
  if(token){
    if(token === "Uc-CSbig0sO-4BjvGUkaSVe_jUTORUKgXYY0bulMXZM."){
      var filePath = path.join(dirPath, "json.json");
      var mimeType = mimeTypes["json"];
      sendResponse(request, response, filePath, mimeType);
    } else{
      data.error = {
        "code": 498,
        "message": "Invalid Token",
        "details": []
      };
      response.send(data);
    }
  } else{
    data.error = {
      "code": 499,
      "message": "Token Required",
      "details": []
    };
    response.send(data);
  }
});

// router is used to handle all the request with urls prefixed with /arcgis
server.use('/arcgis', standaloneRouter);

// function that sends the responses
var sendResponse = function(request, response, filePath, mimeType, callbackName){

  // Set CORS headers
  response.setHeader('Access-Control-Allow-Origin', '*');

  //Set Cache Control
  response.setHeader('Cache-Control', 'max-age=0, must-revalidate');

  fs.exists(filePath, function(exists){
    if(exists){
      var data = fs.readFileSync(filePath,'utf8');
      if(mimeType === "application/javascript" && callbackName){
        data = callbackName.concat("(", data, ")");
      }
      response.writeHead(200, {
        'Content-Type': mimeType,
        'Content-Length': data.length,
        'Connection': "close"
      });
      response.end(data);
    }
  });
};

server.listen(port);
console.log("server is listening at " + port + " ...");

//"SIGTERM" signal is invoked when the node server process is killed
process.on('SIGTERM', function () {
  process.exit(0);
});
