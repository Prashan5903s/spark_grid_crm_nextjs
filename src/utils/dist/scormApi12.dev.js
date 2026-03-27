"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.SCORM12API = void 0;

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) {
  for (var i = 0; i < props.length; i++) {
    var descriptor = props[i];

    descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor);
  }
}

function _createClass(Constructor, protoProps, staticProps) {
  if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps);

  return Constructor;
}

var SCORM12API =

  /*#__PURE__*/
  function () {
    function SCORM12API() {
      _classCallCheck(this, SCORM12API);

      this.data = {};
      this.initialized = false;
    }

    _createClass(SCORM12API, [{
      key: "LMSInitialize",
      value: function LMSInitialize() {
        this.initialized = true;

        return "true";
      }
    }, {
      key: "LMSFinish",
      value: function LMSFinish() {
        return "true";
      }
    }, {
      key: "LMSGetValue",
      value: function LMSGetValue(key) {
        return this.data[key] || "";
      }
    }, {
      key: "LMSSetValue",
      value: function LMSSetValue(key, value) {
        this.data[key] = value;

        return "true";
      }
    }, {
      key: "LMSCommit",
      value: function LMSCommit() {
        return "true";
      }
    }, {
      key: "LMSGetLastError",
      value: function LMSGetLastError() {
        return "0";
      }
    }, {
      key: "LMSGetErrorString",
      value: function LMSGetErrorString() {
        return "";
      }
    }, {
      key: "LMSGetDiagnostic",
      value: function LMSGetDiagnostic() {
        return "";
      }
    }]);

    return SCORM12API;
  }();

exports.SCORM12API = SCORM12API;
