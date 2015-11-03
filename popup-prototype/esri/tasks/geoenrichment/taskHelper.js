define([
    "dojo/_base/lang",
    "dojo/Deferred",
    "../../request"

], function (lang, Deferred, request) {

    var TH = {

        invokeMethod: function (task, url, createParams, readResponse, completeEvent, errorEvent) {

            var _request = null;
            var _deferred = null;

            function cancel() {
                if (_request) {
                    _request.cancel();
                    _request = null;
                }
            }

            function onComplete(response) {
                var result;
                try {
                    result = readResponse(response);
                }
                catch (e) {
                    onError(e);
                    return;
                }
                if (_deferred) {
                    _deferred.resolve(result);
                }
                task[completeEvent](result);
            }

            function onError(error) {
                if (_deferred) {
                    _deferred.reject(error);
                }
                task[errorEvent](error);
            }

            _deferred = new Deferred(cancel);

            try {
                var restParams = createParams ? createParams() : {};
                restParams.f = "json";
                if (task.token) {
                    restParams.token = task.token;
                }
                _request = request({
                    url: task.url + url,
                    content: restParams,
                    handleAs: "json"
                });
                _request.then(onComplete, onError);
            }
            catch (e) {
                onError(e);
            }

            return _deferred.promise;
        },

        jsonToRest: function (json) {
            var rest = {};
            for (var p in json) {
                if (lang.isString(json[p])) {
                    rest[p] = json[p];
                }
                else {
                    rest[p] = JSON.stringify(json[p]);
                }
            }
            return rest;
        },

        throwEmptyResponse: function () {
            throw new Error("Geoenrichment service returned empty response");
        }
    };

    return TH;

});
