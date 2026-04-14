'use client'

import crypto from "crypto";

import { useEffect, useState, useMemo, useCallback } from "react"

import { useRouter, useParams } from "next/navigation"

import Error from "next/error"

import { useSession } from "next-auth/react"

import classnames from 'classnames'

import {
    Box,
    Button,
    Card,
    Paper,
    Dialog,
    Chip,
    Skeleton,
    useTheme,
    useMediaQuery,
    DialogActions,
    Select,
    CardContent,
    Table,
    TableHead,
    Avatar,
    FormControlLabel,
    Radio,
    TableRow,
    RadioGroup,
    Checkbox,
    Typography,
    IconButton,
    TextField,
    DialogTitle,
    MenuItem,
    TableCell,
    TableBody,
    Tab,
    DialogContent,
    CircularProgress,
} from '@mui/material'

import Grid from '@mui/material/Grid2'

import { useDropzone } from 'react-dropzone'

import { valibotResolver } from '@hookform/resolvers/valibot'

import {
    object,
    string,
    pipe,
    maxLength,
    minLength,
    regex
} from 'valibot'

import {
    createColumnHelper,
    flexRender,
    getCoreRowModel,
    useReactTable,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel
} from '@tanstack/react-table'

import { useForm, Controller, set } from 'react-hook-form'

import { TabContext, TabList, TabPanel } from "@mui/lab"

import { toast } from "react-toastify"

import ExcelJS from "exceljs";

import { LocalizationProvider } from '@mui/x-date-pickers';

import dayjs from "dayjs";

import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';

import { DatePicker, TimePicker } from "@mui/x-date-pickers";

import "react-datepicker/dist/react-datepicker.css";

import tableStyles from '@core/styles/table.module.css'

import TablePaginationComponent from '@components/TablePaginationComponent'

import PermissionGuard from "@/hocs/PermissionClientGuard"

import DialogCloseButton from "@/components/dialogs/DialogCloseButton"

import CustomTextField from "@/@core/components/mui/TextField"

const assert_url = process.env.NEXT_PUBLIC_ASSETS_URL || ''
const API_URL = process.env.NEXT_PUBLIC_API_URL;

const QUESTION_TYPES = [
    { label: 'Yes or No', value: '1' },
    { label: 'Rating (1–5)', value: '2' },
    { label: 'Rating (1–10)', value: '3' },
    { label: 'Rating (1–5) - Emoji', value: '4' },
    { label: 'Rating (1–5) - Star', value: '5' },
    { label: 'Subjective Answer', value: '6' },
    { label: 'Multiple Choice', value: '7' },
    { label: 'Likert Scale', value: '8' },
    { label: 'Satisfaction Scale', value: '9' },
    { label: 'Quality Scale', value: '10' },
]

const labelOption = {
    "7": "Define your custom options",
    "8": "Define your Likert scale",
    "9": "Define your Satisfaction scale",
    "10": "Define your Quality scale"
}

const MAX_PAIRS = 5;

const OPTION_BASED_TYPES = ['7', '8', '9', '10']

function normalizeEmail(email) {
    return email.trim().toLowerCase();
}

const createEmptyQuestion = () => ({
    id: Date.now() + Math.random(),
    text: '',
    type: '',
    options: null, // ✅ REQUIRED
    mandatory: false,
    errors: { text: false, type: false }
})

function hash(text) {
    return crypto.createHash("sha256").update(text).digest("hex");
}

const normalizeOptions = (val) => {
    if (!val) return [];
    if (Array.isArray(val)) return val.map((v) => String(v));

    return [String(val)];
};

const SurveySkeleton = ({ isTablet }) => (
    <>
        {[1, 2, 3].map(i => (
            <Box
                key={i}
                sx={{
                    display: 'grid',
                    gridTemplateColumns: isTablet
                        ? '40px 1fr auto'
                        : '30px 1fr 170px 140px 40px',
                    gap: 2,
                    mb: 4
                }}
            >
                <Skeleton width={20} height={30} />
                <Skeleton height={40} />
                {!isTablet && <Skeleton height={40} />}
                <Skeleton width={80} height={30} />
                <Skeleton width={30} height={30} />
            </Box>
        ))}
    </>
)

const MCQModalComponent = ({ open, setOpen, activeQuestionId, setOptionData, optionData }) => {
    const handleClose = () => setOpen(false)

    const [customOptions, setCustomOptions] = useState([''])
    const [allowMulti, setAllowMulti] = useState(false)
    const [errors, setErrors] = useState([])
    const [addNeutral, setAddNeutral] = useState(false)
    const [minOptionError, setMinOptionError] = useState('')

    // Pre-fill modal state from optionData
    useEffect(() => {
        if (!open) return

        setErrors([])
        setAllowMulti(false)
        setAddNeutral(false)
        setCustomOptions([''])

        if (optionData?.option?.length) {
            if (activeQuestionId === '7') {

                setCustomOptions(optionData.option.map(o => o.value))

                setAllowMulti(optionData.multiOption || false)
            }

            if (activeQuestionId === '8') {
                const hasNeutral = optionData.option.some(o => o.value === 'Neutral')

                setAddNeutral(hasNeutral)
            }

            if (activeQuestionId === '9') {
                // Prefill if needed
            }

            if (activeQuestionId === '10') {
                // Prefill if needed
            }
        }
    }, [open, optionData])

    const likertOptions = addNeutral
        ? ['Strongly Disagree', 'Disagree', 'Neutral', 'Agree', 'Strongly Agree']
        : ['Strongly Disagree', 'Disagree', 'Agree', 'Strongly Agree']

    const satisfactionOptions = [
        'Very Dissatisfied',
        'Dissatisfied',
        'Neutral',
        'Satisfied',
        'Very Satisfied'
    ]

    const qualityOptions = ['Poor', 'Good', 'Excellent']

    const MAX_OPTIONS = 10

    const addCustomOption = () => {
        if (customOptions.length >= MAX_OPTIONS) return
        setCustomOptions(prev => [...prev, ''])
    }

    const updateCustomOption = (index, value) => {
        const updated = [...customOptions]

        updated[index] = value
        setCustomOptions(updated)
        setErrors(prev => {
            const err = [...prev]

            err[index] = false

            return err
        })
        setMinOptionError('')
    }

    const removeCustomOption = index => {
        if (customOptions.length <= 2) return
        setCustomOptions(prev => prev.filter((_, i) => i !== index))
        setErrors(prev => prev.filter((_, i) => i !== index))
    }

    const handleSave = () => {
        let payload = []

        setMinOptionError('')
        setErrors([])

        if (activeQuestionId === '7') {
            if (customOptions.length < 2) {
                setMinOptionError('At least 2 options are required')

                return
            }

            const validationErrors = customOptions.map(opt => !opt.trim())

            if (validationErrors.some(Boolean)) {
                setErrors(validationErrors)

                return
            }

            payload = customOptions.map((opt, index) => ({
                index,
                value: opt.trim()
            }))
        }

        if (activeQuestionId === '8') {
            payload = likertOptions.map((opt, index) => ({
                index,
                value: opt
            }))
        }

        if (activeQuestionId === '9') {
            payload = satisfactionOptions.map((opt, index) => ({
                index,
                value: opt
            }))
        }

        if (activeQuestionId === '10') {
            payload = qualityOptions.map((opt, index) => ({
                index,
                value: opt
            }))
        }

        setOptionData({
            option: payload,
            multiOption: activeQuestionId === '7' ? allowMulti : false
        })

        setOpen(false)
    }

    return (
        <Dialog open={open} fullWidth maxWidth="lg" sx={{ '& .MuiDialog-paper': { overflow: 'visible' } }}>
            <DialogCloseButton onClick={handleClose} disableRipple>
                <i className="tabler-x" />
            </DialogCloseButton>

            <DialogTitle textAlign="center">{labelOption?.[activeQuestionId] || ''}</DialogTitle>

            <DialogContent>
                {activeQuestionId === '7' &&
                    customOptions.map((opt, index) => (
                        <Box key={index} sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Box sx={{ flex: 1 }}>
                                <Typography>Option {index + 1}</Typography>
                                <TextField
                                    fullWidth
                                    value={opt}
                                    error={errors[index]}
                                    helperText={errors[index] && 'Option cannot be empty'}
                                    onChange={e => updateCustomOption(index, e.target.value)}
                                />
                                {minOptionError && (
                                    <Typography color="error" variant="caption" sx={{ mb: 1 }}>
                                        {minOptionError}
                                    </Typography>
                                )}
                            </Box>
                            <IconButton
                                color="error"
                                size="small"
                                disabled={customOptions.length <= 2}
                                onClick={() => removeCustomOption(index)}
                                sx={{ mt: 3 }}
                            >
                                <i className="tabler-trash" />
                            </IconButton>
                        </Box>
                    ))}

                {activeQuestionId === '7' && (
                    <>
                        <Button onClick={addCustomOption} variant="contained">
                            Add Option
                        </Button>
                        <Box sx={{ display: 'flex', justifyContent: 'end' }}>
                            <FormControlLabel
                                control={<Checkbox checked={allowMulti} onChange={e => setAllowMulti(e.target.checked)} />}
                                label="Allow Multiselect"
                            />
                        </Box>
                    </>
                )}

                {activeQuestionId === '8' && (
                    <>
                        <FormControlLabel
                            control={<Checkbox checked={addNeutral} onChange={e => setAddNeutral(e.target.checked)} />}
                            label="Add Neutral"
                        />
                        {likertOptions.map((opt, i) => (
                            <TextField key={i} fullWidth disabled value={opt} sx={{ mb: 2 }} />
                        ))}
                    </>
                )}

                {activeQuestionId === '9' &&
                    satisfactionOptions.map((opt, i) => (
                        <TextField key={i} fullWidth disabled value={opt} sx={{ mb: 2 }} />
                    ))}

                {activeQuestionId === '10' &&
                    qualityOptions.map((opt, i) => (
                        <TextField key={i} fullWidth disabled value={opt} sx={{ mb: 2 }} />
                    ))}
            </DialogContent>

            <DialogActions sx={{ justifyContent: 'center' }}>
                <Button variant="contained" onClick={handleSave}>
                    Save
                </Button>
            </DialogActions>
        </Dialog>
    )
}

