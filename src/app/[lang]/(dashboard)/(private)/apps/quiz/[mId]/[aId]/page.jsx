"use client";

import React, { useEffect, useState } from "react";

import { useRouter, useParams } from "next/navigation";

import { useSession } from "next-auth/react";

import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    FormControlLabel, RadioGroup, Radio, FormControl,
    Box, Button, Typography, Paper, TextField,
    Table, TableBody, TableCell, TableHead, TableRow,
    Select, MenuItem, Checkbox, Alert, Skeleton
} from "@mui/material";

import Grid from "@mui/material/Grid2"

import { toast } from "react-toastify";

import DialogCloseButton from "@/components/dialogs/DialogCloseButton";


const difficultyIcons = {
    Easy: "🌶️",
    Medium: "🌶️🌶️",
    Hard: "🌶️🌶️🌶️",
};

const difficultyMap = {
    1: "Easy",
    2: "Medium",
    3: "Hard",
};

const QueastionQuizPage = () => {
    const router = useRouter();
    const { mId, aId, lang } = useParams();
    const { data: session } = useSession();
    const token = session?.user?.token;
    const API_URL = process.env.NEXT_PUBLIC_API_URL;

    const [openSettings, setOpenSettings] = useState(false);

    const handleOpenSettings = () => setOpenSettings(true);
    const handleCloseSettings = () => setOpenSettings(false);

    const [sections, setSections] = useState([]);
    const [selected, setSelected] = useState({ sectionId: null, questionId: null });
    const [error, setError] = useState("");
    const [editingSectionId, setEditingSectionId] = useState(null);
    const [tempSectionTitle, setTempSectionTitle] = useState("");
    const [loading, setLoading] = useState(false);

    const [orderSetting, setOrderSetting] = useState("sameOrder");

    // Marking Points
    const [points, setPoints] = useState({
        easyCorrect: 1,
        easyWrong: 0,
        mediumCorrect: 2,
        mediumWrong: 0,
        difficultCorrect: 3,
        difficultWrong: 0
    });

    // Pass & Reattempts
    const [passCriteria, setPassCriteria] = useState(1);
    const [reattempts, setReattempts] = useState(1);

    // Timing
    const [timingOption, setTimingOption] = useState("notTimed");
    const [timeValue, setTimeValue] = useState(1);
    const [forwardNav, setForwardNav] = useState(false);

    const [editData, setEditData] = useState()

    // Other Settings (checkboxes)
    const [otherSettings, setOtherSettings] = useState({
        hideResults: false,
        revealAnswers: false,
        isMandatory: false,
        completeOnlyIfPassed: false,
        allowSkipQuestions: false,
        revealCorrectness: false
    });

    const toggleOtherSetting = (key) => {
        setOtherSettings(prev => ({ ...prev, [key]: !prev[key] }));
    };

    // ----------------------------
    // NORMALIZATION HELPERS
    // ----------------------------
    const normalizeNumber = (v) => {
        if (v === "" || v === null || v === undefined) return 0;

        return Number(v);
    };

    const normalizePointNumber = (v) => {
        if (v === "" || v === null || v === undefined) return 0;

        const n = Number(v);
        
        if (isNaN(n)) return 0;        // optional: handle invalid numbers

        return Math.max(0, n);         // clamp to minimum 0
    };

    const normalizeTimeNumber = (v) => {
        const num = Number(v);

        if (!v) return 1;        // empty, null → 1
        if (num < 1) return 1;   // enforce min=1

        return num;
    };

    const preventTimeKeys = (e) => {
        const invalid = ["e", "E", "+", "-", ".", ",", " "];

        if (invalid.includes(e.key)) {
            e.preventDefault();

            return;
        }

        // Block any non-digit key except Backspace
        if (isNaN(Number(e.key)) && e.key !== "Backspace") {
            e.preventDefault();
        }
    };

    const normalNumber = (v) => {
        if (v === "" || v === null || v === undefined) return 0;

        return Number(v);
    };

    const normalizeReattempts = (value) => {
        // If empty, return empty (optional)
        if (value === "") return "";

        const num = Number(value);

        // Allow -1 exactly
        if (num === -1) return -1;

        // Block any number less than -1
        if (num < -1) return -1;

        // Otherwise return non-negative numbers
        if (num >= 0) return Math.floor(num);

        return 0;
    };

    const preventAttemptInvalid = (e) => {
        const invalidKeys = ["e", "E", "+", ",", ".", " "];

        // block invalid characters
        if (invalidKeys.includes(e.key)) {
            e.preventDefault();

            return;
        }

        // Allow only one leading "-",
        // and only if the current value is empty
        if (e.key === "-") {
            if (e.target.value !== "") e.preventDefault();

            return;
        }

        // Block non-numeric characters
        if (isNaN(Number(e.key)) && e.key !== "Backspace") {
            e.preventDefault();
        }
    };



    const onSave = () => {
        const finalData = {
            questionsView: "all",

            // ORDER SETTING (NOW DYNAMIC)
            orderSetting: orderSetting,

            // MARKING VALUES
            marking: {
                easy: {
                    correct: normalizeNumber(points.easyCorrect),
                    wrong: normalizeNumber(points.easyWrong),
                },
                medium: {
                    correct: normalizeNumber(points.mediumCorrect),
                    wrong: normalizeNumber(points.mediumWrong),
                },
                difficult: {
                    correct: normalizeNumber(points.difficultCorrect),
                    wrong: normalizeNumber(points.difficultWrong),
                }
            },

            // PASS CRITERIA
            passCriteria: normalizeNumber(passCriteria),

            // REATTEMPTS
            reattempts: normalizeReattempts(reattempts),

            // TIMING
            timing: {
                type: timingOption,
                duration: timingOption === "overallTime"
                    ? normalizeNumber(timeValue)
                    : 1,
                forwardNav: timingOption === "overallTime" ? forwardNav : false
            },

            // OTHER SETTINGS (ALL TRUE/FALSE)
            otherSettings: {
                hideResults: otherSettings.hideResults,
                revealAnswers: otherSettings.revealAnswers,
                isMandatory: otherSettings.isMandatory,
                completeOnlyIfPassed: otherSettings.completeOnlyIfPassed,
                allowSkipQuestions: otherSettings.allowSkipQuestions,
                revealCorrectness: otherSettings.revealCorrectness
            }
        };

        handleQuizSettingSave(finalData);
    };

    const handleQuizSettingSave = async (data) => {
        try {

            const response = await fetch(`${API_URL}/company/quiz/setting/post/${mId}/${aId}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(data)
            })

            const value = await response.json()

            if (response.ok) {

                toast.success("Quiz setting saved", {
                    autoClose: 1000
                })

                handleCloseSettings();

            }

        } catch (error) {
            throw new Error(error)
        }
    }

    const fetchQuizSetting = async () => {

        try {
            const res = await fetch(`${API_URL}/company/quiz/setting/post/${mId}/${aId}`, {
                method: "GET",
                headers: { Authorization: `Bearer ${token}` }
            });

            const json = await res.json();

            if (res.ok) {

                const value = json?.data;

                setEditData(value)

            }
        } catch (err) {
            setError("Failed to load questions.");
        }
    };

    const fetchQuestion = async (keepSelected = null) => {
        setLoading(true);

        try {
            const res = await fetch(`${API_URL}/company/quiz/question/${mId}/${aId}`, {
                method: "GET",
                headers: { Authorization: `Bearer ${token}` }
            });

            const json = await res.json();

            if (res.ok && Array.isArray(json?.data)) {
                const sectionMap = {};

                json.data.forEach(q => {
                    const sectionName = q.section || "Default Section";

                    if (!sectionMap[sectionName]) {
                        sectionMap[sectionName] = {
                            id: sectionName,
                            title: sectionName,
                            questions: []
                        };
                    }

                    const rawOptions = [
                        q.option1 ?? "",
                        q.option2 ?? "",
                        q.option3 ?? "",
                        q.option4 ?? "",
                        q.option5 ?? "",
                        q.option6 ?? ""
                    ].filter(opt => opt && opt.trim() && opt !== "NULL");

                    const correctAnswers = Array.isArray(q.correct_answer)
                        ? q.correct_answer.map(a => Number(a) - 1)
                        : [];

                    const isMultiple = q.question_type === "Multiple Correct";

                    sectionMap[sectionName].questions.push({
                        _id: q._id,
                        id: q._id,
                        type: q.question_type,
                        difficulty: difficultyMap[q.diffculty] || "Easy",
                        text: q.question,
                        options: rawOptions,
                        correctIndex: isMultiple ? null : correctAnswers[0] ?? null,
                        correctIndices: isMultiple ? correctAnswers : [],
                        explanation: q.answer_explanation || "",
                        useAnswerExplanation: !!q.use_answer_explanation
                    });
                });

                const dynamicSections = Object.values(sectionMap);

                setSections(dynamicSections);

                // Select first question if nothing selected
                if (keepSelected) {
                    const secExists = dynamicSections.find(s => s.id === keepSelected.sectionId);

                    if (secExists) {
                        const questionExists = secExists.questions.find(q => q.id === keepSelected.questionId);

                        if (questionExists) {
                            setSelected({ sectionId: keepSelected.sectionId, questionId: keepSelected.questionId });
                            setLoading(false);

                            return;
                        }
                    }
                }

                if (dynamicSections[0]?.questions?.length) {
                    setSelected({
                        sectionId: dynamicSections[0].id,
                        questionId: dynamicSections[0].questions[0].id
                    });
                } else {
                    setSelected({ sectionId: null, questionId: null });
                }
            }
        } catch (err) {
            setError("Failed to load questions.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (API_URL && token) {

            fetchQuestion();
            fetchQuizSetting()
        }
    }, [API_URL, token]);

    useEffect(() => {
        if (!editData) return;

        // ORDER SETTING
        setOrderSetting(editData.orderSetting || "sameOrder");

        // MARKING
        setPoints({
            easyCorrect: editData.marking?.easy?.correct ?? 1,
            easyWrong: editData.marking?.easy?.wrong ?? 0,
            mediumCorrect: editData.marking?.medium?.correct ?? 2,
            mediumWrong: editData.marking?.medium?.wrong ?? 0,
            difficultCorrect: editData.marking?.difficult?.correct ?? 3,
            difficultWrong: editData.marking?.difficult?.wrong ?? 0
        });

        // PASS CRITERIA
        setPassCriteria(editData.passCriteria ?? 0);

        // REATTEMPTS
        setReattempts(editData.reattempts ?? 0);

        // TIMING
        setTimingOption(editData.timing?.type || "notTimed");
        setTimeValue(editData.timing?.duration || 0);
        setForwardNav(editData.timing?.forwardNav || false);

        // OTHER SETTINGS
        setOtherSettings({
            hideResults: editData.otherSettings?.hideResults ?? false,
            revealAnswers: editData.otherSettings?.revealAnswers ?? false,
            isMandatory: editData.otherSettings?.isMandatory ?? false,
            completeOnlyIfPassed: editData.otherSettings?.completeOnlyIfPassed ?? false,
            allowSkipQuestions: editData.otherSettings?.allowSkipQuestions ?? false,
            revealCorrectness: editData.otherSettings?.revealCorrectness ?? false
        });

    }, [editData]);


    const getSelectedQuestion = () => {
        const sec = sections.find(s => s.id === selected.sectionId);

        return sec?.questions.find(q => q.id === selected.questionId) || null;
    };

    const updateQuestion = (sectionId, questionId, updater) => {
        setSections(prev =>
            prev.map(sec =>
                sec.id === sectionId
                    ? { ...sec, questions: sec.questions.map(q => q.id === questionId ? updater(q) : q) }
                    : sec
            )
        );
    };

    const handleUpdateQuestionField = (sectionId, questionId, key, value) => {
        updateQuestion(sectionId, questionId, q => {
            if (key === "type") {
                if (value === "Multiple Correct") {
                    return { ...q, type: value, correctIndex: null, correctIndices: q.correctIndex != null ? [q.correctIndex] : [] };
                } else {
                    return { ...q, type: value, correctIndex: q.correctIndices[0] ?? null, correctIndices: [] };
                }
            }

            return { ...q, [key]: value };
        });
    };

    const handleSelectOption = (index) => {
        updateQuestion(selected.sectionId, selected.questionId, q => {
            if (q.type === "Single Correct") {
                return { ...q, correctIndex: index, correctIndices: [] };
            } else {
                const set = new Set(q.correctIndices || []);

                set.has(index) ? set.delete(index) : set.add(index);

                return { ...q, correctIndices: Array.from(set), correctIndex: null };
            }
        });
    };

    const handleUpdateOption = (idx, val) => {
        updateQuestion(selected.sectionId, selected.questionId, q => {
            const opts = q.options.map((o, i) => i === idx ? val : o);

            return { ...q, options: opts };
        });
    };

    const handleAddOption = () => {
        updateQuestion(selected.sectionId, selected.questionId, q => {
            if (q.options.length >= 6) return q;

            return { ...q, options: [...q.options, ""] };
        });
    };

    const handleRemoveOption = (idx) => {
        updateQuestion(selected.sectionId, selected.questionId, q => {
            const newOpts = q.options.filter((_, i) => i !== idx);

            return {
                ...q,
                options: newOpts,
                correctIndex: q.correctIndex === idx ? null : q.correctIndex > idx ? q.correctIndex - 1 : q.correctIndex,
                correctIndices: q.correctIndices
                    .filter(i => i !== idx)
                    .map(i => i > idx ? i - 1 : i)
            };
        });
    };

    const handleAddSection = () => {
        const newSection = {
            id: Date.now().toString(),
            title: `Section ${String.fromCharCode(65 + sections.length)}`,
            questions: []
        };

        setSections(prev => [...prev, newSection]);
    };

    const handleAddQuestion = (sectionId) => {
        const newQuestion = {
            id: Date.now(),
            type: "Single Correct",
            difficulty: "Easy",
            text: "",
            options: ["", ""],
            correctIndex: null,
            correctIndices: [],
            explanation: "",
            useAnswerExplanation: false,
        };

        setSections(prev =>
            prev.map(sec => sec.id === sectionId
                ? { ...sec, questions: [...sec.questions, newQuestion] }
                : sec
            )
        );

        setSelected({ sectionId, questionId: newQuestion.id });
    };

    const handleSave = async () => {
        setError("");

        for (let sec of sections) {
            for (let q of sec.questions) {
                if (!q.text.trim()) {
                    setError("Question text cannot be empty.");

                    return;
                }

                const filtered = q.options.filter(o => o.trim());

                if (filtered.length !== q.options.length) {
                    setError("Options cannot be empty.");

                    return;
                }

                if (q.type === "Single Correct" && q.correctIndex == null) {
                    setError("Single Correct question must have one answer selected.");

                    return;
                }

                if (q.type === "Multiple Correct" && (!q.correctIndices || q.correctIndices.length === 0)) {
                    setError("Multiple Correct question must have at least one correct answer.");

                    return;
                }
            }
        }

        try {
            const payload = sections.flatMap(sec =>
                sec.questions.map(q => {
                    const filteredOptions = q.options.filter(o => o.trim());

                    const correctArr =
                        q.type === "Single Correct"
                            ? [q.correctIndex + 1]
                            : q.correctIndices.map(i => i + 1);

                    const diffNum = Number(
                        Object.keys(difficultyMap).find(k => difficultyMap[k] === q.difficulty)
                    ) || 1;

                    return {
                        _id: q._id,
                        section_name: sec.title,
                        question_type: q.type,
                        question: q.text,
                        difficulty: diffNum,
                        options: filteredOptions,
                        correct_answer: correctArr,
                        use_answer_explanation: !!q.useAnswerExplanation,
                        answer_explanation: q.useAnswerExplanation ? (q.explanation || "") : ""
                    };
                })
            );

            const currentSelection = { ...selected };

            const res = await fetch(`${API_URL}/company/quiz/question/${mId}/${aId}`, {
                method: "PUT",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ data: payload })
            });

            if (!res.ok) throw new Error();

            await fetchQuestion(currentSelection);
            toast.success("Quiz saved successfully");
        } catch (err) {
            setError("Save failed, try again.");
        }
    };

    const preventInvalid = (e) => {
        // Block alphabets & symbols
        if (
            ["e", "E", "+", "-", ".", ","].includes(e.key) ||
            isNaN(Number(e.key)) && e.key !== "Backspace"
        ) {
            e.preventDefault();
        }
    };

    const enforceMinOne = (e) => {
        if (e.target.value < 1) e.target.value = 1;
    };

    const enforcePerCriteria = (e) => {
        if (e.target.value < 1) e.target.value = 1;

        if (e.target.value > 100) e.target.value = 100;
    }

    const current = getSelectedQuestion();
    const skeletonCount = 4;

    return (
        <Box display="flex" height="100vh">

            {/* LEFT SIDEBAR */}
            <Box
                flex={1}
                p={2}
                borderRight="1px solid #ddd"
                overflow="auto"
                sx={{ background: "#fafafa" }}
            >
                <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2, p: 1.5 }}>
                    <Button variant="contained" onClick={() => router.replace(`/${lang}/apps/activity/${mId}`)} sx={{ whiteSpace: "nowrap", py: 1 }}>Back</Button>
                    <Button variant="contained" onClick={handleAddSection} sx={{ whiteSpace: "nowrap", py: 1 }}>Add Section</Button>
                    <i
                        className="tabler-settings"
                        style={{ fontSize: "28px", color: "#444", marginLeft: "auto", cursor: "pointer" }}
                        onClick={handleOpenSettings}
                    />
                </Box>

                {loading && sections.length === 0 ? (
                    [...Array(skeletonCount)].map((_, i) => (
                        <Box key={i} mb={2}>
                            <Skeleton variant="text" width="60%" height={30} />
                            {[...Array(2)].map((__, j) => (
                                <Skeleton key={j} variant="rectangular" height={40} sx={{ mt: 1 }} />
                            ))}
                        </Box>
                    ))
                ) : (
                    sections.map((section) => {
                        const isEditing = editingSectionId === section.id;

                        return (
                            <Paper key={section.id} sx={{ p: 2, mb: 2, borderRadius: "10px", boxShadow: "0 1px 4px rgba(0,0,0,0.1)" }}>
                                {!isEditing ? (
                                    <Box display="flex" alignItems="center" justifyContent="space-between">
                                        <Typography fontWeight="bold">{section.title}</Typography>
                                        <Button size="small" onClick={() => { setEditingSectionId(section.id); setTempSectionTitle(section.title); }}>Edit</Button>
                                    </Box>
                                ) : (
                                    <Box display="flex" gap={1}>
                                        <TextField size="small" value={tempSectionTitle} onChange={(e) => setTempSectionTitle(e.target.value)} fullWidth autoFocus />
                                        <Button size="small" variant="contained" onClick={() => { setSections(prev => prev.map(s => s.id === section.id ? { ...s, title: tempSectionTitle.trim() || section.title } : s)); setEditingSectionId(null); }}>Save</Button>
                                        <Button size="small" variant="outlined" onClick={() => setEditingSectionId(null)}>Cancel</Button>
                                    </Box>
                                )}

                                {section.questions.map((q, idx) => (
                                    <Paper
                                        key={q.id}
                                        sx={{
                                            p: 1,
                                            mt: 1,
                                            cursor: "pointer",
                                            borderRadius: "6px",
                                            bgcolor: selected.sectionId === section.id && selected.questionId === q.id ? "#e3f2fd" : "#fff",
                                            transition: "0.2s",
                                            ":hover": { bgcolor: selected.sectionId === section.id && selected.questionId === q.id ? "#e3f2fd" : "#f5f5f5" }
                                        }}
                                        onClick={() => setSelected({ sectionId: section.id, questionId: q.id })}
                                    >
                                        <Typography variant="caption">{q.type} {difficultyIcons[q.difficulty]} {q.difficulty}</Typography>
                                        <Typography>{`${idx + 1}. ${q.text}`}</Typography>
                                    </Paper>
                                ))}

                                <Button size="small" variant="outlined" sx={{ mt: 1 }} onClick={() => handleAddQuestion(section.id)}>Add Question</Button>
                            </Paper>
                        );
                    })
                )}
            </Box>

            {/* RIGHT SIDE EDITOR */}
            <Box flex={2} p={2} overflow="auto">
                {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

                {loading && sections.length === 0 ? (
                    <Box>
                        <Skeleton variant="text" width="40%" height={40} />
                        <Skeleton variant="rectangular" height={150} sx={{ mt: 2 }} />
                        <Skeleton variant="text" width="30%" height={30} sx={{ mt: 2 }} />
                    </Box>
                ) : current ? (
                    <Paper sx={{ p: 2 }}>
                        <Typography variant="h6">Edit Question</Typography>

                        <Select size="small" value={current.type} onChange={(e) => handleUpdateQuestionField(selected.sectionId, selected.questionId, "type", e.target.value)} sx={{ mt: 2 }}>
                            <MenuItem value="Single Correct">Single Correct</MenuItem>
                            <MenuItem value="Multiple Correct">Multiple Correct</MenuItem>
                        </Select>

                        <TextField fullWidth multiline rows={2} value={current.text} onChange={(e) => handleUpdateQuestionField(selected.sectionId, selected.questionId, "text", e.target.value)} sx={{ mt: 2 }} placeholder="Enter question text" />

                        <Typography sx={{ mt: 2 }}>Difficulty {difficultyIcons[current.difficulty]}</Typography>
                        <Select size="small" value={current.difficulty} onChange={(e) => handleUpdateQuestionField(selected.sectionId, selected.questionId, "difficulty", e.target.value)}>
                            <MenuItem value="Easy">Easy</MenuItem>
                            <MenuItem value="Medium">Medium</MenuItem>
                            <MenuItem value="Hard">Hard</MenuItem>
                        </Select>

                        <Typography sx={{ mt: 2 }}>Options</Typography>
                        {current.options.map((opt, i) => {
                            const checked = current.type === "Single Correct" ? current.correctIndex === i : (current.correctIndices || []).includes(i);

                            return (
                                <Box key={i} display="flex" alignItems="center" gap={1} mt={1}>
                                    <Checkbox checked={checked} onChange={() => handleSelectOption(i)} />
                                    <TextField value={opt} onChange={(e) => handleUpdateOption(i, e.target.value)} fullWidth placeholder={`Option ${i + 1}`} />
                                    <Button color="error" onClick={() => handleRemoveOption(i)}>Delete</Button>
                                </Box>
                            );
                        })}
                        <Button onClick={handleAddOption} sx={{ mt: 1 }}>Add Option</Button>

                        <Box mt={3} display="flex" alignItems="center" gap={1}>
                            <Checkbox checked={current.useAnswerExplanation} onChange={(e) => handleUpdateQuestionField(selected.sectionId, selected.questionId, "useAnswerExplanation", e.target.checked)} />
                            <Typography>Use Answer Explanation</Typography>
                        </Box>

                        {current.useAnswerExplanation && (
                            <TextField fullWidth multiline rows={3} value={current.explanation} onChange={(e) => handleUpdateQuestionField(selected.sectionId, selected.questionId, "explanation", e.target.value)} sx={{ mt: 2 }} placeholder="Enter explanation" />
                        )}
                    </Paper>
                ) : (
                    <Typography>Select a question to edit</Typography>
                )}

                <Dialog
                    open={openSettings}
                    onClose={handleCloseSettings}
                    fullWidth
                    maxWidth="xl"
                    sx={{ "& .MuiDialog-paper": { overflow: "visible" } }}
                >

                    <DialogCloseButton onClick={handleCloseSettings}><i className="tabler-x" /></DialogCloseButton>
                    <DialogTitle>Quiz Setting</DialogTitle>

                    <DialogContent sx={{ pt: 2 }}>

                        {/* How Do Learners See Questions */}
                        <Typography variant="subtitle1" fontWeight={600} mb={1}>
                            How Do Learners See Questions
                        </Typography>

                        <RadioGroup
                            value={orderSetting}
                            onChange={(e) => setOrderSetting(e.target.value)}
                            sx={{ ml: 2, mb: 3 }}
                        >
                            <FormControlLabel
                                value="sameOrder"
                                control={<Radio />}
                                label="All Users see the Same Questions in Same Order"
                            />
                            <FormControlLabel
                                value="differentOrder"
                                control={<Radio />}
                                label="All Users see the Same Questions in Different Order"
                                sx={{ display: "block", mt: 1 }}
                            />
                        </RadioGroup>

                        {/* Marking Table */}
                        <Typography variant="subtitle1" fontWeight={600} mb={2}>
                            Desired Marking Scheme
                        </Typography>

                        <Box
                            sx={{
                                width: 420,
                                border: "1px solid #ccc",
                                borderRadius: 1,
                                p: 2,
                                mb: 3
                            }}
                        >
                            <Table>
                                <TableHead>
                                    <TableRow>
                                        <TableCell></TableCell>
                                        <TableCell>
                                            <Typography fontWeight={500}>Points for Correct</Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Typography fontWeight={500}>Points for Wrong</Typography>
                                        </TableCell>
                                    </TableRow>
                                </TableHead>

                                <TableBody>

                                    {/* EASY */}
                                    <TableRow>
                                        <TableCell>Easy</TableCell>
                                        <TableCell>
                                            <TextField
                                                size="small"
                                                type="number"
                                                fullWidth
                                                value={points.easyCorrect}
                                                onChange={(e) =>
                                                    setPoints({ ...points, easyCorrect: normalizePointNumber(e.target.value) })
                                                }

                                            />
                                        </TableCell>

                                        <TableCell>
                                            <TextField
                                                size="small"
                                                type="number"
                                                fullWidth
                                                value={points.easyWrong}
                                                onChange={(e) =>
                                                    setPoints({ ...points, easyWrong: normalizePointNumber(e.target.value) })
                                                }
                                            />
                                        </TableCell>
                                    </TableRow>

                                    {/* MEDIUM */}
                                    <TableRow>
                                        <TableCell>Medium</TableCell>
                                        <TableCell>
                                            <TextField
                                                size="small"
                                                type="number"
                                                fullWidth
                                                value={points.mediumCorrect}
                                                onChange={(e) =>
                                                    setPoints({ ...points, mediumCorrect: normalizeNumber(e.target.value) })
                                                }
                                            />
                                        </TableCell>

                                        <TableCell>
                                            <TextField
                                                size="small"
                                                type="number"
                                                fullWidth
                                                value={points.mediumWrong}
                                                onChange={(e) =>
                                                    setPoints({ ...points, mediumWrong: normalizeNumber(e.target.value) })
                                                }
                                            />
                                        </TableCell>
                                    </TableRow>

                                    {/* DIFFICULT */}
                                    <TableRow>
                                        <TableCell>Difficult</TableCell>
                                        <TableCell>
                                            <TextField
                                                size="small"
                                                type="number"
                                                fullWidth
                                                value={points.difficultCorrect}
                                                onChange={(e) =>
                                                    setPoints({ ...points, difficultCorrect: normalizeNumber(e.target.value) })
                                                }
                                            />
                                        </TableCell>

                                        <TableCell>
                                            <TextField
                                                size="small"
                                                type="number"
                                                fullWidth
                                                value={points.difficultWrong}
                                                onChange={(e) =>
                                                    setPoints({ ...points, difficultWrong: normalizeNumber(e.target.value) })
                                                }
                                            />
                                        </TableCell>
                                    </TableRow>

                                </TableBody>
                            </Table>
                        </Box>

                        {/* Pass & Reattempts */}
                        <Box mb={3}>
                            <Grid container spacing={2} alignItems="center">
                                <Grid item>
                                    <Typography fontWeight={500}>Pass Criteria</Typography>
                                </Grid>
                                <Grid item>
                                    <TextField
                                        size="small"
                                        type="number"
                                        sx={{ width: 70 }}
                                        value={passCriteria}
                                        onChange={(e) => {
                                            enforcePerCriteria(e);
                                            setPassCriteria(normalNumber(e.target.value));
                                        }}
                                        onKeyDown={preventInvalid}
                                    />
                                </Grid>
                                <Grid item>
                                    <Typography>% of total marks</Typography>
                                </Grid>
                            </Grid>

                            <Grid container spacing={2} alignItems="center" mt={2}>
                                <Grid item>
                                    <Typography fontWeight={500}>Allow for</Typography>
                                </Grid>
                                <Grid item>
                                    <TextField
                                        size="small"
                                        type="number"
                                        sx={{ width: 70 }}
                                        value={reattempts}
                                        onChange={(e) => setReattempts(normalizeReattempts(e.target.value))}
                                        onKeyDown={preventAttemptInvalid}
                                    />
                                </Grid>
                                <Grid item>
                                    <Typography>reattempts (-1 for any number of attempts)</Typography>
                                </Grid>
                            </Grid>
                        </Box>

                        {/* Quiz Timing */}
                        <Typography variant="subtitle1" fontWeight={600} mb={1}>
                            Quiz Timing
                        </Typography>

                        <RadioGroup
                            value={timingOption}
                            onChange={(e) => setTimingOption(e.target.value)}
                            sx={{ ml: 2, mb: 3 }}
                        >
                            <FormControlLabel value="notTimed" control={<Radio />} label="Not timed" />

                            <Box mt={1}>
                                <Grid container alignItems="center">
                                    <Grid item>
                                        <FormControlLabel value="overallTime" control={<Radio />} label="Overall time of" />
                                    </Grid>
                                    <Grid item>
                                        <TextField
                                            size="small"
                                            type="number"
                                            sx={{ width: 70 }}
                                            value={timeValue}
                                            onChange={(e) => setTimeValue(normalizeTimeNumber(e.target.value))}
                                            disabled={timingOption !== "overallTime"}
                                            onKeyDown={preventTimeKeys}
                                        />
                                    </Grid>
                                    <Grid item sx={{ ml: 1 }}>
                                        <Typography>Minutes</Typography>
                                    </Grid>
                                </Grid>
                            </Box>
                        </RadioGroup>

                        <FormControlLabel
                            control={
                                <Checkbox
                                    checked={forwardNav}
                                    onChange={(e) => setForwardNav(e.target.checked)}
                                    disabled={timingOption !== "overallTime"}
                                />
                            }
                            label="Allow only forward navigation"
                            sx={{ ml: 4, mt: 1 }}
                        />

                        {/* Other Settings */}
                        <Typography variant="subtitle1" fontWeight={600} mb={1}>
                            Other Settings
                        </Typography>

                        <Box ml={2}>
                            <FormControlLabel
                                control={<Checkbox checked={otherSettings.hideResults} onChange={() => toggleOtherSetting("hideResults")} />}
                                label="Hide results from participants"
                            />

                            <FormControlLabel
                                control={<Checkbox checked={otherSettings.revealAnswers} onChange={() => toggleOtherSetting("revealAnswers")} />}
                                label="Reveal answers on submission"
                            />

                            <FormControlLabel
                                control={<Checkbox checked={otherSettings.isMandatory} onChange={() => toggleOtherSetting("isMandatory")} />}
                                label="Quiz is mandatory"
                            />

                            <FormControlLabel
                                control={<Checkbox checked={otherSettings.completeOnlyIfPassed} onChange={() => toggleOtherSetting("completeOnlyIfPassed")} />}
                                label="Consider quiz complete only if passed"
                            />

                            <FormControlLabel
                                control={<Checkbox checked={otherSettings.allowSkipQuestions} onChange={() => toggleOtherSetting("allowSkipQuestions")} />}
                                label="Allow submission without answering all questions"
                            />

                            <FormControlLabel
                                control={<Checkbox checked={otherSettings.revealCorrectness} onChange={() => toggleOtherSetting("revealCorrectness")} />}
                                label="Reveal correctness of selected option"
                            />
                        </Box>

                    </DialogContent>

                    <DialogActions sx={{ display: "flex", justifyContent: "center" }}>
                        <Button variant="contained" onClick={onSave}>Save</Button>
                        <Button variant="outlined" onClick={handleCloseSettings}>Close</Button>
                    </DialogActions>
                </Dialog>

                <Button variant="contained" color="success" sx={{ mt: 2 }} onClick={handleSave}>Save</Button>
            </Box>
        </Box >
    );
};

export default QueastionQuizPage;
