export class SCORM12API {
    constructor() {
        this.data = {};
        this.initialized = false;
    }

    LMSInitialize() {
        this.initialized = true;
        
        return "true";
    }

    LMSFinish() {
        
        return "true";
    }

    LMSGetValue(key) {
        return this.data[key] || "";
    }

    LMSSetValue(key, value) {
      
        this.data[key] = value;
        
        return "true";
    }

    LMSCommit() {
        
        return "true";
    }

    LMSGetLastError() {
        return "0";
    }

    LMSGetErrorString() {
        return "";
    }

    LMSGetDiagnostic() {
        return "";
    }
}