const SurveyModalComponent = ({ open, setISOpen, token, mId, questions, setQuestions, handleFetchQuestion, fetching }) => {
    const [loading, setLoading] = useState(false)
    const [optionData, setOptionData] = useState()
    const [activeQuestionRowId, setActiveQuestionRowId] = useState(null)
    const theme = useTheme()
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
    const isTablet = useMediaQuery(theme.breakpoints.down('md'))
    const [mcqOpen, setMCQOpen] = useState(false)
    const [activeQuestionId, setActiveQuestionId] = useState(null)
    const { handleSubmit } = useForm()

    const handleClose = () => {
        setISOpen(false)
        handleFetchQuestion()
    }

    const handleQuestionChange = (id, field, value) => {
        setQuestions(prev =>
            prev.map(q =>
                q.id === id
                    ? {
                        ...q,
                        [field]: value,
                        errors: { ...q.errors, [field]: false }
                    }
                    : q
            )
        )
    }

    const addQuestion = () => setQuestions(prev => [...prev, createEmptyQuestion()])
    const removeQuestion = id => questions?.length > 1 && setQuestions(prev => prev.filter(q => q.id !== id))

    const validateQuestions = () => {
        let valid = true

        setQuestions(prev =>
            prev.map(q => {
                const textError = !q.text.trim()
                const typeError = !q.type

                if (textError || typeError) valid = false

                return { ...q, errors: { text: textError, type: typeError } }
            })
        )

        return valid
    }

    // Sync optionData from modal to questions
    useEffect(() => {
        if (!optionData || !activeQuestionRowId) return
        setQuestions(prev =>
            prev.map(q =>
                q.id === activeQuestionRowId
                    ? { ...q, options: optionData.option, multiOption: optionData.multiOption }
                    : q
            )
        )
    }, [optionData])

    const handleSaveSurvey = async () => {
        if (!validateQuestions()) return
        setLoading(true)
        let activeError = false

        try {
            const payload = questions.map((q, index) => {
                const baseQuestion = { text: q.text.trim(), type: q.type, mandatory: q.mandatory }

                if (OPTION_BASED_TYPES.includes(q.type)) {
                    if (!q.options || q.options.length === 0) {
                        toast.error(`Question ${index + 1} requires at least one option`)
                        activeError = true
                    }
                }

                if (q.options?.length) {
                    baseQuestion.options = q.options
                    baseQuestion.multiOption = q.multiOption
                }

                return baseQuestion
            })

            if (activeError) return

            const response = await fetch(`${API_URL}/company/module/survey/setting/${mId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ questions: payload })
            })

            if (response.ok) {
                toast.success('Survey setting saved successfully')
                handleFetchQuestion()
                handleClose()
            } else {
                toast.error('Failed to save survey settings')
            }
        } catch (err) {
            console.error(err)
            toast.error('An error occurred while saving survey')
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} fullWidth maxWidth="lg" fullScreen={isMobile} sx={{ '& .MuiDialog-paper': { overflow: 'visible' } }}>
            <DialogCloseButton onClick={handleClose} disableRipple>
                <i className="tabler-x" />
            </DialogCloseButton>

            <DialogTitle sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>Add Survey</DialogTitle>

            <form onSubmit={handleSubmit(handleSaveSurvey)} noValidate>
                <DialogContent sx={{ maxHeight: isMobile ? 'none' : '70vh', overflowY: 'auto', px: { xs: 2, sm: 4 }, pt: 2 }}>
                    {fetching ? (
                        <SurveySkeleton isTablet={isTablet} />
                    ) : (
                        questions.map((q, index) => (
                            <Box key={index} sx={{ display: 'grid', gridTemplateColumns: isTablet ? '40px 1fr auto' : '30px 1fr 200px 140px 40px', gap: 2, mb: 4, pb: isTablet ? 2 : 0, borderBottom: isTablet ? `1px solid ${theme.palette.divider}` : 'none' }}>
                                <Typography sx={{ mt: 1 }}>{index + 1}.</Typography>

                                <Box sx={{ gridColumn: isTablet ? '2 / 4' : 'auto' }}>
                                    <TextField fullWidth size="small" value={q.text} placeholder="Enter question" error={q.errors.text} helperText={q.errors.text ? 'Question text is required' : `${q.text?.length}/300`} onChange={e => handleQuestionChange(q.id, 'text', e.target.value)} inputProps={{ maxLength: 300 }} />
                                </Box>

                                <Box sx={{ gridColumn: isTablet ? '2 / 4' : 'auto', display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                                    <Box sx={{ flex: 1, minWidth: 200 }}>
                                        <Select size="small" fullWidth value={q.type} error={q.errors.type} onChange={e => handleQuestionChange(q.id, 'type', e.target.value)}>
                                            {QUESTION_TYPES.map(type => (
                                                <MenuItem key={type.value} value={type.value}>
                                                    {type.label}
                                                </MenuItem>
                                            ))}
                                        </Select>
                                        {q.errors.type && <Typography variant="caption" color="error">Question type is required</Typography>}
                                    </Box>

                                    {OPTION_BASED_TYPES.includes(q.type) && (
                                        <Button
                                            size="small"
                                            variant="contained"
                                            sx={{ whiteSpace: 'nowrap' }}
                                            onClick={() => {
                                                setActiveQuestionId(q.type)
                                                setActiveQuestionRowId(q.id)
                                                const currentQuestion = questions.find(ques => ques.id === q.id)


                                                setOptionData(currentQuestion?.options ? { option: currentQuestion.options, multiOption: currentQuestion.multiOption } : { option: [], multiOption: false })
                                                setMCQOpen(true)
                                            }}
                                        >
                                            View Options
                                        </Button>
                                    )}

                                    <Box sx={{ display: 'flex', alignItems: 'center', whiteSpace: 'nowrap' }}>
                                        <Checkbox size="small" checked={q.mandatory} onChange={e => handleQuestionChange(q.id, 'mandatory', e.target.checked)} />
                                        <Typography variant="body2">Mandatory</Typography>
                                    </Box>
                                </Box>

                                <Box>
                                    <IconButton size="small" color="error" disabled={questions.length === 1} onClick={() => removeQuestion(q.id)}>
                                        <i className="tabler-trash" />
                                    </IconButton>
                                </Box>
                            </Box>
                        ))
                    )}

                    <Button variant="contained" sx={{ ml: isTablet ? 0 : 8 }} onClick={addQuestion}>
                        Add Question
                    </Button>
                </DialogContent>

                <DialogActions sx={{ flexDirection: isMobile ? 'column' : 'row', alignItems: 'center', justifyContent: 'center', gap: 2, mb: 6, px: 3, py: 3 }}>
                    <Button type="submit" variant="contained" disabled={loading} fullWidth={isMobile}>
                        {loading ? <CircularProgress size={24} color="inherit" /> : 'Submit'}
                    </Button>
                    <Button variant="tonal" color="error" onClick={handleClose} fullWidth={isMobile}>
                        Cancel
                    </Button>
                </DialogActions>
            </form>

            <MCQModalComponent open={mcqOpen} setOpen={setMCQOpen} activeQuestionId={activeQuestionId} setOptionData={setOptionData} optionData={optionData} />
        </Dialog>
    )
}

const BasicsComponent = ({ token, mId, setShowPresenterSelector, selectedPresenter, liveData }) => {

    const [questions, setQuestions] = useState([]);
    const [fetching, setFetching] = useState(false);

    const [orderType, setOrderType] = useState("any");

    const [checkCertificate, setCheckCertificate] = useState(false);
    const [selectedCertificateId, setSelectedCertificateId] = useState(null);
    const [certificateData, setCertificateData] = useState([]);

    const [isFeedbackChecked, setIsFeedbackChecked] = useState(false);
    const [isMandatoryChecked, setIsMandatoryChecked] = useState(false);

    const [surveyModal, setSurveyModal] = useState(false);

    const [loading, setLoading] = useState(false);

    const { handleSubmit, control, setValue } = useForm();

    // Fetch certificates
    const handleFetchCertificate = async () => {
        try {
            const response = await fetch(`${API_URL}/company/certificate/data`, {
                method: "GET",
                headers: { Authorization: `Bearer ${token}` },
            });

            const result = await response.json();

            if (response.ok) setCertificateData(result.data || []);
        } catch (error) {
            console.error(error);
        }
    };

    // Fetch survey questions
    const handleFetchQuestion = async () => {
        setFetching(true);

        try {
            const response = await fetch(`${API_URL}/company/module/survey/setting/${mId}`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            const value = await response.json();

            if (response.ok && Array.isArray(value?.data)) {
                setQuestions(
                    value.data?.length
                        ? value.data.map((q) => ({
                            id: Date.now() + Math.random(),
                            text: q.question || "",
                            options: q.options || [],
                            multiOption: q.multiOption || false,
                            type: q.questionsType || "",
                            mandatory: q.mandatory || false,
                            errors: { text: false, type: false },
                        }))
                        : []
                );
            }
        } catch (err) {
            console.error(err);
        } finally {
            setFetching(false);
        }
    };

    const fetchModuleSettings = async () => {
        try {
            const response = await fetch(`${API_URL}/company/modules/save/settings/${mId}`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            const result = await response.json();

            if (response.ok && result.data) {
                setOrderType(result.data.orderType || "any");
                setCheckCertificate(result.data.certificateEnabled || false);
                setSelectedCertificateId(result.data.selectedCertificateId || null);
                setIsFeedbackChecked(result.data.feedbackSurveyEnabled || false);
                setIsMandatoryChecked(result.data.mandatory || false);
            }
        } catch (error) {
            console.error("Error fetching module settings:", error);
        }
    };

    useEffect(() => {
        if (liveData?.start_live_time && liveData?.end_live_time) {

            const start = dayjs(liveData.start_live_time);
            const end = dayjs(liveData.end_live_time);


            setValue("date", start);
            setValue("startTime", start);
            setValue("endTime", end);
        }
    }, [liveData, setValue]);


    useEffect(() => {
        if (API_URL && token) {
            fetchModuleSettings()
            handleFetchCertificate();
            handleFetchQuestion();
        }
    }, [API_URL, token]);

    const handleCheckboxChange = (event) => {
        setSelectedCertificateId(null);
        setCheckCertificate(event.target.checked);
    };

    const moduleSettingSave = async () => {
        try {

            setLoading(true);

            if (checkCertificate && !selectedCertificateId) {
                toast.error("Please select a certificate", {
                    autoClose: 1000
                });

                return; // stop submission
            }

            const payload = {
                orderType: orderType || "any",
                certificateEnabled: checkCertificate,
                selectedCertificateId: checkCertificate ? selectedCertificateId : null,
                feedbackSurveyEnabled: isFeedbackChecked,
                mandatory: isMandatoryChecked,
            };

            const response = await fetch(`${API_URL}/company/modules/save/settings/${mId}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(payload),
            });

            if (response.ok) {
                toast.success("Module settings saved successfully", { autoClose: 1000 });
                setLoading(false);
            }

        } catch (error) {
            console.error("Error saving module settings:", error);
            toast.error("Failed to save module settings");
        }
    };

    const handleLiveSave = async (data) => {
        try {

            const { date, startTime, endTime } = data;

            if (!selectedPresenter) {
                toast.error("Please select a session presenter", { autoClose: 1000 });

                return;
            }

            if (!date) {
                toast.error("Please select a date", { autoClose: 1000 });

                return;
            }

            if (!startTime) {
                toast.error("Please select start time", { autoClose: 1000 });

                return;
            }

            if (!endTime) {
                toast.error("Please select end time", { autoClose: 1000 });

                return;
            }

            if (dayjs(date).isBefore(dayjs().startOf("day"))) {
                toast.error("Date cannot be before today", { autoClose: 1000 });

                return;
            }

            const startDateTime = dayjs(date)
                .hour(dayjs(startTime).hour())
                .minute(dayjs(startTime).minute());

            const endDateTime = dayjs(date)
                .hour(dayjs(endTime).hour())
                .minute(dayjs(endTime).minute());

            if (!startDateTime.isBefore(endDateTime)) {
                toast.error("Start time must be before end time", { autoClose: 1000 });

                return;
            }

            const finalData = {
                presenter: selectedPresenter,
                startDateTime,
                endDateTime,
            }

            const response = await fetch(`${API_URL}/company/live/session/${mId}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(finalData)
            })

            if (response.ok) {

                toast.success("Live session saved successfully", {
                    autoClose: 1000
                })
            }


        } catch (error) {
            console.error(error);
        }
    };

    return (
        <Box p={3}>
            <Grid container spacing={3}>
                {/* Left Column - Activities */}
                <Grid item size={{ xs: 12, md: 7 }}>
                    <Box
                        sx={{
                            maxHeight: "70vh",
                            overflowY: "auto",
                            pr: 2,
                            pl: 1,
                        }}
                    >

                        <form onSubmit={handleSubmit(handleLiveSave)} noValidate>

                            <Typography variant="h6" mb={2} fontWeight={600}>
                                Schedule <span>*</span>
                            </Typography>


                            <Box
                                sx={{
                                    display: "grid",
                                    gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr 1fr auto" },
                                    gap: 2,
                                    mb: 3,
                                    alignItems: "center",
                                }}
                            >
                                <LocalizationProvider dateAdapter={AdapterDayjs}>
                                    <Controller
                                        name="date"
                                        control={control}
                                        defaultValue={null}
                                        render={({ field }) => (
                                            <DatePicker
                                                label="Date"
                                                minDate={dayjs().startOf("day")}
                                                value={field.value}
                                                onChange={field.onChange}
                                                slotProps={{ textField: { size: "small" } }}
                                            />
                                        )}
                                    />

                                    <Controller
                                        name="startTime"
                                        control={control}
                                        defaultValue={null}
                                        render={({ field }) => (
                                            <TimePicker
                                                label="Start time"
                                                value={field.value}
                                                onChange={field.onChange}
                                                slotProps={{ textField: { size: "small" } }}
                                            />
                                        )}
                                    />

                                    <Controller
                                        name="endTime"
                                        control={control}
                                        defaultValue={null}
                                        render={({ field }) => (
                                            <TimePicker
                                                label="End time"
                                                value={field.value}
                                                onChange={field.onChange}
                                                slotProps={{ textField: { size: "small" } }}
                                            />
                                        )}
                                    />
                                </LocalizationProvider>


                                <Chip label="IST" variant="outlined" />
                            </Box>

                            <Box
                                sx={{
                                    p: 2,
                                    borderRadius: 2,
                                    border: "1px solid",
                                    borderColor: "divider",
                                    backgroundColor: "background.paper",
                                }}
                            >
                                <Typography variant="h6" mb={1} fontWeight={600}>
                                    Session Presenter <span>*</span>
                                </Typography>


                                <Button
                                    variant="outlined"
                                    size="small"
                                    onClick={() => setShowPresenterSelector(true)}
                                    sx={{ mb: 1 }}
                                >
                                    Change presenter
                                </Button>


                                <Typography color="error" variant="caption" display="block">
                                    * Please choose a presenter with a valid email address registered with
                                    the delivery platform
                                </Typography>
                            </Box>

                            <Button sx={{ mt: 6 }} type="submit" variant="contained">Save</Button>

                        </form>
                    </Box>
                </Grid>

                {/* Right Column - Module Settings */}
                <Grid item size={{ xs: 12, md: 5 }}>

                    <form onSubmit={handleSubmit(moduleSettingSave)}>

                        <Typography variant="subtitle1" gutterBottom>
                            On completion of Module launch the following
                        </Typography>

                        <Box display="flex" flexDirection="column" gap={3}>
                            {/* Certificate Checkbox */}
                            <FormControlLabel
                                control={<Checkbox checked={checkCertificate} onChange={handleCheckboxChange} />}
                                label={<Typography>Certificate</Typography>}
                            />

                            {checkCertificate && (
                                <Box sx={{ display: "flex", gap: 2, minWidth: "max-content", flexWrap: "wrap" }}>
                                    {certificateData.map((item, index) => {
                                        const id = item._id ?? index;
                                        const isSelected = selectedCertificateId === id;

                                        return (
                                            <Card
                                                key={id}
                                                sx={{
                                                    width: 180,
                                                    height: 120,
                                                    borderRadius: 2,
                                                    border: isSelected ? "2px solid #1976d2" : "1px solid #e0e0e0",
                                                    cursor: "pointer",
                                                    position: "relative",
                                                }}
                                                onClick={() => setSelectedCertificateId(id)}
                                            >
                                                {isSelected && (
                                                    <Box
                                                        sx={{
                                                            position: "absolute",
                                                            top: 6,
                                                            right: 6,
                                                            backgroundColor: "primary.main",
                                                            color: "#fff",
                                                            borderRadius: "50%",
                                                            width: 18,
                                                            height: 18,
                                                            display: "flex",
                                                            alignItems: "center",
                                                            justifyContent: "center",
                                                            fontSize: 12,
                                                        }}
                                                    >
                                                        <i className="tabler-check" />
                                                    </Box>
                                                )}
                                                <Box
                                                    sx={{
                                                        width: "100%",
                                                        height: "100%",
                                                        backgroundImage: `url(${assert_url}/frames/${item.backgroundImage})`,
                                                        backgroundSize: "cover",
                                                        backgroundPosition: "center",
                                                    }}
                                                >
                                                    <Box sx={{ p: 1, textAlign: "center" }}>
                                                        {item?.logoURL && (
                                                            <img
                                                                src={`${assert_url}/company_logo/${item.logoURL}`}
                                                                alt="Logo"
                                                                width={40}
                                                                height={20}
                                                                style={{ objectFit: "contain" }}
                                                            />
                                                        )}
                                                        <Typography sx={{ fontSize: 10, fontWeight: 600 }}>{item.title}</Typography>
                                                        <Typography sx={{ fontSize: 9 }}>[UserName]</Typography>
                                                        <Typography sx={{ fontSize: 8, color: "text.secondary" }}>On [date]</Typography>
                                                    </Box>
                                                </Box>
                                            </Card>
                                        );
                                    })}
                                </Box>
                            )}

                            {/* Feedback Survey */}
                            <FormControlLabel
                                control={
                                    <Checkbox
                                        checked={isFeedbackChecked}
                                        onChange={(e) => setIsFeedbackChecked(e.target.checked)}
                                        disabled={!fetching && questions?.length === 0}
                                    />
                                }
                                label={
                                    <Box display="flex" alignItems="center" gap={2}>
                                        <Typography>Feedback survey</Typography>
                                        <Button size="small" variant="outlined" onClick={() => setSurveyModal(true)}>
                                            Add A Survey
                                        </Button>
                                    </Box>
                                }
                            />

                            {/* Mandatory Checkbox */}
                            {isFeedbackChecked && (
                                <FormControlLabel
                                    control={
                                        <Checkbox
                                            checked={isMandatoryChecked}
                                            onChange={(e) => setIsMandatoryChecked(e.target.checked)}
                                            disabled={!fetching && questions?.length === 0}
                                        />
                                    }
                                    label="Mandatory"
                                />
                            )}
                        </Box>

                        <Box mt={3}>
                            <Button type="submit" variant="contained" disabled={loading}>
                                Save
                            </Button>
                        </Box>
                    </form>
                </Grid>
            </Grid>

            <SurveyModalComponent
                open={surveyModal}
                setISOpen={setSurveyModal}
                setFetching={setFetching}
                fetching={fetching}
                token={token}
                setQuestions={setQuestions}
                questions={questions}
                handleFetchQuestion={handleFetchQuestion}
                mId={mId}
            />
        </Box>
    );
};

const ImportUserModal = ({
    open, handleClose, mId, id, activityId, token,
    users, setAllData
}) => {
    const { control, handleSubmit } = useForm();
    const [file, setFile] = useState(null);
    const [imageError, setImageError] = useState("");
    const [loading, setLoading] = useState(false);
    const [excelData, setExcelData] = useState([]);
    const [rowErrors, setRowErrors] = useState({});
    const [matchedUsers, setMatchedUsers] = useState([]);

    // Save uploaded data
    const handleDataSave = async () => {
        if (Object.keys(rowErrors)?.length > 0) {
            toast.error("Please fix the errors in the table before submitting.");

            return;
        }

        if (!file) {
            setImageError("Please upload a valid .xlsx file.");

            return;
        }

        setAllData(matchedUsers);

        // Close after state update
        setTimeout(() => {
            handleClose();
        }, 0);
    };

    const DebouncedInput = ({ value: initialValue, onChange, debounce = 500, ...props }) => {
        const [value, setValue] = useState(initialValue);

        useEffect(() => { setValue(initialValue); }, [initialValue]);
        useEffect(() => {

            const timeout = setTimeout(() => { onChange(value); }, debounce);


            return () => clearTimeout(timeout);
        }, [value]);

        return <CustomTextField {...props} value={value} onChange={e => setValue(e.target.value)} />;
    };

    const validateExcelHeaders = (headers) => {
        const requiredHeaders = ["sno", "empid/email"];

        for (let req of requiredHeaders) {
            if (!headers.includes(req.toLowerCase())) {
                throw new Error(`Missing required column: ${req}`);
            }
        }
    };

    const { getRootProps, getInputProps } = useDropzone({
        multiple: false,
        maxSize: 5 * 1024 * 1024, // 5MB
        accept: {
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"]
        },
        onDrop: async (acceptedFiles) => {

            if (!acceptedFiles?.length) return;

            const selectedFile = acceptedFiles[0];

            try {

                const arrayBuffer = await selectedFile.arrayBuffer();

                const workbook = new ExcelJS.Workbook();
                
                await workbook.xlsx.load(arrayBuffer);

                const worksheet = workbook.worksheets[0]; // first sheet

                if (!worksheet) throw new Error("Excel file is empty.");

                const headerRow = worksheet.getRow(1).values.slice(1).map(h => String(h || "").trim());
                const cleanHeaders = headerRow.map((h, idx) => h || `Column${idx + 1}`);

                validateExcelHeaders(cleanHeaders.map(h => h.toLowerCase()));

                const rows = [];
                
                worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {

                    if (rowNumber === 1) return; // skip header

                    const rowValues = row.values.slice(1); // ExcelJS is 1-based
                    const rowData = {};

                    cleanHeaders.forEach((header, idx) => {
                        rowData[header] = rowValues[idx] ?? "";
                    });

                    rows.push(rowData);
                });

                const errors = {};
                const matchedUsersArray = [];

                rows.forEach((row, index) => {

                    const snoVal = String(row["Sno"] || "").trim();
                    const empVal = String(row["EmpId/Email"] || "").trim();

                    const snoFilled = snoVal !== "";
                    const empFilled = empVal !== "";

                    if (snoFilled !== empFilled) {

                        errors[index] = "Sno and EmpId/Email must both be filled or both be empty.";

                        return;
                    }

                    if (empFilled) {

                        const isEmail = empVal.includes("@");
                        let matchedUser = null;

                        if (isEmail) {

                            const norm = normalizeEmail(empVal);
                            const hashed = hash(norm);

                            matchedUser = users.find(user => user.email_hash === hashed);
                        } else {

                            matchedUser = users.find(user =>
                                user.codes.some(c => String(c.code).trim().toLowerCase() === empVal.trim().toLowerCase())
                            );
                        }

                        if (matchedUser) {

                            matchedUsersArray.push(matchedUser._id);
                        } else {

                            errors[index] = `${empVal} does not exist`;
                        }
                    }
                });

                setRowErrors(errors);
                setExcelData(rows);
                setFile(selectedFile);
                setImageError("");
                setMatchedUsers(matchedUsersArray);

            } catch (err) {

                setFile(null);
                setExcelData([]);
                setRowErrors({});
                setMatchedUsers([]);
                setImageError(err.message);
                toast.error(err.message);
            }
        },
        onDropRejected: (rejectedFiles) => {
            rejectedFiles.forEach(file => {
                file.errors.forEach(error => {
                    let msg = "";

                    switch (error.code) {
                        case "file-invalid-type":
                            msg = `Invalid file type. Only .xlsx files are allowed.`;
                            break;
                        case "file-too-large":
                            msg = `File is too large. Max allowed size is 5MB.`;
                            break;
                        case "too-many-files":
                            msg = `Only one file can be uploaded.`;
                            break;
                        default:
                            msg = `There was an issue with the uploaded file.`;
                    }

                    toast.error(msg);
                    setImageError(msg);
                });
            });
        }
    });

    const columns = useMemo(() => {
        if (!excelData?.length) return [];

        return Object.keys(excelData[0]).map(key => ({
            header: key,
            accessorKey: key,
            cell: ({ row, getValue }) => {
                const value = getValue();

                const error = rowErrors[row.index];

                return (
                    <div>
                        {value}
                        {key === "EmpId/Email" && (
                            <div>
                                {error && (
                                    <Typography variant="caption" color="var(--mui-palette-error-main)">
                                        {error}
                                    </Typography>
                                )}
                            </div>
                        )}
                    </div>
                );
            }
        }));
    }, [excelData, rowErrors]);

    const table = useReactTable({
        data: excelData,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getSortedRowModel: getSortedRowModel()
    });

    const TableImportComponent = () => (
        <Card className="mt-4">
            <CardContent className="flex justify-between flex-col gap-4 items-start sm:flex-row sm:items-center">
                <div className="flex items-center gap-2">
                    <Typography>Show</Typography>
                    <CustomTextField
                        select
                        value={table.getState().pagination.pageSize}
                        onChange={e => table.setPageSize(Number(e.target.value))}
                        className="max-sm:is-full sm:is-[70px]"
                    >
                        <MenuItem value={10}>10</MenuItem>
                        <MenuItem value={25}>25</MenuItem>
                        <MenuItem value={50}>50</MenuItem>
                        <MenuItem value={200}>200</MenuItem>
                    </CustomTextField>
                </div>
                <DebouncedInput
                    value={table.getState().globalFilter ?? ""}
                    className="max-sm:is-full min-is-[250px]"
                    onChange={value => table.setGlobalFilter(String(value))}
                    placeholder="Search"
                />
            </CardContent>
            <div className="overflow-x-auto">
                <table className={tableStyles.table}>
                    <thead>
                        {table.getHeaderGroups().map(headerGroup => (
                            <tr key={headerGroup.id}>
                                {headerGroup.headers.map(header => (
                                    <th key={header.id}>
                                        <div
                                            className={classnames({
                                                "flex items-center": true,
                                                "cursor-pointer": header.column.getCanSort()
                                            })}
                                            onClick={header.column.getToggleSortingHandler()}
                                        >
                                            {flexRender(header.column.columnDef.header, header.getContext())}
                                            {header.column.getIsSorted() === "asc" && <i className="tabler-chevron-up text-xl" />}
                                            {header.column.getIsSorted() === "desc" && <i className="tabler-chevron-down text-xl" />}
                                        </div>
                                    </th>
                                ))}
                            </tr>
                        ))}
                    </thead>
                    <tbody>
                        {table.getRowModel().rows?.length === 0 ? (
                            <tr>
                                <td colSpan={columns?.length} className="text-center">No data available</td>
                            </tr>
                        ) : (
                            table.getRowModel().rows.map(row => (
                                <tr key={row.id}>
                                    {row.getVisibleCells().map(cell => (
                                        <td key={cell.id}>
                                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                        </td>
                                    ))}
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
            <TablePaginationComponent table={table} />
        </Card>
    );

    return (
        <Dialog open={open} fullWidth maxWidth="md" sx={{ "& .MuiDialog-paper": { overflow: "visible" } }}>
            <DialogTitle>Import User</DialogTitle>
            <form onSubmit={handleSubmit(handleDataSave)} noValidate>
                <DialogContent sx={{ maxHeight: "80vh", overflowY: "auto" }}>
                    <Grid container spacing={5}>
                        <Grid size={{ xs: 12 }} item>
                            <Typography variant="body1" fontWeight={500} gutterBottom>
                                XLSX <span>*</span>
                                <Button variant="contained" href="/sample/import_user_sample.xlsx" sx={{ ml: 2 }}>
                                    Download sample file
                                </Button>
                            </Typography>
                            <div
                                {...getRootProps()}
                                style={{
                                    minHeight: "150px",
                                    border: "2px dashed #ccc",
                                    padding: "1rem",
                                    borderRadius: "8px",
                                    textAlign: "center",
                                    display: "flex",
                                    flexDirection: "column",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    gap: "1rem"
                                }}
                            >
                                <input {...getInputProps()} />
                                <Avatar variant="rounded" sx={{ bgcolor: "#f5f5f5", width: 48, height: 48 }}>
                                    <i className="tabler-upload" />
                                </Avatar>
                                <Typography variant="body2">Allowed: *.xlsx, Max 5MB</Typography>

                                {file && (
                                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.5rem" }}>
                                        <Avatar variant="rounded" sx={{ bgcolor: "#f5f5f5", color: "#0A2E73", width: 48, height: 48 }}>
                                            <i className="tabler-file" />
                                        </Avatar>
                                        <Typography variant="body2" fontWeight={500}>{file.name}</Typography>
                                        <Typography variant="caption" color="textSecondary">
                                            {(file.size / 1024 / 1024).toFixed(2)} MB
                                        </Typography>
                                    </div>
                                )}

                                {imageError && (
                                    <Typography variant="caption" color="var(--mui-palette-error-main)" sx={{ mt: 1 }}>
                                        {imageError}
                                    </Typography>
                                )}
                            </div>
                        </Grid>
                    </Grid>

                    {excelData?.length > 0 && <TableImportComponent />}

                    <DialogActions sx={{ justifyContent: "center", gap: 2, mt: 4 }}>
                        {excelData.length > 0 && Object.keys(rowErrors)?.length === 0 && (
                            <Button
                                onClick={handleSubmit(handleDataSave)}
                                variant="contained"
                                sx={{ height: 40 }}
                                disabled={loading}
                            >
                                {loading ? "Uploading..." : "Submit"}
                            </Button>
                        )}

                        <Button
                            type="button"
                            variant="contained"
                            color="secondary"
                            onClick={() => {
                                setFile(null);
                                setExcelData([]);
                                setRowErrors({});
                                handleClose();
                            }}
                        >
                            Close
                        </Button>
                    </DialogActions>
                </DialogContent>
            </form>
        </Dialog>
    );
};

const SkeletonForm = () => (
    <Grid container spacing={4}>
        <Grid item size={{ xs: 12, md: 9 }}>
            {/* Title */}
            <Skeleton variant="text" width={220} height={32} />

            {[...Array(2)].map((_, idx) => (
                <Grid
                    container
                    spacing={2}
                    alignItems="center"
                    mb={3}
                    key={idx}
                >
                    <Grid item size={{ xs: 12, md: 3 }}>
                        <Skeleton variant="rectangular" height={40} />
                    </Grid>

                    <Grid item size={{ xs: 12, md: 6 }}>
                        <Skeleton variant="rectangular" height={40} />
                    </Grid>

                    <Grid item size={{ xs: 12, md: 2 }}>
                        <Skeleton variant="rectangular" height={36} />
                    </Grid>

                    <Grid item size={{ xs: 12, md: 1 }}>
                        <Skeleton variant="circular" width={36} height={36} />
                    </Grid>
                </Grid>
            ))}

            {/* Publish button */}
            <Skeleton variant="rectangular" width={120} height={42} />
        </Grid>
    </Grid>
);

const SettingComponent = ({ createData, isNotPublish }) => {

    const { data: session } = useSession();
    const token = session?.user?.token;
    const { mId } = useParams();

    const [pushEnrollmentSetting, setPushEnrollmentSetting] = useState("1");
    const [selfEnrollmentSetting, setSelfEnrollmentSetting] = useState("1");

    const [dueType, setDueType] = useState();
    const [startDate, setStartDate] = useState();
    const [endDate, setEndDate] = useState();
    const [dueDays, setDueDays] = useState();
    const [lockModule, setLockModule] = useState(false);

    const [selectedPairIndex, setSelectedPairIndex] = useState(null);
    const [allData, setAllData] = useState([]);
    const [isOpen, setIsOpen] = useState(false);

    const [loading, setLoading] = useState(false)

    const [targetOptionPairs, setTargetOptionPairs] = useState([
        { target: "", options: [], secondOptions: [] },
    ]);

    // Fetch program schedule
    useEffect(() => {
        const fetchProgramSchedule = async () => {
            try {
                if (!token || !mId) return;

                const res = await fetch(
                    `${API_URL}/company/program/schedule/data/${mId}`,
                    {
                        headers: { Authorization: `Bearer ${token}` },
                    }
                );

                if (!res.ok) {
                    const errText = await res.text();

                    throw new Error(
                        `Request failed with ${res.status} ${res.statusText}: ${errText}`
                    );
                }

                setLoading(true)

                const body = await res.json();

                const result = body?.data || {};

                if (Array.isArray(result.targetPairs) && result.targetPairs?.length > 0) {
                    const enriched = result.targetPairs.map((pair) => {
                        let secondOptions = [];

                        switch (pair.target) {
                            case "1":
                                secondOptions = createData.designation || [];
                                break;
                            case "2":
                                secondOptions = createData.department || [];
                                break;
                            case "3":
                                secondOptions = createData.group || [];
                                break;
                            case "4":
                                secondOptions = createData.region || [];
                                break;
                            case "5":
                                secondOptions = createData.user || [];
                                break;
                            default:
                                secondOptions = [];
                        }

                        return {
                            target: pair.target ?? "",
                            options: normalizeOptions(pair.options ?? []),
                            secondOptions,
                        };
                    });

                    setTargetOptionPairs(enriched);
                } else {
                    setTargetOptionPairs([{ target: "", options: [], secondOptions: [] }]);
                }
            } catch (err) {
                console.error("Error fetching program schedule:", err);
            }
        };

        fetchProgramSchedule();
    }, [API_URL, token, mId, createData]);

    // Re-enrich secondOptions when createData changes
    useEffect(() => {
        setTargetOptionPairs((prev) =>
            prev.map((pair) => {
                let secondOptions = [];

                switch (pair.target) {
                    case "1":
                        secondOptions = createData.designation || [];
                        break;
                    case "2":
                        secondOptions = createData.department || [];
                        break;
                    case "3":
                        secondOptions = createData.group || [];
                        break;
                    case "4":
                        secondOptions = createData.region || [];
                        break;
                    case "5":
                        secondOptions = createData.user || [];
                        break;
                    default:
                        secondOptions = [];
                }

                return { ...pair, secondOptions, options: normalizeOptions(pair.options) };
            })
        );
    }, [createData]);

    // Auto-select users from modal
    useEffect(() => {
        if (
            allData?.length > 0 &&
            selectedPairIndex !== null &&
            targetOptionPairs[selectedPairIndex]?.target === "5"
        ) {
            setTargetOptionPairs((prevPairs) => {
                const updatedPairs = prevPairs.map((p, i) => ({ ...p }));
                const users = updatedPairs[selectedPairIndex]?.secondOptions || [];

                const selectedUsers = users
                    .filter((u) => allData.includes(String(u._id)))
                    .map((u) => String(u._id));

                updatedPairs[selectedPairIndex].options = normalizeOptions(selectedUsers);

                return updatedPairs;
            });
        }
    }, [allData, selectedPairIndex, targetOptionPairs]);

    // Handlers
    const handleFirstChange = (index, value) => {
        setTargetOptionPairs((prev) => {
            const updated = prev.map((p) => ({ ...p }));

            updated[index].target = value;
            updated[index].options = [];

            switch (value) {
                case "1":
                    updated[index].secondOptions = createData.designation || [];
                    break;
                case "2":
                    updated[index].secondOptions = createData.department || [];
                    break;
                case "3":
                    updated[index].secondOptions = createData.group || [];
                    break;
                case "4":
                    updated[index].secondOptions = createData.region || [];
                    break;
                case "5":
                    updated[index].secondOptions = createData.user || [];
                    break;
                default:
                    updated[index].secondOptions = [];
            }

            return updated;
        });
    };

    const handleSecondChange = (index, value) => {
        setTargetOptionPairs((prev) => {
            const updated = prev.map((p) => ({ ...p }));

            updated[index].options = normalizeOptions(value);

            return updated;
        });
    };

    const handleAddClick = () => {
        setTargetOptionPairs((prev) => {
            if (prev?.length >= MAX_PAIRS) return prev;

            return [...prev, { target: "", options: [], secondOptions: [] }];

        });
    };

    const handleRemoveClick = (index) => {
        setTargetOptionPairs((prev) => {
            if (prev?.length === 1) return prev;
            const copy = [...prev];

            copy.splice(index, 1);

            return copy;
        });
    };

    const handleImportUser = (index) => {
        setSelectedPairIndex(index);
        setIsOpen(true);
    };

    const handleDataSave = async (value) => {
        if (!API_URL || !token || !mId) return;

        try {
            const res = await fetch(`${API_URL}/company/program/schedule/${mId}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(value),
            });

            const body = await res.json();

            if (res.ok) {
                toast.success(body?.message || "Setting saved successfully", {
                    autoClose: 1000,
                });
            } else {
                toast.error(body?.message || "Failed to save settings");
            }
        } catch (err) {
            console.error("Error saving settings:", err?.message || err);
            toast.error("Something went wrong!");
        }
    };

    const onSubmit = (e) => {
        e.preventDefault();

        const hasInvalidTargetPair = targetOptionPairs.some(
            (pair) =>
                !pair.target || !Array.isArray(pair.options) || pair.options.length === 0
        );

        if (hasInvalidTargetPair) {
            toast.error("Please select one module target and option");

            return;
        }

        const payload = {
            pushEnrollmentSetting,
            selfEnrollmentSetting,
            targetPairs: targetOptionPairs.map((p) => ({
                target: p.target,
                options: p.options,
            })),
            lockModule,
            dueType,
            start_date: dueType === "fixed" ? startDate.toISOString() : null,
            end_date: dueType === "fixed" ? endDate.toISOString() : null,
            dueDays: dueType === "relative" ? Number(dueDays) : null,
        };


        handleDataSave(payload);
    };

    const handleClose = () => {
        setIsOpen(false);
        setSelectedPairIndex(null);
        setAllData([]);
    };

    return (

        loading ? (
            <>


                <form onSubmit={onSubmit}>
                    <Grid container spacing={4}>
                        <Grid item size={{ xs: 12, md: 9 }}>

                            {/* Target Audience */}
                            <Typography variant="h6" gutterBottom>
                                This Module Is Targeted At
                            </Typography>
                            {targetOptionPairs.map((pair, idx) => (
                                <Grid container spacing={2} alignItems="center" mb={3} key={idx}>
                                    <Grid item size={{ xs: 12, md: 3 }}>
                                        <TextField
                                            select
                                            label="Select module targets"
                                            fullWidth
                                            size="small"
                                            value={pair.target}
                                            onChange={(e) => handleFirstChange(idx, e.target.value)}
                                        >
                                            <MenuItem value="">Select Module Target</MenuItem>
                                            <MenuItem
                                                value="1"
                                                disabled={targetOptionPairs.some(
                                                    (p, i) => p.target === "1" && i !== idx
                                                )}
                                            >
                                                Designation
                                            </MenuItem>
                                            <MenuItem
                                                value="2"
                                                disabled={targetOptionPairs.some(
                                                    (p, i) => p.target === "2" && i !== idx
                                                )}
                                            >
                                                Department
                                            </MenuItem>
                                            <MenuItem
                                                value="3"
                                                disabled={targetOptionPairs.some(
                                                    (p, i) => p.target === "3" && i !== idx
                                                )}
                                            >
                                                Group
                                            </MenuItem>
                                            <MenuItem
                                                value="4"
                                                disabled={targetOptionPairs.some(
                                                    (p, i) => p.target === "4" && i !== idx
                                                )}
                                            >
                                                Region
                                            </MenuItem>
                                            <MenuItem
                                                value="5"
                                                disabled={targetOptionPairs.some(
                                                    (p, i) => p.target === "5" && i !== idx
                                                )}
                                            >
                                                User
                                            </MenuItem>
                                        </TextField>
                                    </Grid>

                                    <Grid item size={{ xs: 12, md: 6 }}>
                                        <TextField
                                            select
                                            label="Select option"
                                            fullWidth
                                            size="small"
                                            value={pair.options}
                                            onChange={(e) => handleSecondChange(idx, e.target.value)}
                                            SelectProps={{ multiple: true }}
                                        >
                                            {pair.secondOptions && pair.secondOptions.length > 0 ? (
                                                pair.target !== "5"
                                                    ? pair.secondOptions.map((item, i) => (
                                                        <MenuItem
                                                            key={String(item._id ?? i)}
                                                            value={String(item._id ?? item.id ?? item)}
                                                        >
                                                            {item.name || item.title || item.label || item._id}
                                                        </MenuItem>
                                                    ))
                                                    : pair.secondOptions.map((item, i) => (
                                                        <MenuItem
                                                            key={String(item._id ?? i)}
                                                            value={String(item._id ?? item.id ?? item)}
                                                        >
                                                            {item.first_name} {item.last_name}
                                                        </MenuItem>
                                                    ))
                                            ) : (
                                                <MenuItem disabled>No data found</MenuItem>
                                            )}
                                        </TextField>
                                    </Grid>

                                    {pair.target === "5" && (
                                        <Grid item size={{ xs: 12, md: 2 }}>
                                            <Button
                                                variant="outlined"
                                                onClick={() => handleImportUser(idx)}
                                            >
                                                Import User
                                            </Button>
                                        </Grid>
                                    )}

                                    <Grid
                                        item
                                        size={{ xs: 12, md: 1 }}
                                        display="flex"
                                        justifyContent="center"
                                    >
                                        {idx === 0 ? (
                                            <Button
                                                variant="contained"
                                                onClick={handleAddClick}
                                                disabled={targetOptionPairs?.length >= MAX_PAIRS}
                                            >
                                                + Add
                                            </Button>
                                        ) : (
                                            <IconButton
                                                color="error"
                                                onClick={() => handleRemoveClick(idx)}
                                            >
                                                <i className="tabler-trash" />
                                            </IconButton>
                                        )}
                                    </Grid>
                                </Grid>
                            ))}

                            {/* Save Button */}
                            <Button
                                type="submit"
                                variant="contained"
                                color="primary"
                                sx={{ mt: 3 }}
                                disabled={isNotPublish}
                            >
                                Publish
                            </Button>
                        </Grid>
                    </Grid>

                    {/* Import User Modal */}
                    <ImportUserModal
                        open={isOpen}
                        handleClose={handleClose}
                        allData={allData}
                        setAllData={setAllData}
                    />
                </form>

            </>
        ) : (
            <>
                <SkeletonForm />
            </>
        )
    );
};

