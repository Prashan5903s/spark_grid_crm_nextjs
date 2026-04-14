"use client"

import { useState, useEffect } from "react"

import { useSession } from "next-auth/react"

import { useForm, Controller } from "react-hook-form"

import {
    Dialog,
    DialogTitle,
    DialogActions,
    Button,
    Checkbox,
    DialogContent,
    Radio,
    RadioGroup,
    FormControlLabel,
    Typography,
    TextField,
    Box,
    Rating
} from "@mui/material"

import { toast } from "react-toastify"

import DialogCloseButton from "../dialogs/DialogCloseButton"

const SurveyModalComponent = ({ open, setOpen, moduleId }) => {

    const API_URL = process.env.NEXT_PUBLIC_API_URL
    const { data: session } = useSession()
    const token = session?.user?.token

    const [surveyData, setSurveyData] = useState(null)
    const [isMandatory, setIsMandatory] = useState(false)

    useEffect(() => {
        if (!token || !moduleId) return

        fetch(`${API_URL}/user/survey/report/${moduleId}`, {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then(res => res.json())
            .then(res => setSurveyData(res?.data))
            .catch(console.error)
    }, [token, moduleId])

    useEffect(() => {

        if (!surveyData || !open) return

        setIsMandatory(!!surveyData?.moduleSetting?.mandatory)
        setOpen(!!surveyData?.moduleSetting?.feedbackSurveyEnabled)
    }, [surveyData, open, setOpen])

    useEffect(() => {

        if (surveyData && surveyData?.is_survey_done && !!surveyData?.is_survey_completed == false) {
            setOpen(true);
        }

    }, [surveyData])

    const {
        handleSubmit,
        control,
        formState: { errors, isValid },
    } = useForm({
        mode: "onChange",
        defaultValues: { answers: {} },
    })

    const handleSave = async (data) => {
        try {

            const response = await fetch(
                `${API_URL}/user/survey/report/${moduleId}`,
                {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        data: data?.answers
                    })
                }
            )

            const result = await response.json()

            if (response.ok) {
                toast.success("Survey submitted successfully", {
                    autoClose: 1000
                })
                setOpen(false)
            }
        } catch (error) {
            console.error(error)
        }
    }

    const ratingScale = (count) =>
        Array.from({ length: count }, (_, i) => i + 1)

    const renderQuestion = (q, index) => {
        const isRequired = isMandatory && q.mandatory

        return (
            <Box
                key={q._id}
                sx={{
                    border: "1px solid #e0e0e0",
                    borderRadius: 1,
                    p: 2,
                    mb: 2,
                    backgroundColor: "#fff",
                }}
            >
                <Typography fontWeight={500} sx={{ mb: 1 }}>
                    {index + 1}. {q.question}
                    {isRequired && <span style={{ color: "red" }}> *</span>}
                </Typography>

                {/* YES / NO */}
                {q.questionsType === "1" && (
                    <Controller
                        name={`answers.${q._id}`}
                        control={control}
                        rules={isRequired ? { required: "Required" } : {}}
                        render={({ field }) => (
                            <RadioGroup
                                row
                                value={field.value ?? ""}
                                onChange={field.onChange}
                            >
                                <FormControlLabel value="Yes" control={<Radio />} label="Yes" />
                                <FormControlLabel value="No" control={<Radio />} label="No" />
                            </RadioGroup>
                        )}
                    />
                )}

                {/* RATING 1–5 (BAR) */}
                {q.questionsType === "2" && (
                    <Controller
                        name={`answers.${q._id}`}
                        control={control}
                        rules={isRequired ? { required: "Required" } : {}}
                        render={({ field }) => (
                            <Box>
                                <Box
                                    sx={{
                                        display: "grid",
                                        gridTemplateColumns: "repeat(5, 1fr)",
                                        gap: 1,
                                    }}
                                >
                                    {[1, 2, 3, 4, 5].map(n => (
                                        <Box
                                            key={n}
                                            onClick={() => field.onChange(n)}
                                            sx={{
                                                height: 6,
                                                borderRadius: 1,
                                                cursor: "pointer",
                                                backgroundColor:
                                                    (field.value ?? 0) >= n
                                                        ? ["#f44336", "#ff9800", "#ffeb3b", "#8bc34a", "#2196f3"][n - 1]
                                                        : "#e0e0e0",
                                            }}
                                        />
                                    ))}
                                </Box>
                            </Box>
                        )}
                    />
                )}

                {/* RATING 1–10 */}
                {q.questionsType === "3" && (
                    <Controller
                        name={`answers.${q._id}`}
                        control={control}
                        rules={isRequired ? { required: "Required" } : {}}
                        render={({ field }) => (
                            <RadioGroup
                                row
                                value={field.value ?? ""}
                                onChange={field.onChange}
                            >
                                {ratingScale(10).map(n => (
                                    <FormControlLabel
                                        key={n}
                                        value={String(n)}
                                        control={<Radio />}
                                        label={n}
                                    />
                                ))}
                            </RadioGroup>
                        )}
                    />
                )}

                {/* EMOJI */}
                {q.questionsType === "4" && (
                    <Controller
                        name={`answers.${q._id}`}
                        control={control}
                        rules={isRequired ? { required: "Required" } : {}}
                        render={({ field }) => (
                            <Box sx={{ display: "flex", gap: 2 }}>
                                {["😡", "😕", "😐", "😊", "😍"].map((e, i) => (
                                    <Box
                                        key={i}
                                        onClick={() => field.onChange(i + 1)}
                                        sx={{
                                            fontSize: 26,
                                            cursor: "pointer",
                                            opacity: field.value === i + 1 ? 1 : 0.4,
                                        }}
                                    >
                                        {e}
                                    </Box>
                                ))}
                            </Box>
                        )}
                    />
                )}

                {/* STAR */}
                {q.questionsType === "5" && (
                    <Controller
                        name={`answers.${q._id}`}
                        control={control}
                        rules={isRequired ? { required: "Required" } : {}}
                        render={({ field }) => (
                            <Rating
                                max={5}
                                value={field.value ?? null}
                                onChange={(_, value) => field.onChange(value)}
                            />
                        )}
                    />
                )}

                {/* SUBJECTIVE */}
                {q.questionsType === "6" && (
                    <Controller
                        name={`answers.${q._id}`}
                        control={control}
                        rules={isRequired ? { required: "Required" } : {}}
                        render={({ field }) => (
                            <TextField
                                value={field.value ?? ""}
                                onChange={field.onChange}
                                fullWidth
                                multiline
                                rows={3}
                                placeholder="Enter answer"
                            />
                        )}
                    />
                )}

                {/* OPTIONS BASED */}
                {/* OPTIONS BASED */}
                {["7", "8", "9", "10"].includes(q.questionsType) && (
                    <Controller
                        name={`answers.${q._id}`}
                        control={control}
                        rules={
                            isRequired
                                ? {
                                    validate: value =>
                                        q.multiOption
                                            ? value?.length > 0 || "Required"
                                            : !!value || "Required",
                                }
                                : {}
                        }
                        defaultValue={q.multiOption ? [] : ""}
                        render={({ field }) => (
                            q.multiOption ? (
                                <Box>
                                    {q.options.map(opt => (
                                        <FormControlLabel
                                            key={opt._id}
                                            control={
                                                <Checkbox
                                                    checked={field.value?.includes(opt.value)}
                                                    onChange={e => {
                                                        const checked = e.target.checked
                                                        const value = opt.value

                                                        field.onChange(
                                                            checked
                                                                ? [...field.value, value]
                                                                : field.value.filter(v => v !== value)
                                                        )
                                                    }}
                                                />
                                            }
                                            label={opt.value}
                                        />
                                    ))}
                                </Box>
                            ) : (
                                <RadioGroup
                                    value={field.value ?? ""}
                                    onChange={field.onChange}
                                >
                                    {q.options.map(opt => (
                                        <FormControlLabel
                                            key={opt._id}
                                            value={opt.value}
                                            control={<Radio />}
                                            label={opt.value}
                                        />
                                    ))}
                                </RadioGroup>
                            )
                        )}
                    />
                )}

                {errors?.answers?.[q._id] && (
                    <Typography color="error" variant="caption">
                        {errors.answers[q._id].message}
                    </Typography>
                )}
            </Box>
        )
    }

    return (
        <Dialog
            fullWidth
            maxWidth="lg"
            open={open}
        >
            <DialogTitle>
                Survey
            </DialogTitle>

            <DialogContent>
                <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
                    <Typography fontWeight={600}>Section 1</Typography>
                    <Typography variant="caption">
                        {surveyData?.moduleSurvey?.length} Questions
                    </Typography>
                </Box>

                <form onSubmit={handleSubmit(handleSave)}>
                    {surveyData?.moduleSurvey?.map(renderQuestion)}
                </form>
            </DialogContent>

            <DialogActions sx={{ justifyContent: "center", pb: 3 }}>
                <Button
                    variant="contained"
                    onClick={handleSubmit(handleSave)}
                    disabled={isMandatory && !isValid}
                >
                    Submit
                </Button>
            </DialogActions>
        </Dialog>
    )
}

export default SurveyModalComponent
