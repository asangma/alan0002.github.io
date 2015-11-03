/* jshint forin: false */
define([
  "../../../core/declare",
  "../../../core/Scheduler",

  "../support/eventUtils",

  "./StreamDataManager",
  "./PreallocArray",
  "../webgl-engine/lib/Util"
], function(
  declare, Scheduler,
  eventUtils,
  StreamDataManager, PreallocArray,
  Util
) {

    var assert = Util.assert;

    var ClientType = {
      TERRAIN: "terrain",
      SCENE: "scene",
      SYMBOLOGY: "symbols"
    };

    var tmpSchedulingArray = new PreallocArray(20);

    function Budget(budget) {
      this.begin = 0;
      this.budget = 0;
      this.performance = Util.performance;
      this.enabled = true;

      if (budget !== undefined) {
        this.reset(budget);
      }
    }

    Budget.prototype.now = function() {
      return this.performance.now();
    };

    Budget.prototype.reset = function(budget) {
      this.begin = this.now();
      this.budget = this.enabled ? budget : Number.MAX_VALUE;
    };

    Budget.prototype.done = function() {
      return this.enabled && this.elapsed() >= this.budget;
    };

    Budget.prototype.remaining = function() {
      return Math.max(this.budget - this.elapsed(), 0);
    };

    Budget.prototype.elapsed = function() {
      return this.now() - this.begin;
    };

    var ResourceController = declare(null, {
      constructor: function(view, scheduler) {
        this._clients = [];
        this._frameWorker = null;
        this._budget = new Budget();
        this._idleFrameWorkers = [];
        this._idleFrameWorkerRobin = 0;
        this._idleUpdatesStartFired = false;
        this._lastTargetChangeTime = Util.performance.now();

        this.navigationTimeout = 300;       // ms
        this.animatingFrameTimeBudget = 10; // ms
        this.idleFrameTimeBudget = 50;      // ms

        var initCacheSize = {};
        var initDownloadSlots = {};
        for (var type in ClientType) {
          initCacheSize[ClientType[type]] = 0;
          initDownloadSlots[ClientType[type]] = 0;
        }
        initCacheSize[ClientType.TERRAIN] = 400*1024;
        initCacheSize[ClientType.SCENE] = 400*1024;
        initCacheSize[ClientType.SYMBOLOGY] = 30*1024;

        initDownloadSlots[ClientType.TERRAIN] = 15;
        initDownloadSlots[ClientType.SCENE] = 20;
        initDownloadSlots[ClientType.SYMBOLOGY] = 5;

        this._maxGpuMemory = 1500;

        this.streamDataManager = new StreamDataManager(initDownloadSlots);

        this._cameraListeners = eventUtils.on(view, {
          navigation: {
            currentViewReachedTarget: this._targetReached,
            targetViewChanged: this._targetChanged
          }
        }, this);

        if (!scheduler) {
          scheduler = Scheduler;
        }

        this._frameTask = scheduler.addFrameTask({
          update: this._frameUpdate.bind(this)
        });

        this._view = view;

        this.stats = {
          frameUpdateTime: new NumberStatistic(),
          idleUpdateTime: new NumberStatistic()
        };

        this.frameUpdateNavigation = null;
      },

      destroy: function() {
        this._frameTask.remove();
        this._frameTask = null;

        this._cameraListeners.remove();

        this.streamDataManager.destroy();
        this.streamDataManager = null;
      },

      setEnableBudget: function(enable) {
        this._budget.enabled = !!enable;
      },

      registerClient: function(client, type, addUrlTokenFunction) {
        this._clients.push({client: client, type: type});
        if (typeof client.setMaxGpuMemory === "function") {
          client.setMaxGpuMemory(this._maxGpuMemory);
          // TODO: distribute max GPU memory according to current GPU memory usage among all layers
        }
        return this.streamDataManager.makeSupplier(type, addUrlTokenFunction);
      },

      deregisterClient: function(client) {
        for (var i = 0; i < this._clients.length; i++) {
          if (this._clients[i].client === client) {
            this._clients[i] = this._clients[this._clients.length - 1];
            this._clients.pop();
            return;
          }
        }
      },

      setMaxGpuMemory: function(amount) {
        this._maxGpuMemory = amount;
        for (var i = 0; i < this._clients.length; i++) {
          var client = this._clients[i].client;
          if (typeof client.setMaxGpuMemory === "function") {
            client.setMaxGpuMemory(amount);
          }
        }
        // TODO: distribute max GPU memory according to current GPU memory usage among all layers
      },

      /**
       * Register worker methods that are called when the application is "idle", meaning that the camera is not
       * currently in motion.
       *
       * @param {object} client The object on which the callbacks are installed. The "this" reference on callbacks will
       *    be set to this value (no need for .bind()ing).
       * @param {object} callbacks An object containing a combination of the following callback functions
       * @config {function} [needsUpdate] A function that returns true if the client needs idleFrame calls at the
       *    moment, false otherwise.
       * @config {function} [idleFrame] If specified, needsUpdate must be provided as well. Called once per frame if
       *    the camera hasn't been moving for this.navigationTimeout milliseconds. The function receives the number of
       *    milliseconds processing time allocated as parameter and should do its best not to take longer.
       * @config {function} [idleBegin] Called once if the camera has been still for this.navigationTimeout milliseconds.
       * @config {function} [idleEnd] Called when the camera is moved after idleBegin has been called
       *
       */
      registerIdleFrameWorker: function(client, callbacks) {
        var exists = this._idleFrameWorkers.some(function (worker) { return worker.client === client; });
        assert(!exists, "Can only register idle frame workers once per client/layer");
        assert(!callbacks.idleFrame || callbacks.needsUpdate, "needsUpdate has to be specified if idleFrame is specified");
        this._idleFrameWorkers.push({
          client: client,
          callbacks: callbacks
        });
      },

      deregisterIdleFrameWorker: function(client) {
        var workers = this._idleFrameWorkers;
        for (var i = 0; i < workers.length; i++) {
          if (workers[i].client === client) {
            workers[i] = workers[workers.length - 1];
            workers.pop();
            return;
          }
        }
      },

      registerFrameWorker: function(callback) {
        assert(!this._frameWorker, "Only one (non-idle) per-frame worker supported at the moment");
        this._frameWorker = callback;
      },

      deregisterFrameWorker: function() {
        this._frameWorker = null;
      },

      _targetChanged: function(ev) {
        this._lastTargetChangeTime = Util.performance.now();
        this._targetReached = false;

        if (this._idleUpdatesStartFired) {
          this._idleUpdatesStartFired = false;
          this._callWorkersNoScheduling("idleEnd");
        }
      },

      _targetReached: function(ev) {
        this._targetReached = true;
      },

      _frameUpdate: function(t, dt, lt, spend) {
        this._budget.reset(this.animatingFrameTimeBudget - spend);

        if (this._view.navigation) {
          this._view.navigation.step(dt);
        }

        if (this._frameWorker) {
          this._frameWorker(this._budget);
          this.stats.frameUpdateTime.addSample(this._budget.elapsed());
        }
        if (this._budget.begin - this._lastTargetChangeTime > this.navigationTimeout && this._targetReached) {
          if (!this._idleUpdatesStartFired) {
            this._callWorkersNoScheduling("idleBegin");
            this._idleUpdatesStartFired = true;
          }

          // Reset budget to remaining time for idle frame workers
          this._budget.reset(this.idleFrameTimeBudget - this._budget.elapsed());

          if (this._budget.remaining() > 3 /* don't bother if there isn't at least 3 ms left */) {
            this._callWorkersStrictScheduling("idleFrame", this._budget);
            this.stats.idleUpdateTime.addSample(this._budget.elapsed());
          }
        }
      },

      _callWorkersNoScheduling: function(eventType) {
        var workers = this._idleFrameWorkers;
        for (var i = 0; i < workers.length; i++) {
          var worker = workers[i];
          if (worker.callbacks[eventType]) {
            worker.callbacks[eventType].call(worker.client);
          }
        }
      },

      _callWorkersStrictScheduling: function(eventType, timeBudget) {
        var workers = this._idleFrameWorkers,
          numWorkers = workers.length,
          worker, i, idx;

        // first pass: find out which workers need to be called.
        tmpSchedulingArray.clear();
        for (i = 0, idx = this._idleFrameWorkerRobin; i < numWorkers; i++) {
          worker = workers[idx++ % numWorkers];
          if (worker.callbacks.needsUpdate && worker.callbacks.needsUpdate.call(worker.client)) {
            if (tmpSchedulingArray.length === 0) {
              // Store the next RR start to be the worker after the first active worker found
              this._idleFrameWorkerRobin = idx;
            }
            tmpSchedulingArray.push(worker);
          }
        }

        // second pass: call workers
        var now = timeBudget.now();
        var endTime = now + timeBudget.remaining();

        while ((tmpSchedulingArray.length > 0) && now < endTime) {
          timeBudget.reset((endTime - now) / tmpSchedulingArray.length);

          worker = tmpSchedulingArray.pop();
          worker.callbacks[eventType].call(worker.client, timeBudget);

          now = timeBudget.now();
        }
      }
    });

    ResourceController.ClientType = ClientType;

    var NumberStatistic = function() {
      this.addSample = function(value) {
        this.min = Math.min(this.min, value);
        this.max = Math.max(this.max, value);
        this.total += value;
        this.numSamples++;
      };

      this.getAverage = function() {
        return this.total / this.numSamples;
      };

      this.reset = function() {
        this.total = 0;
        this.numSamples = 0;
        this.min = Number.MAX_VALUE;
        this.max = -Number.MAX_VALUE;
      };

      this.reset();
    };

    return ResourceController;
  }
);
