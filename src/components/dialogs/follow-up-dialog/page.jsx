'use client'

import { useEffect, useState } from 'react'

import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    MenuItem,
    Card,
    CircularProgress,
    Typography
} from '@mui/material'

import Grid from "@mui/material/Grid2"

import { useForm, Controller } from 'react-hook-form'
import { valibotResolver } from '@hookform/resolvers/valibot'

import {
    object,
    string,
    pipe,
    minLength,
    optional,
    custom,
    any
} from 'valibot'

import { useSession } from 'next-auth/react'
import { toast } from 'react-toastify'

import CustomTextField from '@core/components/mui/TextField'
import DialogCloseButton from '../DialogCloseButton'

/* ================= SCHEMA ================= */
const schema = object(
    {
        follow_up_date: pipe(string(), minLength(1, 'Follow up date is required')),
        next_follow_up_date: optional(string()),
        lead_status_id: pipe(string(), minLength(1, 'Lead status is required')),
        follow_up_type: pipe(string(), minLength(1, 'Follow up Type is required')),
        notes: optional(string()),
        status: pipe(string(), minLength(1, 'Status is required')),
        priority: pipe(string(), minLength(1, 'Priority is required')),
        reminder_before: optional(any())
    },
    [
        custom(
            (data) => {
                const { follow_up_date, next_follow_up_date } = data

                if (!follow_up_date || !next_follow_up_date) return true

                // Normalize both formats
                const followDate = new Date(`${follow_up_date}T00:00`)
                const nextDate = new Date(next_follow_up_date)

                if (isNaN(followDate) || isNaN(nextDate)) return true

                return nextDate >= followDate
            },
            'Next follow up date must be greater than or equal to follow up date',
            ['next_follow_up_date']
        )
    ]
)

const today = new Date().toISOString().split('T')[0]

