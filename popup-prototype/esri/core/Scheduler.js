define([
  "./ArrayPool",
  "./ObjectPool",
  "./nextTick",
  "./requestAnimationFrame",
  "./now"
], function(
  ArrayPool, ObjectPool, nextTick, requestAnimationFrame, now
) {

  var supportedPhases = [
    "prepare",
    "preRender",
    "render",
    "postRender",
    "update"
  ];

  var handleItems = new ObjectPool(
    function() {
      this.isActive = true;
      this.callback = null;
    },
    function() {
      this.isActive = false;
      this.callback = null;
    }
  );

  var noop = function() {};

  var removeFn = function() {
    queueHandles.put(this);
  };

  var queueHandles = new ObjectPool(
    function() {
      this.remove = removeFn;
      this.item = null;
    },
    function() {
      this.remove = noop;
      this.item = null;
    }
  );

  var getQueueHandle = function getQueueHandle(item) {
    var hdl = queueHandles.get();
    hdl.item = item;
    return hdl;
  };

  var executeTask = function(item) {
    if (item.isActive) {
      // We switch it off.
      item.isActive = false;
      item.callback();
    }
    // if the item was reclaimed during the callback call.
    // then don't dispose it. 
    if (!item.isActive) {
      handleItems.put(item);
    }
  };

  var Scheduler = function() {
    this._boundDispatch = this._dispatch.bind(this);
    this._deferred = ArrayPool.get();
    this._isProcessing = false;
    this._queue = ArrayPool.get();
    this._task = null;
    this.deferWhileProcessing = false;

    this._frameTasks = ArrayPool.get();
    this._phaseTasks = {};
    this._previousFrameTime = -1;
    for (var i = 0; i < supportedPhases.length; i++) {
      this._phaseTasks[supportedPhases[i]] = ArrayPool.get();
    }
    this._boundAnimationFrame = this._animationFrame.bind(this);
  };

  Scheduler.prototype = {
    schedule: function(callback) {
      if (this._isProcessing && this.deferWhileProcessing) {
        return this._defer(callback);
      }
      var item = handleItems.get();
      item.callback = callback;
      this._schedule(item);
      return getQueueHandle(item);
    },

    _defer: function(callback) {
      var item = handleItems.get();
      item.callback = callback;

      if (!this._deferred) {
        this._deferred = ArrayPool.get();
      }
      this._deferred.push(item);
      return getQueueHandle(item);
	},

    _dispatch: function() {
      var queue = this._queue;
      
      this._isProcessing = true;
      this._task.remove();
      this._task = null;

      while (queue.length) {
        executeTask(queue.shift());
      }

      this._isProcessing = false;

      var deferred = this._deferred;
      if (deferred && deferred.length) {
        this._deferred = null;
        while (deferred.length) {
          this._schedule(deferred.shift());
        }
        ArrayPool.put(deferred);
      }
    },

    _schedule: function(item) {
      if (!this._task) {
        this._task = nextTick(this._boundDispatch);
      }
      this._queue.push(item);
    },

    addFrameTask: function(phases) {
      var task = {
        phases: phases,
        paused: false,
        pausedAt: 0,
        epoch: -1,
        dt: 0,
        ticks: -1,
        removed: false
      };

      this._frameTasks.push(task);

      for (var i = 0; i < supportedPhases.length; i++) {
        var phase = supportedPhases[i];
        var taskPhase = phases[phase];

        if (taskPhase) {
          this._phaseTasks[phase].push(task);
        }
      }

      if (this._frameTasks.length === 1) {
        this._previousFrameTime = -1;
        this._requestAnimationFrame();
      }

      return {
        isPaused: function() {
          return task.paused;
        },

        remove: function() {
          task.removed = true;
        },

        pause: function() {
          task.paused = true;
          task.pausedAt = now();
        },

        resume: function() {
          task.paused = false;

          if (task.epoch !== -1) {
            task.epoch += (now() - task.pausedAt) * 0.001;
          }
        }
      };
    },

    clearFrameTasks: function() {
      for (var i = 0; i < this._frameTasks.length; i++) {
        this._frameTasks[i].removed = true;
      }
    },

    _purge: function() {
      var i = 0;

      while (i < this._frameTasks.length) {
        var task = this._frameTasks[i];
        i++;

        if (!task.removed) {
          continue;
        }

        this._frameTasks.splice(i - 1, 1);

        for (var k = 0; k < supportedPhases.length; k++) {
          var phase = supportedPhases[k];
          var taskPhase = task.phases[phase];

          if (taskPhase) {
            var items = this._phaseTasks[phase];
            var idx = items.indexOf(task);

            if (idx !== -1) {
              items.splice(idx, 1);
            }
          }
        }
      }
    },

    _animationFrame: function(timestamp) {
      this.executing = true;
      
      var t = now() * 0.001;

      if (this._previousFrameTime < 0) {
        this._previousFrameTime = t;
      }

      var dt = t - this._previousFrameTime;
      this._previousFrameTime = t;

      for (var i = 0; i < this._frameTasks.length; i++) {
        var task = this._frameTasks[i];

        if (task.epoch !== -1) {
          task.dt = dt;
        }
      }

      // Dispatch different phases of all tasks
      for (i = 0; i < supportedPhases.length; i++) {
        var phase = supportedPhases[i];
        var tasks = this._phaseTasks[phase];

        for (var k = 0; k < tasks.length; k++) {
          task = tasks[k];

          if (task.paused || task.removed) {
            continue;
          }

          if (i === 0) {
            task.ticks++;
          }

          if (task.epoch === -1) {
            task.epoch = t;
          }

          var spendInFrame = now() * 0.001 - t;
          task.phases[phase].call(task, t, task.dt, t - task.epoch, spendInFrame);
        }
      }

      this._purge();

      if (this._frameTasks.length > 0) {
        this._requestAnimationFrame();
      }

      this.executing = false;
    },

    _requestAnimationFrame: function() {
      requestAnimationFrame(this._boundAnimationFrame);
    }
  };


  var scheduler = new Scheduler();

  Scheduler.schedule = function(callback) {
    return scheduler.schedule(callback);
  };

  Scheduler.addFrameTask = function(phases) {
    return scheduler.addFrameTask(phases);
  };

  Scheduler.clearFrameTasks = function() {
    return scheduler.clearFrameTasks();
  };

  Object.defineProperty(Scheduler, "executing", {
    get: function() {
      return scheduler.executing;
    }
  });

  Scheduler.instance = scheduler;
  return Scheduler;
});
