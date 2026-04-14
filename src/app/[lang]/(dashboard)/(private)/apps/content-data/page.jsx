'use client';

import React, { useState, useEffect, useRef } from 'react';

import { useParams, useSearchParams, useRouter } from 'next/navigation';

import dynamic from 'next/dynamic';

import { useSession } from 'next-auth/react';

import {
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Card,
  CardContent,
  Button,
  Typography,
  Divider,
  Skeleton,
  CardActions,
  CardHeader
} from '@mui/material';

import { toast } from 'react-toastify';

import DialogCloseButton from '@/components/dialogs/DialogCloseButton';

import SurveyModalComponent from '@/components/survey-modal/page';

const PDFViewer = dynamic(() => import('@/components/Content-data/PdfViewer/index'), { ssr: false });
const DocViewer = dynamic(() => import('@/components/Content-data/DocViewer/index'), { ssr: false });
const PptViewer = dynamic(() => import('@/components/Content-data/PptViewer/index'), { ssr: false });
const YouTubePlayerComponent = dynamic(() => import('@/components/Content-data/youtube-player/page'), { ssr: false });
const QuizQuestionComponent = dynamic(() => import('@/components/Content-data/quiz-qyestion/page'), { ssr: false });
const ScromContentComponent = dynamic(() => import('@/components/Content-data/scrom-content/page'), { ssr: false });