const SessionPresenterComponent = ({
    setShowPresenterSelector,
    createData,
    selectedPresenter,
    setSelectedPresenter,
    liveData
}) => {
    const [userData, setUserData] = useState([]);

    useEffect(() => {
        if (createData?.user) {
            setUserData(createData.user);
        }
    }, [createData?.user]);

    const onClose = () => {
        setShowPresenterSelector(false);
    };

    const handleSave = () => {
        onClose();
    };

    return (
        <>
            {/* -------- Header -------- */}
            <Box mb={2} display="flex" justifyContent="space-between" alignItems="center">
                <Typography variant="h6">Select Session Presenter</Typography>
                <Button variant="outlined" onClick={onClose}>Close</Button>
            </Box>

            {/* -------- Table -------- */}
            <Paper variant="outlined">
                <Table size="small">
                    <TableHead>
                        <TableRow>
                            <TableCell />
                            <TableCell>User Name</TableCell>
                            <TableCell>Email</TableCell>
                            <TableCell>Company</TableCell>
                        </TableRow>
                    </TableHead>

                    <TableBody>
                        {userData && userData.length > 0 ? (
                            userData.map((user) => (
                                <TableRow
                                    key={user._id}
                                    hover
                                    selected={selectedPresenter === user._id}
                                >
                                    <TableCell>
                                        <Radio
                                            checked={selectedPresenter === user._id}
                                            onChange={() => setSelectedPresenter(user?._id)}
                                        />
                                    </TableCell>
                                    <TableCell>{`${user.first_name} ${user.last_name}`}</TableCell>
                                    <TableCell>{user.email}</TableCell>
                                    <TableCell>{user?.company_id?.company_name}</TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={4} align="center">
                                    No user found
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </Paper>

            {/* -------- Footer Actions -------- */}
            <Box mt={3} display="flex" justifyContent="center" gap={2}>
                <Button onClick={onClose}>Cancel</Button>
                <Button variant="contained" disabled={!selectedPresenter} onClick={handleSave}>
                    Save
                </Button>
            </Box>
        </>
    );
};

const LiveSessionCard = () => {

    const [value, setValue] = useState('basics')
    const handleTabChange = (e, value) => setValue(value)
    const { data: session } = useSession();
    const token = session?.user?.token;
    const { lang: locale, mId: mId } = useParams()
    const [liveData, setLiveData] = useState()

    const [showPresenterSelector, setShowPresenterSelector] = useState(false);
    const [selectedPresenter, setSelectedPresenter] = useState(null);

    const [isNotPublish, setIsNotPublish] = useState(true);

    const [createData, setCreateData] = useState({
        designation: [],
        department: [],
        group: [],
        region: [],
        user: [],
    });

    const fetchCreateData = useCallback(async () => {
        if (!API_URL || !token) return;

        try {
            const res = await fetch(`${API_URL}/company/program/schedule/create`, {
                method: "GET",
                headers: { Authorization: `Bearer ${token}` },
            });

            const body = await res.json();

            if (res.ok) {

                const cd = {
                    designation: body?.data?.designation || [],
                    department: body?.data?.department || [],
                    group: body?.data?.group || [],
                    region: body?.data?.region || [],
                    user: body?.data?.user || [],
                };

                setCreateData(cd);

                return cd;
            } else {
                console.error("Error fetching create data:", body);
            }
        } catch (err) {
            console.error("Error fetching create data:", err);
        }

        return null;
    }, [API_URL, token]);

    const fetchLiveData = useCallback(async () => {
        if (!API_URL || !token) return;

        try {
            const res = await fetch(`${API_URL}/company/live/session/${mId}`, {
                method: "GET",
                headers: { Authorization: `Bearer ${token}` },
            });

            const body = await res.json();

            if (res.ok) {

                if (body?.data?.presenter_id) {

                    setIsNotPublish(false)
                }

                setSelectedPresenter(body?.data?.presenter_id)
                setLiveData(body?.data)
            } else {
                console.error("Error fetching create data:", body);
            }
        } catch (err) {
            console.error("Error fetching create data:", err);
        }

        return null;
    }, [API_URL, token, mId]);

    useEffect(() => {
        if (API_URL && token) {
            fetchCreateData();
            fetchLiveData()
        }
    }, [API_URL, token, mId]);

    const onClose = () => {
        setShowPresenterSelector(false)
    }

    return (
        <PermissionGuard locale={locale} element={'isCompany'}>
            <>
                <Card>
                    <CardContent>
                        <TabContext value={value}>
                            <TabList
                                variant='scrollable'
                                onChange={handleTabChange}
                                className='border-b px-0 pt-0'
                            >
                                <Tab key={1} label='Basics' value='basics' />
                                <Tab key={2} label='Setting' value='setting' />
                            </TabList>

                            <Box mt={3}>
                                <TabPanel value='basics' className='p-0'>
                                    <>
                                        <BasicsComponent
                                            token={token}
                                            setShowPresenterSelector={setShowPresenterSelector}
                                            mId={mId}
                                            liveData={liveData}
                                            setSelectedPresenter={setSelectedPresenter}
                                            selectedPresenter={selectedPresenter}
                                        />
                                    </>
                                </TabPanel>
                                <TabPanel value='setting' className='p-0'>
                                    <SettingComponent createData={createData} isNotPublish={isNotPublish} />
                                </TabPanel>
                            </Box>
                            <Dialog fullWidth maxWidth='lg' scroll='body' open={showPresenterSelector} onClose={onClose} sx={{ '& .MuiDialog-paper': { overflow: 'visible' } }}>
                                <DialogCloseButton onClick={onClose}><i className="tabler-x" /></DialogCloseButton>
                                <DialogTitle variant='h4' className='text-center'>Select presenter</DialogTitle>
                                <DialogContent>

                                    <SessionPresenterComponent
                                        setShowPresenterSelector={setShowPresenterSelector}
                                        createData={createData}
                                        setSelectedPresenter={setSelectedPresenter}
                                        selectedPresenter={selectedPresenter}
                                        liveData={liveData}
                                    />
                                </DialogContent>
                            </Dialog>
                        </TabContext>
                    </CardContent>
                </Card>
            </>
        </PermissionGuard >
    )
}

export default LiveSessionCard;
