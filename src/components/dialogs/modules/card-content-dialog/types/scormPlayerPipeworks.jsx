// components/ScormPlayerConverted.jsx
'use client';

import { useEffect, useRef, useState } from 'react';

const ScormPlayerConverted = ({ scormUrl }) => {
    const iframeRef = useRef(null);
    const [apiLoaded, setApiLoaded] = useState(false);

    const public_url = process.env.NEXT_PUBLIC_ASSETS_URL;

    const student_id = "111";
    const student_name = "2222";
    const training_id = "3333";
    const module_id = "5555";
    const schedule_id = "66666";

    //const scormUrl = scormUrl //`${public_url}/uploads/module/content/scorm/1751024834573-Giving-Helpful-Feedback/index_lms.html`;

    const scorm = {
        modalita: 'iframe',
        key: 'scorm-',
        id_lezione: '00' + student_id + training_id + module_id + schedule_id,
        url: `${public_url}/${scormUrl}`,
        student_id,
        student_name,
        wW: 1080,
        wH: 770,
        wToolbar: false,
        wTitlebar: false,
        wLocation: true,
        wStatus: true,
        wScrollbars: true,
        wResizable: true,
        wMenubar: false,
        wName: 'FAB_API_SCORM',
        closeOnFinish: true,
        apriLezione: function () {
            window.onbeforeunload = this.onbeforeunload;
            window.API.cmi.core.student_id = this.student_id;
            window.API.apiLogLevel = 4;
            this.loadLocal();

            if (iframeRef.current) {
                iframeRef.current.src = this.url;
            }
        },
        onbeforeunload: function (event) {

            const msg = 'Se sicuro di uscire? Perderai il tracciato di questa lezione.';

            event = event || window.event;
            if (event) event.returnValue = msg;

            return msg;
        },
        saveLocal: function (obj) {
            localStorage.setItem(this.key + this.id_lezione, JSON.stringify(obj));
        },
        loadLocal: function () {
            const json = localStorage.getItem(this.key + this.id_lezione);

            if (json) window.API.loadFromJSON(JSON.parse(json));
        },
        updateLessonStatus: function () { },
        closeFinish: function () {
            if (this.closeOnFinish) this.close();
            window.onbeforeunload = null;
        },
        deleteLocal: function () {
            localStorage.removeItem(this.key + this.id_lezione);
        },
        close: function () {
            try {
                if (this.scoWin && !this.scoWin.closed) this.scoWin.close();
            } catch (e) {
                console.log('ERROR: Unable to close SCO window (' + e.message + ')');
            }
        },

        saveRemote: function () { },
    };

    useEffect(() => {
        const script = document.createElement('script');

        script.src = 'https://demo.dreamlms.co/common/js/SCORM_2004_APIWrapper.js';

        script.onload = () => {
            if (window.API) {

                window.API.on("LMSSetValue", () => {

                    const data = window.API.cmi.toJSON();

                    scorm.saveLocal(data);
                    scorm.saveRemote(data);
                    scorm.updateLessonStatus(data);
                });

                window.API.on("LMSCommit", () => { });

                window.API.on("LMSGetLastError", () => {
                    const data = window.API.cmi.toJSON();

                });

                window.API.on("LMSGetErrorString", () => {
                    const data = window.API.cmi.toJSON();

                });

                window.API.on("LMSGetDiagnostic", () => {
                    const data = window.API.cmi.toJSON();
                });

                window.API.on("LMSFinish", () => {
                    const data = window.API.cmi.toJSON();

                    scorm.saveLocal(data);
                    scorm.saveRemote(data);
                    scorm.updateLessonStatus(data);
                    scorm.closeFinish();
                });

                scorm.apriLezione();
                setApiLoaded(true);
            }
        };

        document.body.appendChild(script);

        return () => {
            if (window.API && window.API.LMSFinish) {
                window.API.LMSFinish();
            }
        };
    }, []);

    return (
        <>
            <iframe
                ref={iframeRef}
                id="iframescorm"
                name="myiFrame"
                scrolling="no"
                frameBorder="0"
                height="650px"
                width="100%"
                allowFullScreen
                webkitallowfullscreen="true"
                mozallowfullscreen="true"
                title="SCORM Content"
            ></iframe>
            {!apiLoaded && <p>Loading SCORM API...</p>}
        </>
    );
};

export default ScormPlayerConverted;
