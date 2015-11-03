/*
  esri/widgets/analysis/AnalysisBase
  Analysis Base has the execution logic for analysis widgets
  1. Authenticate user 
  2. create service
  3. submit job 
  4. updates item
  5. get Result
  publish events during the analysis workflows
*/
define(
 [
  "require",
  "../../core/declare",
  "dojo/_base/lang",
  "dojo/_base/array",
  "dojo/has",
  "dojo/Deferred",
  "dojo/promise/all",
  "dojo/when",
  "dojo/data/ItemFileWriteStore",
  "dojo/string",
  "dojo/Evented",
  "dojo/_base/kernel",
  "dojo/Stateful", 
  "../../kernel",
  "../../core/lang",
  "../../request",
  "../../tasks/Geoprocessor",
  "dojo/i18n!../../nls/jsapi",
  "./utils",
  "../../identity/IdentityManager"
], function(require, declare, lang, array, has, Deferred, all, when, ItemFileWriteStore, string, Evented, dojoNS, Stateful, esriKernel, esriLang, esriRequest, Geoprocessor, jsapiBundle, AnalysisUtils) {
  
  var AnalysisBase = declare([Stateful, Evented], {
    declaredClass: "esri.widgets.analysis.AnalysisBase",
    
    isOutputLayerItemUpdated: false,
    analysisGpServer: null,
    toolName: null,// set by the child class
    portalUrl: null,
    jobParams: null,
    itemParams: null,
    gp:null,
    resultParameter: null,
    signInPromise: null, //deferred object
    getResultLyrInfos: false,
    
    _jobInfo: null,
    _popupInfo: null,
    _toolServiceUrl: null,
    _counter: null,
    
    constructor: function(params) {
      this.isOutputLayerItemUpdated = false;
      this._rids = [];
      this._counter = 0;
      this._popupInfo = [];
      //console.log(params.id);
      //console.log(params.analysisGpServer);
      if(params.analysisGpServer) {
        this._signIn(params.analysisGpServer);  
      }
      else if(params.portalUrl){
        this.portalUrl = params.portalUrl;
        this._signIn(params.portalUrl, true);
      }
      this.i18n = {};
      lang.mixin(this.i18n, jsapiBundle.common);
      lang.mixin(this.i18n, jsapiBundle.analysisTools);
      lang.mixin(this.i18n, jsapiBundle.analysisMsgCodes);
    },
        
    /*
     * Execute method is called by the analysis tools to start the analysis 
     * params = {
     *   jobParams: parameters for the GP job 
     *   itemParams: paramates for updating the output service item
     * }
     * 
     */  
    execute: function(params) {
      this.jobParams = params.jobParams;
      if(!this.jobParams.OutputName) {
        this.itemParams = null;
      }
      else {
        this.itemParams = params.itemParams;  
      }
      this.signInPromise.then(lang.hitch(this,this._checkUser));
    },
      
    /*
     * Checks if service name is available
     * 
     */
    _checkUser: function() {
      var userid, serverInfo, portalUrl, userUrl, credential;
      credential  = esriKernel.id.findCredential(this.portalUrl);
      userid = credential.userId;
      if (userid) {
        //get user credentials accesse and the org id
        userUrl = this.portalUrl + "/sharing/rest/community/users/" + userid;
        esriRequest({url: userUrl, "content": {f: "json"}}).then(
          lang.hitch(this, this._handleUserProfileResponse),
          /*jshint unused: false */ 
          lang.hitch(this, function(error) {
            this.emit("job-fail",{message: error.message + (error.details ? error.details.toString() : "") , jobParams: this.jobParams});
          })
        );
      }
    },
    
    
    _handleUserProfileResponse: function(userObj) {
      if (!esriLang.isDefined(userObj) || !esriLang.isDefined(userObj.orgId)) {
        this.emit("job-fail",{ message: this.i18n.orgUsrMsg, 
                               jobParams: this.jobParams 
                             });
      }
      else if (array.indexOf(["account_admin", "account_publisher", "org_admin", "org_publisher"], userObj.role) === -1) {
        this.emit("job-fail", {
                               message: this.i18n.pubRoleMsg, 
                               messageCode: "AB_0001", 
                               jobParams: this.jobParams
                              });
      }
      else {
        if(esriLang.isDefined(this.itemParams)) {
          this._checkServiceName(userObj.orgId);
        }
        else {
          this._submitGpJob();
          this.emit("start",this.jobParams); // suuccessful jon execution started
        }        
      }
    },
    
    _checkServiceName: function(accountId) {
      var serverInfo, portalUrl, credential, url, outputProps, request;
      credential  = esriKernel.id.findCredential(this.portalUrl);
      url = this.portalUrl + "/sharing/rest/portals/" + accountId +"/isServiceNameAvailable";
      //console.log(url);
      outputProps = JSON.parse(this.jobParams.OutputName);
      //This will be implemented in  isServiceNameAvailable REST API, until then client logic added
      if(this.isSingleTenant) {
        if(esriLang.isDefined(outputProps.serviceProperties) && esriLang.isDefined(outputProps.serviceProperties.name)) {
          outputProps.serviceProperties.name = outputProps.serviceProperties.name.replace(/\W/g, "_");
          this.jobParams.OutputName = JSON.stringify(outputProps);
        }
      }
      request = { 
        name : outputProps.serviceProperties.name, 
        type : "Feature Service",
        f: "json"
      };
      //console.log(request);
      esriRequest({"url":url, "content":request}).then(lang.hitch(this, function(response) {
        if(response.available) {
          this._createService(); // call create Service 
          this.emit("start",this.jobParams); // suuccessful jon execution started
        }
        else {
          this.emit("job-fail",{message: this.i18n.servNameExists, type:"warning", messageCode: "AB_0002", jobParams: this.jobParams });
          //console.log(this.i18n.servNameExists);
        }
      }),
      /*jshint unused: false */
      lang.hitch(this, function(error) {
       //console.log("error getting service name checked");
        this.emit("job-fail",{message: error.message + (error.details ? error.details.toString() : ""), jobParams: this.jobParams});
      }));          
    },
    
  
    /*
     * Creates a Empty Service with resulting Output Feature Service Name
     */
    _createService: function() {
      var userid, outputProps, request, url, folder, credential;
      credential  = esriKernel.id.findCredential(this.portalUrl); 
      userid = credential.userId;
      outputProps = JSON.parse(this.jobParams.OutputName);
      
      if (userid) {
        //console.log(userid);
        folder = this.itemParams.folder;
        url = this.portalUrl + "/sharing/rest/content/users/" + userid + (folder && folder !== "/" ? ("/" + folder) : "") + "/createService";
         
        //console.log(url);
        request = { 
          "createParameters" : JSON.stringify({
            "currentVersion":10.2,
            "serviceDescription":"",
            "hasVersionedData":false,
            "supportsDisconnectedEditing":false,
            "hasStaticData":true,
            "maxRecordCount":2000,
            "supportedQueryFormats":"JSON",
            "capabilities":"Query",
            "description":"",
            "copyrightText":"",
            "allowGeometryUpdates":false,
            // this causes issues in result layer when used in network tools "units":"esriMeters",
            "syncEnabled":false,
            "editorTrackingInfo": {
              "enableEditorTracking":false,
              "enableOwnershipAccessControl":false,
              "allowOthersToUpdate":true,
              "allowOthersToDelete":true
            },
            "xssPreventionInfo": {
              "xssPreventionEnabled":true,
              "xssPreventionRule":"InputOnly",
              "xssInputRule":"rejectInvalid"
            },
            "tables":[],             
            "name" : outputProps.serviceProperties.name
          }), 
          "outputType" : "featureService",
          f: "json"
        };
        //console.log(request);
        esriRequest({"url":url, "content":request}, {"usePost":true}).then(lang.hitch(this, this._submitGpJob), lang.hitch(this, this._handleCreateServiceError));
      }
    },
    
    _handleCreateServiceError: function(error) {
      //console.log(error);
      this.emit("job-fail",{message: error.message + (error.details ? error.details.toString() : "") ,jobParams : this.jobParams});
    },
    
    _getSelf:function (url) {
      var selfUrl = url + "/sharing/rest/portals/self";
      return esriRequest({
        url: selfUrl,
        content: {
          "culture": dojoNS.locale,
          "f": "json"
        },
        callbackParamName:"callback",
        timeout: 0
      }, {});
    },

    
    _submitGpJob: function(response) {
      //console.log(response);
      var outputProps;
      //console.log(this.toolName);
      if(this.itemParams) {
        this.currentGpItemId = response.itemId;
        outputProps = JSON.parse(this.jobParams.OutputName);
        if(outputProps.serviceProperties) {
          outputProps.serviceProperties.serviceUrl = response.serviceurl;
        }
        outputProps.itemProperties = {
          itemId : response.itemId
        };
        this.jobParams.OutputName = JSON.stringify(outputProps);
      }
      //if gp is empty here
      // portalurl was passed or 
      // hive was not allocated
      if(this.analysisGpServer) {
        if(!this._toolServiceUrl || !this.gp) {
          //portalUrl is passed to widget
          this.set("toolServiceUrl", this.analysisGpServer +  "/" + this.toolName);
        }
        //console.log(this.jobParams);
        this.gp.setUpdateDelay(3000);//1 second delay
        this.gp.submitJob(this.jobParams, lang.hitch(this, this._gpJobComplete), lang.hitch(this, this._gpJobStatus), lang.hitch(this, this._gpJobFailed));
        this.emit("job-submit",this.jobParams);
      }
      else {
        //hive not allocated
        //console.log("make self call again");
        this._getSelf(this.portalUrl).then(lang.hitch(this, function(selfResponse){
          this.analysisGpServer = (selfResponse.helperServices.analysis && selfResponse.helperServices.analysis.url) ? selfResponse.helperServices.analysis.url : null;
          this.set("toolServiceUrl", this.analysisGpServer +  "/" + this.toolName);
          this.gp.setUpdateDelay(3000);//1 second delay
          this.gp.submitJob(this.jobParams, lang.hitch(this, this._gpJobComplete), lang.hitch(this, this._gpJobStatus), lang.hitch(this, this._gpJobFailed));
          this.emit("job-submit",this.jobParams);
        }));
      }
    },  
    
  /*
   * Updates the output layer item with the contextual information in item description 
   * from the submitted job details
   * 
   */
    _updateItem: function(response) {
      var credential, userid, folder, url, request, textObj, jobObj, def, properties;
      credential  = esriKernel.id.findCredential(this.portalUrl);
      userid = credential.userId;
      if (userid) {
        //console.log(userid);
        folder = this.itemParams.folder;
        url = this.portalUrl + "/sharing/rest/content/users/" + userid + (folder && folder !== "/" ? ("/" + folder) : "") + "/items/"+ this.currentGpItemId +"/update";
        //console.log(url);
        if(response) {
          properties = response.item.properties;
        }
        if(!esriLang.isDefined(properties)) {
           properties = {}; 
        }
        if(!esriLang.isDefined(properties.jobUrl)) {
          properties.jobUrl = this._toolServiceUrl + "/jobs/" + this._jobInfo.jobId;
          properties.jobType = "GPServer";
          properties.jobId = this._jobInfo.jobId;
          properties.jobStatus = "processing";
          //properties.jobParams = this.jobParams;
          this.itemParams.properties = properties;
        }
        request = lang.mixin({ f:"json"}, this.itemParams);
        if(request.properties) {
          request.properties =  JSON.stringify(request.properties);
        }
        
        textObj = {};
        jobObj = {};
        if(this._popupInfo && this._popupInfo.length > 0) {
          textObj.layers = array.map(this._popupInfo, function(popupInfo, index){
            popupInfo.description = null;
            var lyrObj =  {
              "id": index,
              "popupInfo": popupInfo
            };
            if(this._showLabels && this._showLabels[index]) {
              lyrObj.showLabels = this._showLabels[index];
            }
            return lyrObj;
          }, this);
        }
        else if(this._showLabels && this._showLabels.length > 0){
          textObj.layers = array.map(this._showLabels, function(showLabels, index){
            var lyrObj =  {
              "id": index
            };
            if(this._showLabels && this._showLabels[index]) {
              lyrObj.showLabels = this._showLabels[index];
            }
            return lyrObj;
          }, this);
        }
        request.text= JSON.stringify(textObj);
        //console.log(request);
        def = esriRequest({"url":url, "content": request}, {"usePost":true});
        def.then(lang.hitch(this, this._handleItemUpdate), lang.hitch(this, this._handleUpdateItemError));
        return def;
      }    
    },
    
     /*jshint unused: false */
    _handleItemUpdate: function(response) {
      //console.log(response);
      this.isOutputLayerItemUpdated = true;
    },
   
     /*jshint unused: false */
    _handleItemDataUpdate: function(response) {
      //console.log("handle item data update", response);
    },
    
    _handleUpdateItemError: function(error) {
      //console.log(error);
      this.isOutputLayerItemUpdated = true;
      this.emit("job-fail",{message: error.message + (error.details ? error.details.toString() : "") ,jobParams : this.jobParams});      
    },
    
    _handleErrorResponse: function(msg) {
      this.emit("job-fail",msg);
    },
    
    _refreshItem: function() {
      //console.log("refresh");
      var userid, serverInfo, portalUrl, folder, url, credential;
      credential  = esriKernel.id.findCredential(this.portalUrl);
      userid = credential.userId;
      if (userid) {
        //console.log("refreh", userid);
        folder = this.itemParams.folder;
        url = this.portalUrl + "/sharing/rest/content/users/" + userid + (folder && folder !== "/" ? ("/" + folder) : "") + "/items/"+ this.currentGpItemId +"/refresh";
        //console.log(url);
        return esriRequest({"url":url, "content":{f:"json"}}, {"usePost":true});
      }
    },
    
    _handleItemRefresh: function(response) {
      //console.log(response);
    },
    
    _readItem: function() {
      var userid, serverInfo, portalUrl, folder, url, credential, def;
      credential  = esriKernel.id.findCredential(this.portalUrl);
      userid = credential.userId;
      if (userid) {
        folder = this.itemParams.folder;
        url = this.portalUrl + "/sharing/rest/content/users/" + userid + (folder && folder !== "/" ? ("/" + folder) : "") + "/items/"+ this.currentGpItemId;
        def = esriRequest({"url":url, "content":{f:"json"}});
        return def.then(lang.hitch(this, this._updateItem));
      }
    },
    
    _gpJobStatus: function(jobInfo) {
      //job parameters stored in the jobInfo during status events
      // to give access to job parameter values without the need
      // to access them again by listeners of this event
      var msg = "";
      jobInfo.jobParams = this.jobParams;
      //////////////////////while checking status these properties are neeeded//////////
      jobInfo.resultParameter  = this.resultParameter;
      jobInfo.returnProcessInfo = this.jobParams.returnProcessInfo;
      jobInfo.getResultLyrInfos = this.getResultLyrInfos;
      jobInfo.currentGpItemId = this.currentGpItemId;
      jobInfo.itemParams = this.itemParams;
      if(jobInfo.jobStatus === "esriJobFailed" || jobInfo.jobStatus === "esriJobSucceeded") {
        if (jobInfo.messages) {
          jobInfo.message = this._buildErrorMsg(jobInfo);
        }
        if(this._checkTimer) {
          clearInterval(this._checkTimer);
          this._checkTimer = null;
          this._gpJobComplete(jobInfo);
        }
        if(jobInfo.jobStatus === "esriJobFailed") {
          this._deleteItem(false);
        }
      }
      this.emit("job-status",jobInfo);
      //console.log(jobInfo);
      this._jobInfo = jobInfo;
      if(this.itemParams && !this.isOutputLayerItemUpdated) {
        //console.log("+++++++++++++calling Update Item+++++++++++++++");
        this._readItem();//update item
      }
    },
    
    _updateRefreshItem: function(results) {
      var prArray = [], 
          result = results[0], 
          lyrDef = [], 
          process;
      if(this.getResultLyrInfos) {
        this._lyrInfos = [];
        this._showLabels = [];
        array.forEach(results, function(res, key) {
          var layerPos, url;
          url =  res.value.url;
          if(url && url.indexOf("/FeatureServer/") !== -1) {
              layerPos = url.match(/[0-9]+$/g)[0];    
              lyrDef[layerPos] = esriRequest({
                url:  url, 
                content: {f: "json"},
                callbackParamName: "callback"
              });          
          }
        }, this);
        process = all(lyrDef);
      }
      else {
        prArray.push(this._refreshItem());
        prArray.push(this._readItem());
        process = "sync";
      }
      when(process, lang.hitch(this, function(response) {
        //console.log(response);
        if(response && response instanceof Array && response.length > 0) {
          array.forEach(response, function(res, key) {
            this._lyrInfos[key] = res;
            if(res.drawingInfo && res.drawingInfo.labelingInfo) {
              this._showLabels[key] = true;  
            }
          }, this);
          ////now call refresh and update
          prArray.push(this._refreshItem());
          prArray.push(this._readItem());
        }
        //results not used TBD
        all(prArray).then(lang.hitch(this, function(results){
          result.outputLayerName = JSON.parse(this.jobParams.OutputName).serviceProperties.name;
          (result.value).itemId =this.currentGpItemId;
          //result.aggregateFields = this.get("aggregateFields");
          //for now since popup is coming saved at viewer level;
          result.analysisInfo = {
            toolName: this.toolName,
            jobParams: this.jobParams
          };
          this.emit("job-result", result);                  
        }), lang.hitch(this, this._handleDeleteItemError));   
      }), lang.hitch(this, this._handleDeleteItemError));
    },  
   
    _gpJobComplete: function(jobInfo){
      //construct the result map service url using the id from jobInfo we'll add a new layer to the map
      //console.log(jobInfo);
      var result;
      if(jobInfo.jobStatus === "esriJobSucceeded"){
        jobInfo.jobParams = this.jobParams;
        this.emit("job-success", jobInfo);
        all(this._getGpResultData(jobInfo)).then(lang.hitch(this, function(results) {
          /*
            1. check if all result parameters are generated by checking results[index] for empty string and filter the results
            2. If all results are empty strings, delete item if it was created
            3. check if results have no data/features (empty) and filter the results again
            4. If all results are empty features(data) {empty: true} , emit job-fail, delete the item if created
            5. check if results are featuset or url, set the popupInfo, processResponse if present
            6. check for process report
            7. if its FS item , update item otherwise emit success
          */
          // 1-4
          results = array.filter(results, function(resObj) {
            if(resObj.value && !resObj.value.empty) {
              return resObj;
            }
          });
          if(results.length === 0) {
            if(this.currentGpItemId) {
              this._deleteItem(false);
            }
            this.emit("job-fail",{message: this.i18n.emptyResultInfoMsg, type:"warning", jobParams: this.jobParams });
            return;
          }
          if(esriLang.isDefined(this.itemParams) && this.itemParams.properties && this.itemParams.properties.jobStatus && this.itemParams.properties.jobStatus === "processing") {
            this.itemParams.properties.jobStatus = "completed";
          }
          array.forEach(results, function(res) {
            //check if its feature collection
            if((res.value.featureSet && !res.value.url)) {
              //work-around for spatial reference
              res.value.featureSet.spatialReference = res.value.layerDefinition.spatialReference;
            }
            // by reference
            else if(res.value.url && res.value.url.indexOf("/FeatureServer/") !== -1) {
              if(res.value.layerInfo && res.value.layerInfo.popupInfo) {
                var layerPos = res.value.url.match(/[0-9]+$/g)[0];    
                this._popupInfo[layerPos] = res.value.layerInfo.popupInfo;
              }
            }
            //output is not FeatureService
          }, this);
          result = results[0];
          //check if it has process Report
          if(this.jobParams.returnProcessInfo) {
            this.gp.getResultData(jobInfo.jobId, "ProcessInfo").then(lang.hitch(this, function(processResponse) {
              var messageArr = [];
              array.forEach(processResponse.value, function(messageObj) {
                messageArr.push(JSON.parse(messageObj));
              }, this);
              if(this.currentGpItemId) {
                this.itemParams.description = AnalysisUtils.buildReport(messageArr);
                this._updateRefreshItem(results);
              }
              else {
                result.analysisReport = AnalysisUtils.buildReport(messageArr);
                this.emit("job-result", result);
              }
            }));
          }
          else {
            if(this.currentGpItemId) {
              this._updateRefreshItem(results);
            }
            else {
              this.emit("job-result", result);
            }
          }
        }));
      }
    },
        
    _gpJobFailed: function(error) {
      //console.log(error);
      var jobError = lang.clone(error);
      jobError.jobParams = this.jobParams;
      //console.log("gp job failed");
      if(this._checkTimer) {
        clearInterval(this._checkTimer);
        this._checkTimer = null;
      }
      if (error.messages) {
        error.message = this._buildErrorMsg(error);
      }
      this.emit("job-fail",error);
    },
    
    _getGpResultData: function(jobInfo) {
      var defArr = [], resultParams = [];
      if(typeof this.resultParameter === "string") {
        resultParams.push(this.resultParameter);
      }
      else if(this.resultParameter instanceof Array) {
        resultParams = this.resultParameter;
      }
      array.forEach(resultParams, function(param, index) {
        defArr.push(this.gp.getResultData(jobInfo.jobId, param));
      }, this);
      /*all(defArr).then(lang.hitch(this, function(results){
         console.log(results);
      }));*/
      return defArr;
    },
    /*
     * cancels the job and deletes the craeted item
     * 
     */   
    cancel: function(jobInfo) {
      this.gp.cancelJob(jobInfo.jobId).then(lang.hitch(this, function(response) {
        //console.log(response);
        if(response.jobStatus === "esriJobCancelled") {
          //delete the output item as job is cancelled
          //http://www.arcgis.com/sharing/rest/content/users/jsmith/items/b512083cd1b64e2da1d3f66dbb135956/delete
          if(!this.itemParams) {
            this.emit("job-cancel", response);
          }
          else {
            this._deleteItem(true);
          }
        }
        
      }),
      /*jshint unused: false */
      function(error) {
        //console.log("error cancelling job", error);
      });
    },
    
    checkJobStatus: function(jobId) {
      this.signInPromise.then(lang.hitch(this, function() {
        this.gp.setUpdateDelay(3000);
        this._checkTimer = setInterval(lang.hitch(this, this._checkStatus, jobId, lang.hitch(this, this._gpJobStatus), lang.hitch(this, this._gpJobFailed)), 3000);
      }));
    },
    
    _checkStatus: function(jobId, handler, errBack) {
      //console.log(jobId, handler, errBack);
      this.gp.checkJobStatus(jobId, handler, errBack);  
    },

    _deleteItem: function(isCancel) {
      var userid, serverInfo, portalUrl, folder, url, credential;
      credential  = esriKernel.id.findCredential(this.portalUrl);
      userid = credential.userId;
      //serverInfo = esriKernel.id.findServerInfo(this._toolServiceUrl);
      //portalUrl = serverInfo.owningSystemUrl;
      if (userid && this.itemParams) {
        //console.log(userid);
        folder = esriLang.isDefined(this.itemParams.folder) ? this.itemParams.folder : "";
        url = this.portalUrl + "/sharing/rest/content/users/" + userid + (folder && folder !== "/" ? ("/" + folder) : "") + "/items/"+ this.currentGpItemId +"/delete";
        //console.log(url);
        esriRequest({"url":url, "content":{f:"json"}}, {"usePost":true}).then(lang.hitch(this, this._handleItemDelete, isCancel), lang.hitch(this, this._handleDeleteItemError));
      }      
    },
    
    _handleItemDelete: function(isCancel, response) {
      //console.log("handle item data delete", isCancel, response);
      if(isCancel) {
        this.emit("job-cancel", response);
      }
    },
    
    _handleDeleteItemError: function(error) {
      //console.log(error);
      //this.emit("job-fail",error);
      this.emit("job-fail",{message: error.message + (error.details ? error.details.toString() : "") ,jobParams : this.jobParams});
    },
    
    _initFolderStore: function(PortalClass, def) {
      this._fportal = new PortalClass.Portal(this.portalUrl);
      //console.log(this.portal);
      this._fportal.signIn().then(lang.hitch(this, function(loggedInUser) {
        //console.log(loggedInUser);
        this.portalUser = loggedInUser;
        this.portalUser.getFolders().then(lang.hitch(this, function(folders){
          var folderStore = AnalysisUtils.createFolderStore(folders, this.portalUser.username);
          def.resolve(folderStore);
        }));  
      }));
      //return def;
    },
    
    getFolderStore: function() {
      var def = new Deferred(), userid, serverInfo, portalUrl, credential, modules, rid, self, idx;
      if(this.folderStore) {
        def.resolve(this.folderStore); 
      }
      else {
        this.signInPromise.then(lang.hitch(this, function(signInCredential){
          //console.log(signInCredential);
          //credential  = esriKernel.id.findCredential(this.portalUrl);
          //userid = credential.userId;
          //serverInfo = esriKernel.id.findServerInfo(this._toolServiceUrl);
          //portalUrl = serverInfo.owningSystemUrl;
          //console.log(portalUrl);
          //this._portalUrl = portalUrl;
          //loads the module lazily
          modules = [ "../../arcgis/Portal" ];
          rid = this._counter++;
          self = this;
          if(this._rids) {
            this._rids.push(rid);
          }
          //console.log("Loading Portal class...");
          //console.log("before");
          require(modules, function(PortalClass) {
            idx = self._rids ? array.indexOf(self._rids, rid) : -1;
            if (idx !== -1) {
              //console.log("Portal: loaded");
              self._rids.splice(idx, 1);
              self._initFolderStore(PortalClass, def);
            }
          });
        }));
      }
      //console.log("after");
      return def;
    },
    
    _checkToolUrl: function() {
      var def = new Deferred();
      if(this.analysisGpServer) {
        if(!this._toolServiceUrl || !this.gp) {
          //portalUrl is passed to widget
          this.set("toolServiceUrl", this.analysisGpServer +  "/" + this.toolName);
        }
        def.resolve({"success": true});
      }
      else {
        //hive not allocated
        //console.log("make self call again");
        this._getSelf(this.portalUrl).then(lang.hitch(this, function(selfResponse){
          this.analysisGpServer = (selfResponse.helperServices.analysis && selfResponse.helperServices.analysis.url) ? selfResponse.helperServices.analysis.url : null;
          if(this.analysisGpServer) {
            this.set("toolServiceUrl", this.analysisGpServer +  "/" + this.toolName);
          }
          def.resolve({"success": true});
        }));
      }
      return def;       
    },
    
    getCreditsEstimate: function(toolName, jobParams) {
      var url, def, request, env, analysisServerUrl;
      def = new Deferred();
      this._checkToolUrl().then(lang.hitch(this, function(response){
        if(!this._toolServiceUrl) {
          //hive not allocated - trial org case
          env = this.portalUrl && this.portalUrl.indexOf("dev") !== -1 ? "dev" : 
                this.portalUrl && this.portalUrl.indexOf("qa") !== -1 ? "qa" : "";
          //"http://analysisdev.arcgis.com/arcgis/rest/services/tasks/GPServer"
          analysisServerUrl = "http://analysis" + env + ".arcgis.com/arcgis/rest/services/tasks/GPServer"+ "/" + this.toolName;
        }
        else {
          analysisServerUrl = this._toolServiceUrl;
        }
        url = analysisServerUrl.replace("/"+toolName , "/exts/Estimate/" + toolName);
        //url = "http://analysistest.arcgis.com:8080/arcgis/rest/services/tasks/GPServer/exts/Estimate/"+ toolName;
        request = lang.mixin({ f:"json"}, jobParams);
        esriRequest({"url":url, "content": request}, {"usePost":true}).then(function(result) {
          def.resolve(result);
        },
        function(error) {
          //console.log("error getting estimate", error);
          def.resolve(error);
        });
      }));
      return def;
    },
    
    _signIn: function(url, isPortalUrl) {
      var modules, rid, self, idx, credential;
      this.signInPromise = new Deferred();
      if(isPortalUrl) {
        //loads the module lazily
        modules = [ "../../arcgis/Portal" ];
        rid = this._counter++;
        self = this;
        if(this._rids) {
          this._rids.push(rid);
        }
        //console.log("Loading Portal class...");
        //console.log("before");
        require(modules, lang.hitch(this, function(PortalClass) {
          idx = self._rids ? array.indexOf(self._rids, rid) : -1;
          if (idx !== -1) {
            //console.log("Portal: loaded");
            self._rids.splice(idx, 1);
            this._portal = new PortalClass.Portal(url);
            this._portal.signIn().then(lang.hitch(this, function(loggedInUser) {
              this.portalUser = loggedInUser;
              //console.log(loggedInUser);
              //check for not empty
              /*this._getSelf(this.portalUrl).then(lang.hitch(this, function(selfResponse){
                console.log(selfResponse);
              }));*/
              if(this._portal.helperServices && this._portal.helperServices.analysis && this._portal.helperServices.analysis.url) {
                this.analysisGpServer = this._portal.helperServices.analysis.url;
                //console.log(this.analysisGpServer);
                esriRequest({"url":this.analysisGpServer, "content": {f: "json"}, callbackParamName:"callback"}).then(lang.hitch(this, function(response){
                  credential = esriKernel.id.findCredential(this.analysisGpServer);
                  this.signInPromise.resolve(credential);
                }),
                /*jshint unused: false */  
                lang.hitch(this, function(error) {
                  this.signInPromise.reject(error);
                  //console.log("error getting credential", error);
                  }));
              }
              else {
                this.signInPromise.resolve(loggedInUser);  
              }
            }),lang.hitch(this, this._handleSignInError));
          }
         }));    
      }
      else {
        //use esri/request on analysi server url to authenticate , since its not a public server this way the owningSystemUrl also gets added idmagr resources array so the token
        //can be passed when geowarehouse request is made ( case when showSelectFolder is set to false)
        esriRequest({"url":url, "content": {f: "json"}, callbackParamName:"callback"}).then(lang.hitch(this, function(response){
          var credential, serverInfo;
          credential = esriKernel.id.findCredential(url);
            //console.log("logged in ", credential);
            if(!esriLang.isDefined(credential)) {
              esriKernel.id.getCredential(url).then(lang.hitch(this, function(credential) {
                credential = esriKernel.id.findCredential(url);
                serverInfo = esriKernel.id.findServerInfo(this._toolServiceUrl);
                if(esriLang.isDefined(serverInfo) && esriLang.isDefined(serverInfo.owningSystemUrl)) {
                  this.portalUrl = serverInfo.owningSystemUrl;
                }
                this.signInPromise.resolve(credential);                
              }), lang.hitch(this, this._handleSignInError));
            }
            else {
              serverInfo = esriKernel.id.findServerInfo(this._toolServiceUrl);
              if(esriLang.isDefined(serverInfo) && esriLang.isDefined(serverInfo.owningSystemUrl)) {
                this.portalUrl = serverInfo.owningSystemUrl;
              }
              this.signInPromise.resolve(credential);
            }
        }),
        lang.hitch(this, this._handleSignInError));
      }
      return this.signInPromise;
    },
    
    _handleSignInError: function(error) {
      this.emit("job-fail",{message: this.i18n.analysisSignInErrorMsg, messageCode: "AB_0003"});
      this.signInPromise.reject(error);
    },
    
    _buildErrorMsg: function(jobInfo) {
      var msg = "", msgArray =[], msgObj, str;
      msgArray = array.filter(jobInfo.messages, function(item) {
        if((item.type === "esriJobMessageTypeError" || item.type === "esriJobMessageTypeWarning") && item.description && item.description.indexOf("messageCode") !== -1) {
          return item.description;
        }
      });
      //console.log(msgArray);
      if(msgArray.length > 0) {
        array.forEach(msgArray, function(item) {
          msgObj = JSON.parse(item.description);
          str = "";
          //console.log(msgObj);
          //console.log(msgObj.messageCode);
          if(item.type === "esriJobMessageTypeWarning") {
            jobInfo.type = "warning";
          }
          if(msgObj.messageCode){
             str = esriLang.isDefined(this.i18n[msgObj.messageCode]) ? this.i18n[msgObj.messageCode] : msgObj.message;
             str =  esriLang.isDefined(msgObj.params) ? string.substitute(str, msgObj.params) : str;
             msg += str + "&nbsp;";
          }
          else if(msgObj.error && msgObj.error.messageCode) {
             str = esriLang.isDefined(this.i18n[msgObj.error.messageCode]) ? this.i18n[msgObj.error.messageCode] : msgObj.error.message;
             str =  esriLang.isDefined(msgObj.error.params) ? string.substitute(str, msgObj.error.params) : str;
             //console.log(str);
             msg += str + "&nbsp;";
          }
        }, this);
      }
      return msg;
    },

    //setter/getters
    _toolServiceUrlSetter: function(toolUrl) {
      this._toolServiceUrl = toolUrl;
      this.gp = new Geoprocessor(toolUrl);
    },
    
    _setToolServiceUrlAttr: function(toolUrl) {
      //console.log("Tool Service Url", toolUrl);
      //console.log(toolUrl.substring(toolUrl.lastIndexOf("/")));
      this._toolServiceUrl = toolUrl;
      //work-around for rest info not working as analysis dev is not on SSL
      /*var serverInfo = new esri.ServerInfo();
      if(toolUrl.indexOf("analysistest") !== -1) { 
        serverInfo.server = "http://analysistest.arcgis.com:8080";
        serverInfo.tokenServiceUrl =  "https://devext.arcgis.com/sharing/generateToken";
        serverInfo.owningSystemUrl =  "https://devext.arcgis.com";
        esriKernel.id.registerServers([serverInfo]);
      }*/
      this.gp = new Geoprocessor(toolUrl);
    }
  });
    
  return AnalysisBase;
  
});


