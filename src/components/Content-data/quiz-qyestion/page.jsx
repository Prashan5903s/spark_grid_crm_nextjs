'use client';

import React, { useEffect, useState, useRef } from "react";

import { useRouter, useParams, useSearchParams } from "next/navigation";

import {
  CardContent, Box, Paper, Typography, Button, Checkbox,
  Card, Stack, Divider, Skeleton, Dialog, DialogTitle,
  DialogContent, DialogActions
} from "@mui/material";

import Grid from "@mui/material/Grid2";

import { useTheme } from "@mui/material/styles";

import { toast } from "react-toastify";

import DefaultInstruction from "@/components/QuizInstruction/page";
import DialogCloseButton from '@/components/dialogs/DialogCloseButton';

const formatDate = (date) => {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const QuizStaticLayout = ({
  data = [],
  report = [],
  setQuizData = () => { },
  status = false,
  quizSetting,
  isInstruction = false,
  log,
  saveInsertQuizData = async () => ({ ok: false }),
  setSurveyModalOpen
}) => {
  const theme = useTheme();
  const { lang: locale } = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();

  const attemptedRef = useRef([]);

  const moduleId = searchParams.get('moduleId');
  const contentFolderId = searchParams.get('contentFolderId');

  const [timeLeft, setTimeLeft] = useState(null);
  const timerRef = useRef(null);

  const [questions, setQuestions] = useState(null);
  const [sections, setSections] = useState([]);
  const [index, setIndex] = useState(0);
  const [attempted, setAttempted] = useState([]);
  const lastSentRef = useRef(null);
  const explicitSaveTimer = useRef(null);

  const [confirmOpen, setConfirmOpen] = useState(false);

  useEffect(() => {
    attemptedRef.current = attempted;
  }, [attempted]);

  useEffect(() => {
    if (quizSetting?.timing?.type === "overallTime" && isInstruction) {
      const durationInMs = quizSetting.timing.duration * 60 * 1000;

      setTimeLeft(durationInMs);

      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1000) {
            clearInterval(timerRef.current);
            handleSave();

            return 0;
          }

          return prev - 1000;
        });
      }, 1000);
    }

    return () => clearInterval(timerRef.current);
  }, [quizSetting?.timing, isInstruction]);

  const formatTimer = ms => {
    if (ms === null) return "";
    const totalSeconds = Math.floor(ms / 1000);
    const m = String(Math.floor(totalSeconds / 60)).padStart(2, "0");
    const s = String(totalSeconds % 60).padStart(2, "0");


    return `${m}:${s}`;
  };

  const buildMarks = () => ({
    1: {
      correct: quizSetting?.marking?.easy?.correct ?? 1,
      wrong: -(quizSetting?.marking?.easy?.wrong ?? 0)
    },
    2: {
      correct: quizSetting?.marking?.medium?.correct ?? 2,
      wrong: -(quizSetting?.marking?.medium?.wrong ?? 0)
    },
    3: {
      correct: quizSetting?.marking?.difficult?.correct ?? 3,
      wrong: -(quizSetting?.marking?.difficult?.wrong ?? 0)
    }
  });

  const scoreSingleCorrect = (question, selectedOneBased, marks) => {
    const difficulty = Number(question.difficulty) || 1;
    const { correct, wrong } = marks[difficulty] || marks[1];

    if (!Array.isArray(selectedOneBased) || selectedOneBased.length === 0) return 0;
    const correctAnswer = Number((question.correct_answer || [])[0]);

    return Number(selectedOneBased[0]) === correctAnswer ? correct : wrong;
  };

  const scoreMultipleCorrect = (question, selectedOneBased, marks) => {
    const difficulty = Number(question.difficulty) || 1;
    const { correct, wrong } = marks[difficulty] || marks[1];
    const correctAnswers = (question.correct_answer || []).map(Number);
    const selected = (selectedOneBased || []).map(Number);

    for (const s of selected) {
      if (!correctAnswers.includes(s)) return wrong;
    }

    const selectedSet = new Set(selected);
    const correctSet = new Set(correctAnswers);

    const fullCorrect =
      selectedSet.size === correctSet.size &&
      [...correctSet].every(v => selectedSet.has(v));

    if (fullCorrect) return correct;

    return 0;
  };

  const calculateScore = (question, selectedOneBased, marks) => {
    const type = (question.question_type || "Single Correct").toLowerCase();

    if (type.includes("multiple")) {
      return scoreMultipleCorrect(question, selectedOneBased, marks);
    }

    return scoreSingleCorrect(question, selectedOneBased, marks);
  };

  useEffect(() => {
    if (!Array.isArray(data) || data.length === 0) {
      setQuestions(null);
      setSections([]);
      setAttempted([]);

      return;
    }

    const marks = buildMarks();

    let processed = [...data];

    if (quizSetting?.orderSetting === "differentOrder") {

      processed = processed.sort(() => Math.random() - 0.5);
    }

    const mapped = processed.map(q => {
      const fromReport = Array.isArray(report)
        ? report.find(r => r.question_id === q._id)
        : null;

      const correct_answer = Array.isArray(q.correct_answer)
        ? q.correct_answer.map(n => Number(n)).filter(Number.isFinite)
        : [Number(q.correct_answer)].filter(Number.isFinite);

      const difficulty = Number(q.diffculty ?? q.difficulty ?? 1);

      const total_mark =
        (marks[difficulty] && marks[difficulty].correct) ??
        marks[1].correct;

      let selectedOne = [];

      if (fromReport) {
        if (Array.isArray(fromReport.selected_option_no)) {
          selectedOne = fromReport.selected_option_no
            .map(n => Number(n))
            .filter(Number.isFinite);
        } else if (fromReport.selected_option_no != null) {
          const num = Number(fromReport.selected_option_no);

          if (Number.isFinite(num)) selectedOne = [num];
        }
      }

      const mark = calculateScore(
        {
          difficulty,
          question_type: q.question_type,
          correct_answer
        },
        selectedOne,
        marks
      );

      const selectedZero = selectedOne
        .map(n => n - 1)
        .filter(n => Number.isFinite(n) && n >= 0);

      return {
        id: q._id,
        text: q.question,
        section: q.section || "Misc",
        question_type: q.question_type || "Single Correct",
        difficulty,
        total_mark,
        correct_answer,
        options: [
          q.option1,
          q.option2,
          q.option3,
          q.option4,
          q.option5,
          q.option6
        ].filter(Boolean),
        selected: selectedZero,
        mark
      };
    });

    const groups = {};

    mapped.forEach(q => {
      if (!groups[q.section]) groups[q.section] = [];
      groups[q.section].push(q);
    });

    const sectionArr = Object.keys(groups).map(sec => ({
      section: sec,
      items: groups[sec]
    }));

    setSections(sectionArr);

    const flat = sectionArr.flatMap(s => s.items);

    setQuestions(flat);
    setIndex(0);

    const initialAttempts = mapped
      .filter(q => Array.isArray(q.selected) && q.selected.length > 0)
      .map(q => ({
        question_id: q.id,
        selected_option_no: q.selected.map(n => String(n + 1)),
        is_correct: q.mark > 0,
        mark: q.mark,
        total_mark: q.total_mark
      }));

    setAttempted(initialAttempts);


  }, [
    data,
    report,
    quizSetting?.orderSetting,
    quizSetting?.marking
  ]);

  /** Keep Parent Synced with attempted */
  useEffect(() => {
    try {
      const serialized = JSON.stringify(attempted || []);

      if (lastSentRef.current !== serialized) {
        setQuizData(attempted);
        lastSentRef.current = serialized;
      }
    } catch {
      setQuizData(attempted);
    }
  }, [attempted]);

  /** Helpers */
  const isQuestionAttempted = (questionId) => {
    const att = attempted.find(a => a.question_id === questionId);

    if (!att) return false;

    return Array.isArray(att.selected_option_no) && att.selected_option_no.length > 0;
  };

  const areAllQuestionsAttempted = () => {
    if (!Array.isArray(questions)) return false;

    return questions.every(q => isQuestionAttempted(q.id));
  };

  /** Select Option */
  const handleSelectOption = optionIndex => {

    if (status) return;

    if (!questions) return;

    setQuestions(prev => {

      if (!prev) return prev;

      const updated = [...prev];
      const q = updated[index];

      if (!q) return updated;

      let newSelectedZero = [];

      if ((q.question_type || "").toLowerCase().includes("multiple")) {
        const set = new Set(q.selected || []);

        if (set.has(optionIndex)) set.delete(optionIndex);
        else set.add(optionIndex);
        newSelectedZero = [...set].sort((a, b) => a - b);
      } else {
        newSelectedZero = [optionIndex];
      }

      updated[index] = { ...q, selected: newSelectedZero };

      const selectedOne = newSelectedZero.map(n => n + 1);

      const marks = buildMarks();

      const scoringQuestion = {
        difficulty: q.difficulty ?? 1,
        question_type: q.question_type,
        correct_answer: q.correct_answer
      };

      const mark = calculateScore(scoringQuestion, selectedOne, marks);

      setAttempted(prevAtt => {
        const filtered = prevAtt.filter(a => a.question_id !== q.id);

        if (selectedOne.length === 0) {

          return filtered;
        }

        filtered.push({
          question_id: q.id,
          selected_option_no: selectedOne.map(String),
          is_correct: mark > 0,
          mark,
          total_mark: q.total_mark
        });

        return filtered;
      });

      return updated;
    });
  };

  const handleSave = async () => {
    if (explicitSaveTimer.current) clearTimeout(explicitSaveTimer.current);

    explicitSaveTimer.current = setTimeout(async () => {
      const res = await saveInsertQuizData(attemptedRef.current); // use ref

      if (res?.ok) {

        if (res?.data?.completed) {

          setSurveyModalOpen(res?.data?.completed)

          return;
        }

        toast.success("Quiz completed successfully!", { autoClose: 1000 });
        router.push(`/${locale}/apps/content?id=${moduleId}&content-folder-id=${contentFolderId}`);
      } else {
        toast.error("Failed to save quiz. Please try again.");
      }
    }, 300);
  };

  const loading = !questions;
  const colorTextSecondary = theme.palette.text.secondary;
  const bg = theme.palette.mode === "dark" ? "#121212" : "#fafafa";
  const panelBg = theme.palette.mode === "dark" ? "#1e1e1e" : "#fff";
  const borderColor = theme.palette.mode === "dark" ? "#333" : "#ddd";

  const otherSettings = quizSetting?.otherSettings || {};
  const allowSkipQuestions = otherSettings.allowSkipQuestions !== undefined ? otherSettings.allowSkipQuestions : true;
  const isMandatory = otherSettings.isMandatory !== undefined ? otherSettings.isMandatory : false;

  if (!isInstruction) {

    return (
      <IntroductionSet
        log={log}
        quizSetting={quizSetting}
        data={data}
      />
    );
  }

  return (
    <>
      <Dialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        sx={{ '& .MuiDialog-paper': { overflow: 'visible' } }}
      >
        <DialogCloseButton onClick={() => setConfirmOpen(false)}><i className="tabler-x" /></DialogCloseButton>

        <DialogTitle>Confirm Save</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to save?</Typography>
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setConfirmOpen(false)}>Cancel</Button>
          <Button
            onClick={() => {
              setConfirmOpen(false);
              handleSave();
            }}
            variant="contained"
            color="success"
          >
            Confirm
          </Button>
        </DialogActions>
      </Dialog>

      <Box display="flex" flexDirection={{ xs: "column", md: "row" }} height="50vh" bgcolor={bg}>

        <Box
          flex={1}
          p={2}
          borderRight={`1px solid ${borderColor}`}
          sx={{ overflowY: "auto", backgroundColor: panelBg }}
        >
          <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
            Questions
          </Typography>

          {loading ? (
            <Skeleton height={100} />
          ) : (
            sections.map(sec => (
              <Box key={sec.section} sx={{ mb: 3 }}>
                <Typography fontWeight="bold" sx={{ mb: 1 }}>
                  {sec.section}
                </Typography>

                {sec.items.map(q => {
                  const idx = questions.findIndex(qq => qq.id === q.id);

                  const handleClickQuestion = () => {

                    if (!allowSkipQuestions) {

                      if (idx === index) {

                        setIndex(idx);

                        return;
                      }

                      const targetAttempted = isQuestionAttempted(q.id);

                      if (!targetAttempted && !isQuestionAttempted(questions[index].id)) {
                        toast.warn("Please attempt the current question before moving to another question.");

                        return;
                      }
                    }

                    setIndex(idx);
                  };

                  return (
                    <Paper
                      key={q.id}
                      elevation={idx === index ? 6 : 1}
                      sx={{
                        p: 2,
                        mb: 1,
                        cursor: "pointer",
                        borderRadius: 2,
                        backgroundColor:
                          idx === index
                            ? theme.palette.action.selected
                            : panelBg,
                      }}
                      onClick={handleClickQuestion}
                    >
                      <Typography fontWeight="600">{`Q${idx + 1}`}</Typography>
                      <Typography variant="body2" color={colorTextSecondary} noWrap>
                        {q.text}
                      </Typography>
                    </Paper>
                  );
                })}
              </Box>
            ))
          )}
        </Box>

        <Box flex={2} p={3} sx={{ overflowY: "auto" }}>
          {!loading && (
            <>
              <Box
                display="flex"
                justifyContent="space-between"
                alignItems="center"
                sx={{ mb: 1 }}
              >
                <Typography variant="h5" fontWeight="bold">
                  Question {index + 1}
                </Typography>

                {isInstruction && quizSetting?.timing?.type === "overallTime" && (
                  <Box
                    sx={{
                      px: 2,
                      py: 1,
                      borderRadius: "999px",
                      fontWeight: "bold",
                      fontSize: "1.1rem",
                      display: "flex",
                      alignItems: "center",
                      gap: 1.2,
                      boxShadow: "0 0 8px rgba(0,0,0,0.15)",
                      color: timeLeft < 30000 ? "#fff" : theme.palette.text.primary,
                      backgroundColor:
                        timeLeft < 30000 ? "#ff1744" : theme.palette.mode === "dark" ? "#333" : "#e0e0e0",
                      transition: "all 0.3s ease",
                      animation:
                        timeLeft < 30000
                          ? "pulse 1s infinite"
                          : "none",
                      "@keyframes pulse": {
                        "0%": { transform: "scale(1)" },
                        "50%": { transform: "scale(1.05)" },
                        "100%": { transform: "scale(1)" }
                      }
                    }}
                  >
                    <i className="tabler-clock" style={{ fontSize: "20px" }} />
                    {formatTimer(timeLeft)}
                  </Box>
                )}
              </Box>

              <Divider sx={{ my: 2 }} />
            </>
          )}

          {!loading && (
            <Typography sx={{ fontSize: 18, whiteSpace: "pre-line" }}>
              {questions[index]?.text}
            </Typography>
          )}

          <Typography sx={{ fontSize: 14, color: colorTextSecondary }}>
            Type: <b>{questions?.[index]?.question_type}</b> &nbsp; | &nbsp;
            Total Marks: <b>{questions?.[index]?.total_mark ?? "—"}</b>
          </Typography>

          {!loading && (
            <>
              <Typography sx={{ mt: 3, fontWeight: "bold" }}>Options</Typography>

              <Stack spacing={2} mt={2}>
                {questions[index].options.map((opt, i) => (
                  <Box
                    key={i}
                    display="flex"
                    alignItems="center"
                    gap={1}
                    sx={{
                      p: 1,
                      borderRadius: 1,
                      backgroundColor: questions[index].selected.includes(i)
                        ? theme.palette.action.selected
                        : "transparent"
                    }}
                  >
                    <Checkbox
                      checked={questions[index].selected.includes(i)}
                      onChange={() => handleSelectOption(i)}
                      disabled={status}
                    />
                    <Typography>{opt}</Typography>
                  </Box>
                ))}
              </Stack>
            </>
          )}

          <Box display="flex" justifyContent="space-between" mt={4}>
            <Button
              variant="outlined"
              onClick={() => setIndex(i => Math.max(0, i - 1))}
              disabled={index === 0}
            >
              Previous
            </Button>

            <Stack direction="row" spacing={2}>
              <Button
                variant="contained"
                onClick={() => {
                  if (!allowSkipQuestions) {
                    const currentQ = questions?.[index];

                    if (!currentQ) return;

                    if (!isQuestionAttempted(currentQ.id)) {
                      toast.warn("Please attempt the current question before moving to the next question.");

                      return;
                    }
                  }

                  setIndex(i => Math.min(questions?.length - 1, i + 1));
                }}
                disabled={index === questions?.length - 1}
              >
                Next
              </Button>

              <Button
                variant="contained"
                color="success"
                onClick={() => {
                  if (isMandatory && !areAllQuestionsAttempted()) {
                    toast.warn("You must attempt all questions before saving this mandatory quiz.");

                    return;
                  }

                  setConfirmOpen(true);
                }}
              >
                Save
              </Button>
            </Stack>
          </Box>
        </Box>
      </Box>
    </>
  );
};