const ContentData = () => {

  const { lang: locale } = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();

  const activityId = searchParams.get('activityId');
  const types = searchParams.get('type');
  const moduleId = searchParams.get('moduleId');
  const contentFolderId = searchParams.get('contentFolderId');
  const moduleTypeId = searchParams.get('moduleTypeId');

  const API_URL = process.env.NEXT_PUBLIC_API_URL;
  const ASSET_URL = process.env.NEXT_PUBLIC_ASSETS_URL;
  const { data: session } = useSession();

  const token = session?.user?.token;

  const saveTimeout = useRef(null);

  const [data, setData] = useState(null);
  const [pageInfo, setPageInfo] = useState({ current: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [openConfirm, setOpenConfirm] = useState(false);

  const [surveyModalOpen, setSurveyModalOpen] = useState(false)

  const [scormData, setScormData] = useState({});

  const [isInstruction, setInstruction] = useState(false)

  const [fieldData, setFieldData] = useState({
    currentPage: 0,
    totalPages: 0,

    viewedPages: [],

    currentVideoTime: 0,

    viewedVideoTime: 0,
    totalVideoTime: 0
  });

  const [quizData, setQuizData] = useState([]);

  const fieldAutosaveTimer = useRef(null);
  const quizAutosaveTimer = useRef(null);

  const fetchActivity = async () => {
    setLoading(true);

    try {

      if (!API_URL || !token || !activityId) return;

      const response = await fetch(`${API_URL}/user/activity/fetch/data/${activityId}`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` }
      });

      const result = await response.json();

      if (response.ok) {

        setData(result?.data);
      } else {
        console.error('Activity Fetch Error response:', result);
      }
    } catch (error) {
      console.error('Activity Fetch Error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {

    fetchActivity();
  }, [API_URL, token, activityId]);

  const postJson = async (url, payload) => {

    try {

      if (!API_URL || !token) {

        console.warn('Missing API_URL or token for postJson', { url });

        return { ok: false, error: 'missing credentials' };

      }

      const res = await fetch(url, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const json = await res.json().catch(() => null);

      setSurveyModalOpen(json?.data?.completed || false);

      return { ok: res.ok, status: res.status, data: json?.data };
    } catch (error) {

      console.error('postJson error', error);

      return { ok: false, error };

    }
  };

  const handleSaveScormData = async (data) => {
    try {
      const response = await fetch(`${API_URL}/user/activity/set/scorm/data/${moduleId}/${contentFolderId}/${activityId}/${moduleTypeId}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      const result = await response.json();

      if (response.ok) {

        const value = result?.data?.completed || false;

        setSurveyModalOpen(value);
      }

    } catch (error) {
      throw new Error(error)
    }
  }

  const saveFieldData = async (payload) => {

    const url = `${API_URL}/user/activity/set/report/data/${moduleId}/${contentFolderId}/${activityId}/${moduleTypeId}`;

    return postJson(url, payload);
  };

  const saveQuizData = async (payload) => {
    const url = `${API_URL}/user/activity/set/report/data/${moduleId}/${contentFolderId}/${activityId}/${moduleTypeId}`;

    return postJson(url, payload);
  };

  const saveInsertFieldData = async (payload) => {

    const url = `${API_URL}/user/activity/insert/report/data/${moduleId}/${contentFolderId}/${activityId}/${moduleTypeId}`;

    return postJson(url, payload);
  };

  const saveInsertQuizData = async (payload) => {
    const url = `${API_URL}/user/activity/insert/report/data/${moduleId}/${contentFolderId}/${activityId}/${moduleTypeId}`;

    return postJson(url, payload);
  };

  useEffect(() => {

    const changed =

      fieldData.currentPage ||

      fieldData.currentVideoTime ||

      (fieldData.viewedPages && fieldData.viewedPages.length > 0);

    if (!changed) return;

    if (fieldAutosaveTimer.current) clearTimeout(fieldAutosaveTimer.current);

    fieldAutosaveTimer.current = setTimeout(() => {
      saveFieldData(fieldData).then((res) => {
        if (!res.ok) {
          console.warn('Field autosave failed', res);
        }
      });
    }, 800);

    return () => {
      if (fieldAutosaveTimer.current) {

        clearTimeout(fieldAutosaveTimer.current);

      }
    };
  }, [
    fieldData.currentPage,
    fieldData.currentVideoTime,
    (fieldData.viewedPages || []).length,
    fieldData.totalPages,
    fieldData.totalVideoTime,
    API_URL,
    token
  ]);

  useEffect(() => {
    if (!Array.isArray(quizData) || quizData.length === 0) return;

    if (quizAutosaveTimer.current) clearTimeout(quizAutosaveTimer.current);

    quizAutosaveTimer.current = setTimeout(() => {
      saveQuizData(quizData).then((res) => {
        if (!res.ok) {
          console.warn('Quiz autosave failed', res);
        }

      });

    }, 1200);

    return () => {
      if (quizAutosaveTimer.current) clearTimeout(quizAutosaveTimer.current);
    };

  }, [quizData, API_URL, token]);

  const fileUrl = data?.document_data?.image_url ? `${ASSET_URL}/activity/${data.document_data.image_url}` : null;
  const videoURL = data?.video_data?.video_url ? `${ASSET_URL}/activity/${data.video_data.video_url}` : null;
  const youtubeVideoURL = data?.video_data?.video_url;
  const extension = data?.document_data?.image_url?.split('.').pop()?.toLowerCase();
  const scromLogData = data?.logs?.[0]?.scorm_data || {}

  const isPDF = extension === 'pdf';
  const isOfficeDoc = ['ppt', 'pptx', 'doc', 'docx'].includes(extension);

  const handlePageChange = (current, total) => {
    setPageInfo({ current, total });
    setFieldData(prev => ({
      ...prev,
      currentPage: current,
      totalPages: total,
      viewedPages: Array.from(new Set([...(prev.viewedPages || []), current]))
    }));
  };

  const isCompletedCondition =
    (data?.logs?.[0]?.completion_percentage || 0) >= 100 || (
      (fieldData.totalPages > 0 && fieldData.viewedPages.length === fieldData.totalPages) ||
      (fieldData.totalVideoTime > 0 && fieldData.viewedVideoTime >= fieldData.totalVideoTime) ||
      (data?.questions?.length > 0 && quizData.length === data.questions.length)

    );

  const handleMarkComplete = async () => {
    setOpenConfirm(false);

    try {
      if (quizData.length > 0) {
        const res = await saveInsertQuizData(quizData);

        if (!res.ok) {
          toast.error('Failed to save quiz before marking complete');
          console.warn('markComplete saveInsertQuizData failed', res);
        }

        if (res?.ok && res?.data?.completed) {

          setSurveyModalOpen(res?.data?.completed)

          return;
        }


      } else {
        const res = await saveInsertFieldData(fieldData);

        if (!res.ok) {
          toast.error('Failed to save progress before marking complete');
          console.warn('markComplete saveInsertFieldData failed', res);
        }

        if (res?.ok && res?.data?.completed) {

          setSurveyModalOpen(res?.data?.completed)

          return;
        }

      }

      toast.success('Activity completed successfully', { autoClose: 1000 });
      router.push(`/${locale}/apps/content?id=${moduleId}&content-folder-id=${contentFolderId}`);
    } catch (err) {
      console.error('handleMarkComplete error', err);
      toast.error('Could not mark activity complete');
    }
  };

  const saveAttempt = async () => {
    try {

      const response = await fetch(`${API_URL}/user/activity/attempt/check/${moduleId}/${contentFolderId}/${activityId}/${moduleTypeId}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`
        }
      })

      const value = await response.json();

    } catch (error) {

      throw new Error(error)
    }
  }

  useEffect(() => {
    if (Object.keys(scormData).length === 0) return;

    if (saveTimeout.current) clearTimeout(saveTimeout.current);

    saveTimeout.current = setTimeout(() => {
      handleSaveScormData(scormData);
    }, 800);

    return () => clearTimeout(saveTimeout.current);
  }, [scormData, moduleId, contentFolderId, activityId, moduleTypeId]);

  const ready = types && data;

  const moduleTypeLabel = {
    '688723af5dd97f4ccae68834': 'Documents & Slides',
    '688723af5dd97f4ccae68835': 'Video',
    '688723af5dd97f4ccae68836': 'YouTube Video',
    '688723af5dd97f4ccae68837': 'Scrom Content',
    '688723af5dd97f4ccae68838': 'Web Link',
    '688723af5dd97f4ccae68839': 'Subjective Assessment',
    '688723af5dd97f4ccae6883a': 'Flash Card',
    "68886902954c4d9dc7a379bd": "Quiz"

  }

  const isLeavingRef = useRef(false);
  const initialUrlRef = useRef('');

  const endActivityUrl = `${API_URL}/user/activity/end/attempt`;

  const endActivity = () => {
    if (!token || isLeavingRef.current) return;

    isLeavingRef.current = true;

    try {
      const payload = {
        moduleId,
        contentFolderId,
        activityId,
        moduleTypeId,
        token
      };

      const blob = new Blob(
        [JSON.stringify(payload)],
        { type: 'application/json' }
      );

      navigator.sendBeacon(endActivityUrl, blob);
    } catch (err) {
      console.error('Failed to end activity', err);
    }
  };

  useEffect(() => {
    if (!token) return;

    initialUrlRef.current = window.location.href;

    const handleBeforeUnload = (event) => {
      endActivity();
      event.preventDefault();
      event.returnValue = '';
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [token]);

  useEffect(() => {
    if (!token || typeof window === 'undefined') return;

    window.history.pushState({ guard: true }, '', window.location.href);

    const handlePopState = () => {
      const newUrl = window.location.href;

      if (newUrl === initialUrlRef.current) {
        window.history.pushState({ guard: true }, '', initialUrlRef.current);

        return;
      }

      const leave = window.confirm('Do you want to leave this page?');

      if (!leave) {
        window.history.pushState({ guard: true }, '', initialUrlRef.current);

        return;
      }

      endActivity();
    };

    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [token]);

  return (
    <Box sx={{ p: { xs: 1, sm: 2, md: 3 } }}>
      {!ready ? (
        <Skeleton height={200} />
      ) : (
        <Card>
          <CardHeader title={<>
            {loading ? (
              <Skeleton width="60%" height={40} />
            ) : (
              <Typography variant="h4" fontWeight="bold" gutterBottom color="primary">
                {data.name || moduleTypeLabel?.[moduleTypeId] ? moduleTypeLabel?.[moduleTypeId] : 'Objective Quiz'}
              </Typography>
            )}

            {!loading && pageInfo.total > 0 && (isPDF || isOfficeDoc) && (
              <Typography variant="body2" sx={{ color: 'primary.main', fontWeight: 500, mb: 1 }}>
                Page {pageInfo.current} of {pageInfo.total}
              </Typography>
            )}</>
          } />

          <CardContent>

            <Box
              sx={{
                height: { xs: '45vh', sm: '50vh', md: '60vh' },
                p: { xs: 0.5, sm: 1 },
              }}
            >
              {loading ? (
                <>
                  <Skeleton height={200} />
                  <Skeleton height={200} sx={{ mt: 2 }} />
                </>
              ) : (
                <>
                  {types === 'pdf' && isPDF && (
                    <PDFViewer
                      pdfUrl={fileUrl}
                      onPageChange={handlePageChange}
                      setFieldData={setFieldData}
                      pageData={data.logs?.[0]}
                      setSurveyModalOpen={setSurveyModalOpen}
                    />
                  )}
                  {(extension === 'doc' || extension === 'docx') && (
                    <DocViewer
                      fileUrl={fileUrl}
                      onPageLoad={handlePageChange}
                      setFieldData={setFieldData}
                      pageData={data.logs?.[0]}
                      setSurveyModalOpen={setSurveyModalOpen}
                    />
                  )}
                  {(extension === 'ppt' || extension === 'pptx') && (
                    <PptViewer
                      fileUrl={fileUrl}
                      onPageLoad={handlePageChange}
                      setFieldData={setFieldData}
                      pageData={data.logs?.[0]}
                      setSurveyModalOpen={setSurveyModalOpen}
                    />
                  )}
                  {(types === 'video' || types === 'youtube-video') && (
                    <YouTubePlayerComponent
                      url={types === 'video' ? videoURL : youtubeVideoURL}
                      setFieldData={setFieldData}
                      pageData={data.logs?.[0]}
                      setSurveyModalOpen={setSurveyModalOpen}
                    />
                  )}
                  {types === 'quiz' && (

                    <QuizQuestionComponent
                      log={data}
                      isInstruction={isInstruction}
                      setInstruction={setInstruction}
                      status={false}
                      quizSetting={data?.QuizSetting?.[0] || {}}
                      data={data.questions || []}
                      report={data.quiz_reports || []}
                      setQuizData={setQuizData}
                      saveInsertQuizData={saveInsertQuizData} // pass actual fn
                      setSurveyModalOpen={setSurveyModalOpen}
                    />
                  )}
                  {types === 'scrom-content' &&
                    <ScromContentComponent
                      data={data}
                      scormData={scormData}
                      scromLogData={scromLogData}
                      setScormData={setScormData}
                      setSurveyModalOpen={setSurveyModalOpen}
                    />
                  }
                </>
              )}
            </Box>

            {!loading && (
              <>

                {types !== 'quiz' && types !== "scrom-content" && (

                  <Box
                    sx={{
                      backgroundColor: '#e8f1ff',
                      border: '1px solid #c5d7ff',
                      padding: 2,
                      borderRadius: 1,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                      mt: 2
                    }}
                  >
                    In order to complete the activity it is mandatory to click on
                    <strong>Mark As Complete</strong> after you have finished.
                  </Box>

                )}
              </>
            )}
          </CardContent>
          <CardActions sx={{ display: 'flex', justifyContent: 'center', gap: 2, mt: 6 }}>
            {(!isInstruction && types === 'quiz') && (

              ((data?.QuizSetting?.[0]?.reattempts == -1) || (!(quizData?.length > 0 && (data?.logs?.[0] ? !data?.logs?.[0]?.is_reattempt_left : false)))) ? (
                <Button
                  variant="contained"
                  color="primary"
                  disabled={data?.QuizSetting?.[0]?.reattempts != -1 && (quizData?.length > 0 && (data?.logs?.[0] ? !data?.logs?.[0]?.is_reattempt_left : false))}
                  onClick={() => {

                    setInstruction(true)
                    saveAttempt()
                  }}
                >
                  Start Exam
                </Button>
              ) : (
                <>
                  No attempt left
                </>
              ))
            }

            {types !== 'quiz' && isCompletedCondition && (
              <Button
                variant="contained"
                color="primary"
                disabled={data.logs?.[0]?.is_completed}
                onClick={() => setOpenConfirm(true)}
              >
                Mark as complete
              </Button>
            )}

            {(
              <Button
                variant="outlined"
                color="secondary"
                onClick={() => {

                  endActivity()
                  router.replace(`/${locale}/apps/content?id=${moduleId}&content-folder-id=${contentFolderId}`)
                }
                }
              >
                Exit
              </Button>
            )}

          </CardActions>
        </Card>
      )}

      <SurveyModalComponent open={surveyModalOpen} setOpen={setSurveyModalOpen} moduleId={moduleId} />

      <Dialog open={openConfirm} onClose={() => setOpenConfirm(false)} sx={{ '& .MuiDialog-paper': { overflow: 'visible' } }}>
        <DialogCloseButton onClick={() => setOpenConfirm(false)}><i className="tabler-x" /></DialogCloseButton>
        <DialogTitle>Confirm Completion</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to mark this activity as complete?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenConfirm(false)} color="secondary">Cancel</Button>
          <Button onClick={handleMarkComplete} color="primary" variant="contained">
            Confirm
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ContentData;

