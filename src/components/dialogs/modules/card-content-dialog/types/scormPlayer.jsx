// components/ScormPlayerLegacy.jsx
'use client';

import { useEffect, useRef, useState } from 'react';

import { AICC, Scorm12API, Scorm2004API } from 'scorm-again';

const ScormPlayerLegacy = ({
    studentId,
    studentName,
    trainingId,
    moduleId,
    scheduleId,
    scormUrl,
    startApiUrl,
    updateApiUrl,
    showRatingModal
}) => {
    const iframeRef = useRef(null);
    const apiRef = useRef(null);
    const [moduleStatusId, setModuleStatusId] = useState(0);
    const [x, setX] = useState(1);
    const [redirectURL, setRedirectURL] = useState('');

    const startLesson = () => {

        const api = new Scorm2004API({ apiLogLevel: 4 });

        api.cmi.learner_id = studentId;
        window.API_1484_11 = api;
        apiRef.current = api;


        api.lmsInitialize();
        api.on('Initialize', async () => {
            alert();
        })

        window.onbeforeunload = handleBeforeUnload;
        loadLocal();
        document.getElementById('iframescorm')?.setAttribute('src', scorm.url);

        // document.getElementById('a-apri-lezione')?.style?.setProperty('display', 'none');
    };



    useEffect(() => {

        const settings = {
            responseHandler: (response) => {
                const responseObj = JSON.parse(response.text());

                return {
                    result: responseObj.success,
                    errorCode: responseObj.error,
                };
            },
        };

        const api = new Scorm2004API(settings);

        window.API = new Scorm2004API({
            enableOfflineSupport: true,
            courseId: 'demo-course',
            autocommit: true,
            lmsCommitUrl: 'https://your-lms.com/api/scorm/commit'
        });

        document.getElementById('iframescorm')?.setAttribute('src', scormUrl);

    }, [studentId, trainingId, moduleId, scheduleId]);

    return (
        <div>
            <button id="a-apri-lezione" onClick={startLesson}>Start Lesson</button>
            <iframe
                id="iframescorm"
                ref={iframeRef}
                width="100%"
                height="400"
                frameBorder="0"
                title="SCORM Lesson"
            ></iframe>

        </div>
    );
};

export default ScormPlayerLegacy;