const FollowUpDialog = ({
    open,
    setOpen,
    fetchLeadsData,
    isChange = false,
    selectedLead,
    selectedLeadId
}) => {
    const { data: session } = useSession()
    const token = session?.user?.token
    const API_URL = process.env.NEXT_PUBLIC_API_URL

    const [loading, setLoading] = useState(false)
    const [createData, setCreateData] = useState({})

    /* ================= FORM ================= */
    const {
        control,
        handleSubmit,
        reset,
        watch,
        setValue,
        formState: { errors }
    } = useForm({
        resolver: valibotResolver(schema),
        defaultValues: {
            follow_up_date: today,
            next_follow_up_date: '',
            lead_status_id: '',
            follow_up_type: '',
            notes: '',
            status: '',
            priority: '',
            reminder_before: 10
        }
    })

    useEffect(() => {
        if (open) {
            setValue("status", "69c52842a9a39a1b7c89fbde")
            setValue("follow_up_type", "69c52842a9a39a1b7c89fbda")
        }
    }, [open])

    const followUpDate = watch('follow_up_date')
    const nextFollowUpDate = watch('next_follow_up_date')

    /* ================= AUTO FIX INVALID DATE ================= */
    useEffect(() => {
        if (nextFollowUpDate && followUpDate) {
            const follow = new Date(`${followUpDate}T00:00`)
            const next = new Date(nextFollowUpDate)

            if (next < follow) {
                setValue('next_follow_up_date', '')
            }
        }
    }, [followUpDate, nextFollowUpDate, setValue])

    /* ================= DROPDOWN ================= */
    const renderOptions = (data) => {
        if (!data || data.length === 0) {
            return <MenuItem disabled>Loading...</MenuItem>
        }

        return data.map((item, i) => (
            <MenuItem key={i} value={item?._id}>
                {item?.title}
            </MenuItem>
        ))
    }

    /* ================= FETCH DATA ================= */
    const fetchCreateData = async () => {
        try {
            const response = await fetch(`${API_URL}/user/follow-up/create/data`, {
                headers: { Authorization: `Bearer ${token}` }
            })

            const value = await response.json()

            if (response.ok) {
                setCreateData(value?.data || {})
            }
        } catch (error) {
            console.error(error)
        }
    }

    useEffect(() => {
        if (API_URL && token) {
            fetchCreateData()
        }
    }, [API_URL, token])

    /* ================= CLOSE ================= */
    const handleClose = () => {
        setOpen(false)
        reset()
    }

    /* ================= SUBMIT ================= */
    const onSubmit = async (values) => {
        setLoading(true)

        try {

            const payload = {
                ...values,
                next_follow_up_date: values.next_follow_up_date || null,
                notes: values.notes || null,
                reminder_before: values.reminder_before || null
            }

            const response = await fetch(
                isChange ? `${API_URL}/user/follow-up/put/data/${selectedLeadId}` : `${API_URL}/user/follow-up/post/${selectedLeadId}`,
                {
                    method: isChange ? 'PUT' : 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`
                    },
                    body: JSON.stringify(payload)
                }
            )

            const data = await response.json()

            if (response.ok) {
                toast.success('Follow up created successfully')
                fetchLeadsData?.()
                handleClose()
            } else {
                toast.error(data?.message || 'Something went wrong')
            }
        } catch (err) {
            console.error(err)
            toast.error('Server error')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (selectedLead && isChange && open) {

            const formatDate = (date) => {
                if (!date) return ""
                
                return new Date(date).toISOString().split('T')[0] // YYYY-MM-DD
            }

            const formatDateTime = (date) => {
                if (!date) return ""
                
                return new Date(date).toISOString().slice(0, 16) // YYYY-MM-DDTHH:mm
            }

            console.log("Lead", selectedLead?.lead_data);


            reset({
                status: selectedLead?.status || '',
                follow_up_type: selectedLead?.follow_up_type || "",
                priority: selectedLead?.priority || "",
                lead_status_id: selectedLead?.lead_data?.lead_status_id || "",
                notes: selectedLead?.notes || "",
                reminder_before: selectedLead?.reminder_before || "",
                follow_up_date: formatDate(selectedLead?.follow_up_date),
                next_follow_up_date: formatDateTime(selectedLead?.next_follow_up_date),
            })
        }
    }, [selectedLead, isChange, open])

    return (
        <Dialog
            fullWidth
            maxWidth="lg"
            scroll="body"
            open={open}
            closeAfterTransition={false}
            sx={{ '& .MuiDialog-paper': { overflow: 'visible' } }}
        >
            <DialogCloseButton onClick={handleClose}>
                <i className="tabler-x" />
            </DialogCloseButton>

            <DialogTitle className="text-center" sx={{ fontWeight: 600 }}>
                {isChange ? "Edit" : "Add"} Follow Up
            </DialogTitle>

            {/* ================= LEAD INFO ================= */}
            <Card sx={{ boxShadow: 2, borderRadius: 2, p: 6, m: 4, backgroundColor: 'grey.50' }}>
                <Grid container spacing={2}>
                    <Grid item size={{ xs: 12, sm: 6 }}>
                        <Typography variant="caption">Company</Typography>
                        <Typography fontWeight={500}>{isChange ? selectedLead?.lead_data?.company_name : selectedLead?.company_name || '-'}</Typography>
                    </Grid>

                    <Grid item size={{ xs: 12, sm: 6 }}>
                        <Typography variant="caption">Name</Typography>
                        <Typography fontWeight={500}>{isChange ? selectedLead?.lead_data?.name : selectedLead?.name || '-'}</Typography>
                    </Grid>

                    <Grid item size={{ xs: 12, sm: 6 }}>
                        <Typography variant="caption">Email</Typography>
                        <Typography>{isChange ? selectedLead?.lead_data?.email : selectedLead?.email || '-'}</Typography>
                    </Grid>

                    <Grid item size={{ xs: 12, sm: 6 }}>
                        <Typography variant="caption">Phone</Typography>
                        <Typography>{isChange ? selectedLead?.lead_data?.phone : selectedLead?.phone || '-'}</Typography>
                    </Grid>
                </Grid>
            </Card>

            {/* ================= FORM ================= */}
            <form onSubmit={handleSubmit(onSubmit)} noValidate>
                <DialogContent>
                    <Grid container spacing={3}>

                        {/* Follow Up Date */}
                        <Grid item size={{ xs: 12, sm: 6 }}>
                            <Controller
                                name="follow_up_date"
                                control={control}
                                render={({ field }) => (
                                    <CustomTextField
                                        {...field}
                                        fullWidth
                                        required
                                        type="date"
                                        label="Follow Up Date"
                                        InputLabelProps={{ shrink: true }}
                                        inputProps={{
                                            min: today,
                                            max: nextFollowUpDate
                                                ? nextFollowUpDate.split('T')[0]
                                                : undefined
                                        }}
                                        error={!!errors.follow_up_date}
                                        helperText={errors.follow_up_date?.message}
                                    />
                                )}
                            />
                        </Grid>

                        {/* Lead Status */}
                        <Grid item size={{ xs: 12, sm: 6 }}>
                            <Controller
                                name="lead_status_id"
                                control={control}
                                render={({ field }) => (
                                    <CustomTextField {...field} fullWidth required select label="Lead Status"
                                        error={!!errors.lead_status_id}
                                        helperText={errors.lead_status_id?.message}>
                                        {renderOptions(createData?.leadStatusData)}
                                    </CustomTextField>
                                )}
                            />
                        </Grid>

                        {/* Follow Up Type */}
                        <Grid item size={{ xs: 12, sm: 6 }}>
                            <Controller
                                name="follow_up_type"
                                control={control}
                                render={({ field }) => (
                                    <CustomTextField {...field} fullWidth required select label="Follow Up Type"
                                        error={!!errors.follow_up_type}
                                        helperText={errors.follow_up_type?.message}>
                                        {renderOptions(createData?.followUpType)}
                                    </CustomTextField>
                                )}
                            />
                        </Grid>

                        {/* Status */}
                        <Grid item size={{ xs: 12, sm: 6 }}>
                            <Controller
                                name="status"
                                control={control}
                                render={({ field }) => (
                                    <CustomTextField {...field} fullWidth required select label="Follow up Status"
                                        error={!!errors.status}
                                        helperText={errors.status?.message}>
                                        {renderOptions(createData?.followUpStatus)}
                                    </CustomTextField>
                                )}
                            />
                        </Grid>

                        {/* Priority */}
                        <Grid item size={{ xs: 12, sm: 6 }}>
                            <Controller
                                name="priority"
                                control={control}
                                render={({ field }) => (
                                    <CustomTextField {...field} fullWidth required select label="Priority"
                                        error={!!errors.priority}
                                        helperText={errors.priority?.message}>
                                        {renderOptions(createData?.followUpPriority)}
                                    </CustomTextField>
                                )}
                            />
                        </Grid>

                        {/* Reminder */}
                        <Grid item size={{ xs: 12, sm: 6 }}>
                            <Controller
                                name="reminder_before"
                                control={control}
                                render={({ field }) => (
                                    <CustomTextField
                                        {...field}
                                        fullWidth
                                        type="number"
                                        label="Reminder (minutes)"
                                        error={!!errors.reminder_before}
                                        helperText={errors.reminder_before?.message}
                                    />
                                )}
                            />
                        </Grid>

                        {/* Next Follow Up Date */}
                        <Grid item size={{ xs: 12, sm: 6 }}>
                            <Controller
                                name="next_follow_up_date"
                                control={control}
                                render={({ field }) => (
                                    <CustomTextField
                                        {...field}
                                        fullWidth
                                        type="datetime-local"
                                        label="Next Follow Up Date & Time"
                                        InputLabelProps={{ shrink: true }}
                                        inputProps={{
                                            min: followUpDate
                                                ? `${followUpDate}T00:00`
                                                : undefined
                                        }}
                                        error={!!errors.next_follow_up_date}
                                        helperText={errors.next_follow_up_date?.message}
                                    />
                                )}
                            />
                        </Grid>

                        {/* Notes */}
                        <Grid item size={{ xs: 12, sm: 6 }}>
                            <Controller
                                name="notes"
                                control={control}
                                render={({ field }) => (
                                    <CustomTextField {...field} fullWidth label="Notes" multiline rows={3} />
                                )}
                            />
                        </Grid>

                    </Grid>
                </DialogContent>

                <DialogActions sx={{ justifyContent: 'center', py: 3 }}>
                    <Button type="submit" variant="contained" disabled={loading}>
                        {loading ? <CircularProgress size={22} /> : 'Submit'}
                    </Button>

                    <Button variant="outlined" onClick={handleClose}>
                        Cancel
                    </Button>
                </DialogActions>
            </form>
        </Dialog>
    )
}

export default FollowUpDialog
