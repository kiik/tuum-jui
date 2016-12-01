

function millis() {
  return 0;
}

function time() {
  var d = new Date();
  return d;
}


angular.module('TuumUI').factory('TuumInput',
  ['$location', '$interval',
  function($loc, $int) {
    console.log(":load: TuumUI::TuumInput");
    var Service = {};

    var m_pad = undefined,
        m_ready = false,
        m_displock = true,
        m_inptype = -1,
        m_input = "";

    var last_event = undefined;

    Service.getLastEvent = function() {
      return last_event;
    };

    Service.getInputType = function() { return m_input; }

    Service.controlMap = {
      'spd': 0,
      'dir': 0,
      'rot': 0,
      'lck': 0,
    };

    Service.clearInput = function() {
     this.controlMap.spd = 0;
     this.controlMap.dir = 0;
     this.controlMap.rot = 0;

     this.controlMap.lck = 0;
    }

    Service.destroyInput = function() {
      this.clearInput();

      this.inputUpdateProcess = function() {}
      m_inptype = -1;
    }

    var t0 = Date.now(), T = 1000;
    // TOUCH INPUT
    Service._loadGamePad = function() {
      var gamepads = navigator.getGamepads();

      for (var i = 0; i < gamepads.length; ++i) {
        m_pad = gamepads[i];
        if(m_pad != undefined) break;
      }

      if(m_pad == undefined) {
        console.log(":TuumInput::_loadGamePad: No gamepads found!");
        return -1;
      }

      Service.inputUpdateProcess = function() {
        this.controlMap.pwr = m_pad.axes[3] * -100; // Power - left stick (up/down)
        this.controlMap.rot = m_pad.axes[1] * -1;      // Joint control - right stick
        this.controlMap.dfd = m_pad.axes[0];      // Differential drive - left stick

        this.controlMap.dir  = m_pad.buttons[1].value == 1 ? 0 : m_pad.buttons[0].value == 1 ? 1 : m_pad.buttons[2].value == 1 ? -1 :this.controlMap.dir; // Direction control
        this.controlMap.lck = m_pad.buttons[7].value;

        if(Date.now() > t0) {
          //console.log(m_pad.axes);
          t0 = Date.now() + T;
        }
      }

      m_displock = true;
      m_input = 'controller';
      return 1;
    }


    // KEYBOARD INPUT
    var test = 0;

    var KeyCodes = {
      'W': 87,
      'A': 65,
      'S': 83,
      'D': 68,
      'Q': 81,
      'E': 69,
      'LS': 16, // LEFT SHIFT
    }

    var keyMap = {};

    var events = {
      'Change': [],
    }

    Service.on = function(event, cb) {
      if(!(event in events)) return;
      events[event].push(cb);
    }

    Service.emit = function(event, data) {
      events[event].forEach(function(ev) {
        ev(data);
      });
    }

    Service.getKey = function(k) {
      return keyMap[KeyCodes[k]];
    }

    Service.__kb_down = function(event) {
      if(test < 0) {
        console.log('Pressed '+event.keyCode);
        test = true;
        console.log(event);
        test += 1;
      }

      keyMap[event.keyCode] = 1;
    }

    Service.__kb_up = function(event) {
      /*
      console.log('Pressed '+event.keyCode);
      console.log(event);
      */

      keyMap[event.keyCode] = 0;
    }

    Service._loadKeyboard = function() {
      document.addEventListener('keydown', this.__kb_down);
      document.addEventListener('keyup', this.__kb_up);

      Service.inputUpdateProcess = function() {
        var cpy = $.extend({},this.controlMap);

        this.controlMap.lck = this.getKey('LS') ? 1 : 0;

        //this.controlMap.sp1 = (sp1_indicator.slider('getValue') - 1000) / 1000.0;

        var l = this.getKey('Q'),
            r = this.getKey('E');
        this.controlMap.rot = l && r ? 0 : l ? 1 : r ? -1 : 0;

        var fw = this.getKey('W'),
            ri = this.getKey('A'),
            bk = this.getKey('S'),
            lf = this.getKey('D');

        var R = ri && lf ? 0 : ri ? 1 : lf ? -1 : 0,
            I = fw && bk ? 0 : fw ? 1 : bk ? -1 : 0;

        this.controlMap.dir = Math.round(Math.atan2(R, I) * 100) / 100.0;
        this.controlMap.spd = fw || ri || bk || lf ? 1 : 0;

        if(!_.isEqual(cpy,this.controlMap)) this.emit('Change',this.controlMap);
      }

      m_displock = false;
      m_input = 'keyboard';
      return 1;
    }

    Service._unloadKeyboard = function() {
      document.removeEventListener('keydown', this.__kb_down);
      document.removeEventListener('keyup', this.__kb_up);
    }

    Service.resolveInput = function(type = 'keyboard') {
      this.destroyInput();

      var res = undefined;
      if(type == 'keyboard') res = this._loadKeyboard();
      else if(type == 'controller') res = this._loadGamePad();

      if(res >= 0) {
        m_ready = true;
        console.log(':TuumInput: Using '+type+' input.');
        return 1;
      }

      console.log(":TuumInput: Error resolving input to " + type + ", err " + res);
      return -1;
    }

    Service.getInput = function(k) {
      if(!m_ready) {
        if(!this.resolveInput()) return 0;
      }

      if(!this.controlMap.hasOwnProperty(k)) return undefined;
      returnthis.controlMap[k];
    }

    Service.isReady = function() {
      return m_ready;
    }

    Service.isDisplayLocked = function() {
      return m_displock;
    }

    Service.getData = function() {
      return { 's': this.getInput('spd'),
        'd': this.getInput('dir'),
        'r': this.getInput('rot'),
        'l': this.getInput('lck'),
      };
    }

    Service.setControl = function(k, v) {
      if(this.controlMap.hasOwnProperty(k))
        if(this.controlMap[k] == v) return;
      this.controlMap[k] = v;
      this.emit("Change", this.getData());
    }

    Service.process = function() {
      Service.inputUpdateProcess();
    }


    Service.uiVBind = function(name) {
      return function(val) {
        if(angular.isDefined(val)) {
          Service.setControl(name, val);
          return val;
        }

        return Service.controlMap[name];
      }
    }

    Service.uiFBind = function(name) {

    }

    Service.uiCBind = function(name) {
      return this.controlMap[name];
    }

    Service.uiKBind = function(name) {
      return this.getKey(name);
    }

    Service.resolveInput();

    $int(Service.process, 50);

    /*
    function init() {
      Service.destroyInput();

      gTRDGui.getInputElem('keyboard').click(function() {
        console.log('select kb');
        Service.resolveInput('keyboard');
      });
      gTRDGui.getInputElem('controller').click(function() {
        console.log('select ctrl');
        that.resolveInput('controller');
      });
      gTRDGui.getInputElem('touch').click(function() {
        console.log('select touch');
        that.resolveInput('touch');
      });
    }*/

    return Service;
}]);
