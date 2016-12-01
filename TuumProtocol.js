
var TuumProtocol = function(TSrv) {
  var gSrv = TSrv;

  this.send = function(data, cb) {
    return gSrv.sendRequest(data, cb);
  }

  var that = this;

  var initDriveProtocol = function(srv) {
    srv.omniDrive = function(spd, dir, rot) {
      var data = {
        uri: '/drv',
        c: 'drv',
        s: spd,
        d: dir * 1000,
        r: rot,
      };

      this.send(data);
    }

    srv.getMotionInfo = function(cb) {
      var data = {
        uri: '/drv',
        c: 'info',
      };

      this.send(data, cb);
    }

    return srv;
  }

  var initVisionProtocol = function(srv) {
    srv.getFrame = function(cb) {
      this.send({
        'uri': '/vis',
        'c': 'getFrame',
        'dev': 'CAM0',
      }, cb);
    }

    srv.visionSetup = function(settings) {
      var cmd = {
        'uri': '/vis',
        'c': 'settings',
      };

      this.send($.extend(cmd, settings));
    }

    srv.vConfig = function(settings, cb) {
      var cmd = {
        'uri': '/vis',
        'c': 'pplcnf',
      };

      if(settings != null)
        cmd["data"] = settings;

      this.send(cmd, cb);
    }

    srv.VisionFilter = {
      get: function(cb) {
        var cmd = {
          'uri': '/vis',
          'c': 'vf_get',
        }

        that.send(cmd, cb);
      },
      'set': function(data, cb) {
        var cmd = {
          'uri': '/vis',
          'c': 'vf_set',
          'f': data,
        }

        that.send(cmd, cb);
      }
    }

    srv.EntityFilter = {
      get: function(cb) {
        var cmd = {
          'uri': '/vis',
          'c': 'ent_get',
        }

        that.send(cmd, cb);
      }
    }

    return srv;
  }

  var initHardwareProtocol = function(srv) {
    srv.setDribbler = function(val, cb) {
      var cmd = {
        'uri': '/hw',
        'c': 'dr',
        'v': val > 0 ? 1 : 0
      }

      this.send(cmd, cb);
    }

    srv.doCharge = function(cb) {
      var cmd = {
        'uri': '/hw',
        'c': 'ch',
      }

      this.send(cmd, cb);
    }

    srv.doKick = function(cb) {
      var cmd = {
        'uri': '/hw',
        'c': 'kc',
        'v': 100,
      }

      this.send(cmd, cb);
    }

    srv.getBallSensor = function(cb) {
      var cmd = {
        'uri': '/hw',
        'c': 'bl'
      }

      this.send(cmd, cb);
    }

    return srv;
  }

  var initFsProtocol = function(srv) {
    srv.ls = function(path = ".") {
      this.send({'c': 'ls', 'p': path});
    }

    return srv;
  }

  initDriveProtocol(this);
  initVisionProtocol(this);
  initHardwareProtocol(this);
  initFsProtocol(this);

  return this;
}
