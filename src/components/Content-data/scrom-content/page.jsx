"use client";

import { useEffect, useState, useRef } from "react";

// -------------------------------------------------
// Inject SCORM APIs (1.2 + 2004)
// -------------------------------------------------
function injectScormAPI(setProgress, setScormData) {
  if (typeof window === "undefined") return;
  if (window.API || window.API_1484_11) return;

  const store2004 = {};
  const store12 = {};

  // ----------------------------- SCORM 2004 -----------------------------
  window.API_1484_11 = {
    Initialize: () => "true",
    Terminate: () => {
      setScormData({ ...store2004 });
      
      return "true";
    },
    GetValue: (k) => store2004[k] ?? "",
    SetValue: (k, v) => {
      store2004[k] = v;

      // update progress on slide change
      if (k === "cmi.location") {
        const progress = {
          slide: v,
          currentTime: store2004.currentTime || 0,
        };

        setProgress(progress);
        setScormData({ ...store2004 });
      }

      return "true";
    },
    Commit: () => {
      setScormData({ ...store2004 });
      
      return "true";
    },
    GetLastError: () => "0",
    GetErrorString: () => "",
    GetDiagnostic: () => "",
  };

  // ----------------------------- SCORM 1.2 -----------------------------
  window.API = {
    LMSInitialize: () => "true",
    LMSFinish: () => {
      setScormData({ ...store12 });
      
      return "true";
    },
    LMSGetValue: (k) => store12[k] ?? "",
    LMSSetValue: (k, v) => {
      store12[k] = v;

      // update progress on slide change
      if (k === "cmi.core.lesson_location") {
        const progress = {
          slide: v,
          currentTime: store12.currentTime || 0,
        };

        setProgress(progress);
        setScormData({ ...store12 });
      }

      return "true";
    },
    LMSCommit: () => {
      setScormData({ ...store12 });
      
      return "true";
    },
    LMSGetLastError: () => "0",
    LMSGetErrorString: () => "",
    LMSGetDiagnostic: () => "",
  };
}

// -------------------------------------------------
// Inject progress tracker into iframe
// -------------------------------------------------
function injectTrackingScript(iframe) {
  if (!iframe?.contentWindow) return;

  const script = iframe.contentDocument.createElement("script");
  
  script.type = "text/javascript";

  script.innerHTML = `
    let lastSlide = null;
    function trackProgress() {
      try {
        let slide = window.API_1484_11?.GetValue("cmi.location") 
                 || window.API?.LMSGetValue("cmi.core.lesson_location") 
                 || null;
        const video = document.querySelector("video");
        const currentTime = video?.currentTime || 0;

        if (slide !== lastSlide || currentTime % 5 < 1) { // every 5s or slide change
          lastSlide = slide;
          window.parent.postMessage({
            type: "SCORM_PROGRESS",
            progress: { slide, currentTime },
            scormData: window.API_1484_11 || window.API
          }, "*");
        }
      } catch (e) {}
    }

    setInterval(trackProgress, 1000);
  `;

  iframe.contentDocument.body.appendChild(script);
}

// -------------------------------------------------
// React Component
// -------------------------------------------------
export default function ScormViewer({ data, setScormData, handleSaveScormData, scromLogData }) {
  const [launchFile, setLaunchFile] = useState(null);
  
  const [progress, setProgress] = useState({
    slide: scromLogData?.lastSlide || null,
    currentTime: scromLogData?.lastTime
      ? new Date(scromLogData.lastTime).getTime() / 1000
      : 0
  });

  const saveTimeout = useRef(null);

  // Inject SCORM API
  useEffect(() => { injectScormAPI(setProgress, setScormData); }, []);

  // Load manifest
  useEffect(() => {
    if (!data?.scorm_data?.folder_url) return;

    const folderUrl = data.scorm_data.folder_url;
    const manifestUrl = `/api/scorm/${folderUrl}/imsmanifest.xml`;

    async function loadManifest() {
      try {
        const res = await fetch(manifestUrl);
        const xmlText = await res.text();
        const xml = new DOMParser().parseFromString(xmlText, "application/xml");

        const item = xml.querySelector("item");
        const identifierRef = item?.getAttribute("identifierref");
        const resource = xml.querySelector(`resource[identifier="${identifierRef}"]`);
        const href = resource?.getAttribute("href") || resource?.querySelector("file")?.getAttribute("href");
        
        if (!href) return;

        setLaunchFile(`/api/scorm/${folderUrl}/${href}`);
      } catch (err) {
        console.error("Manifest load error:", err);
      }
    }

    loadManifest();
  }, [data]);

  // Listen for progress messages
  useEffect(() => {
    const listener = (event) => {
      if (event.data?.type !== "SCORM_PROGRESS") return;

      const p = event.data.progress;

      const numericTime = typeof p.currentTime === "number"
        ? p.currentTime
        : new Date(p.currentTime).getTime() / 1000;

      const progressData = { ...p, currentTime: numericTime };

      setProgress(progressData);
      setScormData(prev => ({ ...prev, lastSlide: p.slide, lastTime: numericTime }));

      // Debounced save to avoid hitting API too often
      if (saveTimeout.current) clearTimeout(saveTimeout.current);
      saveTimeout.current = setTimeout(() => {
        handleSaveScormData({ ...event.data.scormData, lastSlide: p.slide, lastTime: numericTime });
      }, 5000);
    };

    window.addEventListener("message", listener);
    
    return () => window.removeEventListener("message", listener);
  }, [handleSaveScormData, setScormData]);

  return (
    <div style={{ inlineSize: "100%", blockSize: "100%", border: "1px solid #ccc" }}>
      {launchFile ? (
        <iframe
          src={launchFile}
          style={{ inlineSize: "100%", blockSize: "100%", border: 0 }}
          allow="autoplay; fullscreen; same-origin"
          onLoad={(e) => injectTrackingScript(e.target)}
        />
      ) : (
        <p style={{ padding: 20 }}>Loading SCORM content…</p>
      )}
    </div>
  );
}
