// jshint forin:false

define([
  "../../../core/arrayUtils", "../webgl-engine/lib/Util"
], function(arrayUtils, Util) {
  return function AsyncQuotaRoundRobinQueue(workerFunc, callbackFunc, callbackThis, typeWorkerQuota_, dbg) {
    var robin = 0;

    var type2id = {};
    var tasks = [];
    var typeNumWorkers = [];
    var typeWorkerQuota = [];
    var typeStatistics = [];
    var totalNumWorkers = 0;
    var maxTotalNumWorkers = 0;
    for (var type in typeWorkerQuota_) {
      tasks[robin] = [];
      typeNumWorkers[robin] = 0;
      typeStatistics[robin] = {requests:0, size:0, duration:0, speed:0};
      typeWorkerQuota[robin] = typeWorkerQuota_[type];
      type2id[type] = robin++;
      maxTotalNumWorkers += typeWorkerQuota_[type];
    }
    var numTypes = tasks.length;

    robin = 0;

    this.setWorkerQuota = function(typeWorkerQuota_) {
      Util.assert(arrayUtils.equals(Object.keys(this.typeWorkerAllication), Object.keys(typeWorkerQuota_)));
      this.typeWorkerAllication = typeWorkerQuota_;
      maxTotalNumWorkers = 0;
      for (var type in typeWorkerQuota_) {
        var id = type2id[type];
        typeWorkerQuota[id] = typeWorkerQuota_[type];
        maxTotalNumWorkers += typeWorkerQuota_[type];
      }
    };

    this.setWorkerFunc = function(newWorkerFunc) {
      workerFunc = newWorkerFunc;
    };

    this.push = function(task) {
      var id = type2id[task.clientType];
      if (totalNumWorkers < maxTotalNumWorkers) {
        typeNumWorkers[id]++;
        totalNumWorkers++;
        if (dbg) {
          console.log("queue start type " + id + ", " + debugShizzle());
        }
        workerFunc(task, taskCallback);
      } else {
        tasks[id].push(task);
        if (dbg) {
          console.log("queue push type " + id + ", " + debugShizzle());
        }
      }
    };

    this._getStatsForType = function(clientType) {
      var id = type2id[clientType];
      return {quota: typeWorkerQuota[id], workers: typeNumWorkers[id], queueSize: tasks[id].length, requestStats: typeStatistics[id]};
    };
    
    this.removeTasks = function(toRemove, clientType) {
      var tasksNew = [];
      var clientTasks = tasks[type2id[clientType]];
      for (var i=0; i<clientTasks.length; i++) {
        var task = clientTasks[i];
        if (toRemove.indexOf(task) > -1) {
          continue;
        }

        tasksNew.push(task);
      }

      tasks[type2id[clientType]] = tasksNew;
    };

    this.workerCancelled = function(task) {
      taskFinished(task);
      task._cancelledInQueue = true;
    };

    this.clear = function() {
      for (var i = 0; i < tasks.length; i++) {
        tasks[i] = [];
      }
    };

    var taskFinished = function(task) {
      var id = type2id[task.clientType];
      typeNumWorkers[id]--;
      totalNumWorkers--;
      typeStatistics[id].requests++;
      typeStatistics[id].size+=task.size||0;
      typeStatistics[id].duration+=task.duration||0;
      typeStatistics[id].speed = typeStatistics[id].duration>0?typeStatistics[id].size/typeStatistics[id].duration:0;
      Util.assert(typeNumWorkers[id] >= 0);
      next();
    };

    var next = function() {
      var nextId = robin;
      var hasStarted = false;

      // first round: check worker quota
      do {
        if (typeNumWorkers[nextId] < typeWorkerQuota[nextId]) {
          if (processQueue(nextId)) {
            hasStarted = true;
          }
        }
        nextId = (nextId + 1) % numTypes;
      } while (!hasStarted && (nextId != robin));

      if (!hasStarted) {
        // second round: ignore worker quota
        do {
          if (processQueue(nextId)) {
            hasStarted = true;
          }
          nextId = (nextId + 1) % numTypes;
        } while (!hasStarted && (nextId != robin));
      }

      if (!hasStarted && dbg) {
        console.log("queue sink, " + debugShizzle());
      }

      robin = nextId;
    };

    var processQueue = function(id) {
      while (tasks[id].length > 0) {
        if (workerFunc(tasks[id].shift(), taskCallback)) {
          if (dbg) {
            console.log("queue startqueued clientType " + id + ", " + debugShizzle());
          }
          typeNumWorkers[id]++;
          totalNumWorkers++;
          return true;
        }
        else if (dbg) {
          console.log("queue task cancelled, " + debugShizzle());
        }
      }
      return false;
    };

    var taskCallback = function(task) {
      if (!task._cancelledInQueue) {
        callbackFunc.apply(callbackThis, arguments);
        taskFinished(task);
      }
    };


    function debugShizzle() {
      return "workers: " + typeNumWorkers + ", queues: " + tasks.map(function(a) { return a.length; });
    }
  };
});