const IntroductionSet = ({ log, quizSetting, data }) => {

  return (
    <Grid container spacing={6}>
      <Grid item size={{ xs: 12 }}>
        <Card>
          <CardContent>
            <Typography variant='h5' className='mbe-2'>
              {log?.name || "Objective Quiz"}
            </Typography>
            <Grid container>
              <Grid item size={{ xs: 12, sm: 6 }} className='flex flex-col pie-5 gap-[26px]'>
                <div className='flex items-center gap-2.5'>
                  <div className='flex'>
                    <i className='tabler-clock text-xl text-textSecondary' />
                  </div>
                  <Typography color='text.secondary'>{quizSetting?.timing?.type === "overallTime" ? `Exam Duration: ${quizSetting?.timing?.duration} Minutes` : "Unlimited"}</Typography>
                </div>
                <div className='flex items-center gap-2.5'>
                  <div className='flex'>
                    <i className='tabler-calendar-time text-xl text-textSecondary' />
                  </div>
                  <Typography color='text.secondary'>Current Date Time: {formatDate(Date.now())}</Typography>
                </div>
              </Grid>
              <Grid item size={{ xs: 12, sm: 6 }} className='flex flex-col max-sm:mbs-[26px] sm:pis-5 sm:border-is gap-[26px]'>
                <div className='flex items-center gap-2.5'>
                  <div className='flex'>
                    <i className='tabler-align-left text-xl text-textSecondary' />
                  </div>
                  <Typography color='text.secondary'>Total Questions: {data?.length}</Typography>
                </div>
                <div className='flex items-center gap-2.5'>
                  <div className='flex'>
                    <i className='tabler-calendar-time text-xl text-textSecondary' />
                  </div>
                  <Typography color='text.secondary'>Remaining Attempts: {quizSetting?.reattempts == -1 ? "Unlimited" : (log?.logs?.length == 0 ? (quizSetting?.reattempts) : (log?.logs?.[0]?.attempt_left))}</Typography>
                </div>
              </Grid>
            </Grid>
            <Divider className='mbs-7 mbe-7' />
            <Typography variant='h5' className='mbe-2'>Instructions</Typography>
            <Grid item size={{ xs: 12 }}><DefaultInstruction /></Grid>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
};

export default QuizStaticLayout;
