'use client'

import { useState, useEffect, useRef } from 'react'

import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    MenuItem, Button, CircularProgress, Card, Typography
} from '@mui/material'

import Grid from "@mui/material/Grid2"

import { useForm, Controller } from 'react-hook-form'
import { valibotResolver } from '@hookform/resolvers/valibot'
import {
    object, string, pipe, optional,
    minLength, maxLength, regex,
    any
} from 'valibot'

import { useSession } from 'next-auth/react'
import { toast } from 'react-toastify'

import DialogCloseButton from '../DialogCloseButton'
import CustomTextField from '@core/components/mui/TextField'

const ProposalDialog = ({
    open,
    setOpen,
    selectedLead,
    fetchLeadsData,
    selectLeadId
}) => {

    const { data: session } = useSession()
    const token = session?.user?.token
    const API_URL = process.env.NEXT_PUBLIC_API_URL

    const [createData, setCreateData] = useState();
    const [loading, setLoading] = useState(false)

    const [selectedIndustrialSectorId, setSelectedIndustrialSectorId] = useState()

    const schema = object({
        average_monthly_consumption: pipe(string(), minLength(1, "Average monthly consumption is required")),
        sanctioned_load: pipe(string(), minLength(1, "Sanctioned load is required")),
        industrial_sector_id: pipe(string(), minLength(1, "Industrial sector is required")),
        base_unit_cost: pipe(string(), minLength(1, "Base unit cost is required")),
        base_unit_cost: pipe(
            string(),
            minLength(1, "Base unit cost is required"),
            regex(/^[0-9]+$/, "Only numbers allowed"),
            maxLength(6, "Maximum 6 digits allowed"),
        ),
        base_unit_solar_rate: selectedIndustrialSectorId === "69c6580065ad315756decec7" ? pipe(
            string(),
            minLength(1, "Base unit cost is required"),
            regex(/^[0-9]+$/, "Only numbers allowed"),
            maxLength(6, "Maximum 6 digits allowed"),
        ) : string()
    })

    const fetchCreate = async () => {
        try {

            const response = await fetch(`${API_URL}/user/proposal/create/data`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            })

            const value = await response.json()

            if (response.ok) {

                const data = value?.data;

                setCreateData(data);
            }

        } catch (error) {
            throw new Error(error)
        }
    }

    useEffect(() => {

        if (API_URL && token) {

            fetchCreate()
        }

    }, [API_URL, token])

    const {
        control,
        handleSubmit,
        reset,
        formState: { errors }
    } = useForm({
        resolver: valibotResolver(schema),
        defaultValues: {
            base_unit_cost: "",
            average_monthly_consumption: "",
            sanctioned_load: "",
            industrial_sector_id: '',
            base_unit_solar_rate: '',
        }
    })

    useEffect(() => {
        if (open && selectedLead) {
            reset({
                average_monthly_consumption: selectedLead?.average_monthly_consumption || '',
                sanctioned_load: selectedLead?.sanctioned_load || '',
                industrial_sector_id: selectedLead?.industrial_sector_id || '',
                base_unit_cost: selectedLead?.base_unit_cost || '',
                base_unit_solar_rate: selectedLead?.base_unit_solar_rate || ""
            })
        } else {

            reset({
                base_unit_cost: "",
                average_monthly_consumption: '',
                sanctioned_load: '',
                industrial_sector_id: '',
                base_unit_solar_rate: ""
            })
        }
    }, [open, selectedLead, reset])

    const handleClose = () => {

        setSelectedIndustrialSectorId()
        setOpen(false)
        reset()
    }

    const submitData = async (values) => {
        setLoading(true)

        const finalValue = {
            ...selectedLead,
            ...values
        }

        try {

            const res = await fetch(`${API_URL}/user/proposal/post/data`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`
                    },
                    body: JSON.stringify(finalValue)
                }
            )

            const data = await res.json()

            if (res.ok) {
                toast.success(`Proposal sent successfully`, {
                    autoClose: 1000
                })
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

            <DialogTitle variant="h4" className="text-center sm:pbs-16 sm:pbe-6 sm:pli-16">
                {"Send Proposal"}
            </DialogTitle>

            {/* ================= LEAD INFO ================= */}
            <Card sx={{ boxShadow: 2, borderRadius: 2, p: 6, m: 4, backgroundColor: 'grey.50' }}>
                <Grid container spacing={2}>
                    <Grid item size={{ xs: 12, sm: 6 }}>
                        <Typography variant="caption">Company</Typography>
                        <Typography fontWeight={500}>{selectedLead?.company_name || '-'}</Typography>
                    </Grid>

                    <Grid item size={{ xs: 12, sm: 6 }}>
                        <Typography variant="caption">Name</Typography>
                        <Typography fontWeight={500}>{selectedLead?.name || '-'}</Typography>
                    </Grid>

                    <Grid item size={{ xs: 12, sm: 6 }}>
                        <Typography variant="caption">Email</Typography>
                        <Typography>{selectedLead?.email || '-'}</Typography>
                    </Grid>

                    <Grid item size={{ xs: 12, sm: 6 }}>
                        <Typography variant="caption">Phone</Typography>
                        <Typography>{selectedLead?.phone || '-'}</Typography>
                    </Grid>
                </Grid>
            </Card>

            <form onSubmit={handleSubmit(submitData)} noValidate>

                <DialogContent className="grid grid-cols-2 gap-4">

                    {/* Avg Consumption */}
                    <Controller
                        name="average_monthly_consumption"
                        control={control}
                        rules={{
                            required: "Monthly consumption is required",
                            pattern: {
                                value: /^[0-9]+$/,
                                message: "Only numbers allowed"
                            },
                            min: {
                                value: 1,
                                message: "Must be greater than 0"
                            },
                            max: {
                                value: 100000,
                                message: "Too large value"
                            }
                        }}
                        render={({ field, fieldState }) => (
                            <CustomTextField
                                {...field}
                                required
                                label="Monthly Consumption (kWh)"
                                fullWidth
                                inputProps={{
                                    inputMode: "numeric",
                                    pattern: "[0-9]*"
                                }}
                                onKeyDown={(e) => {
                                    if (!/[0-9]/.test(e.key) && e.key !== "Backspace" && e.key !== "Tab") {
                                        e.preventDefault();
                                    }
                                }}
                                error={!!fieldState.error}
                                helperText={fieldState.error?.message}
                            />
                        )}
                    />

                    <Controller
                        name="sanctioned_load"
                        control={control}
                        rules={{
                            required: "Sanctioned load is required",
                            pattern: {
                                value: /^\d+(\.\d+)?$/,
                                message: "Only numeric values allowed"
                            },
                            min: {
                                value: 0.1,
                                message: "Must be greater than 0"
                            },
                            max: {
                                value: 1000,
                                message: "Too large value"
                            }
                        }}
                        render={({ field, fieldState }) => (
                            <CustomTextField
                                {...field}
                                required
                                label="Sanctioned Load (kW)"
                                fullWidth
                                inputProps={{
                                    inputMode: "decimal"
                                }}
                                onKeyDown={(e) => {
                                    if (
                                        !/[0-9.]/.test(e.key) &&
                                        e.key !== "Backspace" &&
                                        e.key !== "Tab"
                                    ) {
                                        e.preventDefault();
                                    }

                                    // prevent multiple dots
                                    if (e.key === "." && field.value?.includes(".")) {
                                        e.preventDefault();
                                    }
                                }}
                                error={!!fieldState.error}
                                helperText={fieldState.error?.message}
                            />
                        )}
                    />

                    {/* Lead Status */}
                    <Controller
                        name="industrial_sector_id"
                        control={control}
                        render={({ field, fieldState }) => (
                            <CustomTextField
                                {...field}
                                required
                                select
                                label="Industrial Sector"
                                fullWidth
                                onChange={(e) => {

                                    console.log("Id", e?.target?.value);

                                    field.onChange(e.target.value)

                                    setSelectedIndustrialSectorId(e?.target?.value)
                                }
                                }
                                error={!!fieldState.error}
                                helperText={fieldState.error?.message}
                            >
                                {(createData?.industrialSectorData?.length ?? 0) > 0 ? (
                                    createData?.industrialSectorData?.map(item => (
                                        <MenuItem key={item._id} value={item._id} >
                                            {item?.title || ""}
                                        </MenuItem>
                                    ))
                                ) : (
                                    <MenuItem disabled value="">
                                        No Status Available
                                    </MenuItem>
                                )}
                            </CustomTextField>
                        )}
                    />

                    {/* Base Unit Cost */}
                    <Controller
                        name="base_unit_cost"
                        control={control}
                        render={({ field, fieldState }) => (
                            <CustomTextField
                                {...field}
                                required
                                label="Base Unit Cost (₹)"
                                fullWidth
                                error={!!fieldState.error}
                                helperText={fieldState.error?.message}
                                inputProps={{ maxLength: 6, inputMode: "numeric" }}
                                onChange={(e) => {
                                    const value = e.target.value.replace(/[^0-9]/g, "");

                                    field.onChange(value);
                                }}
                            />
                        )}
                    />

                    {selectedIndustrialSectorId === "69c6580065ad315756decec7" && (


                        <Controller
                            name="base_unit_solar_rate"
                            control={control}
                            render={({ field, fieldState }) => (
                                <CustomTextField
                                    {...field}
                                    required={selectedIndustrialSectorId === "69c6580065ad315756decec7"}
                                    label="Base Unit Solar Rate (₹)"
                                    fullWidth
                                    error={!!fieldState.error}
                                    helperText={fieldState.error?.message}
                                    inputProps={{ maxLength: 6, inputMode: "numeric" }}
                                    onChange={(e) => {
                                        const value = e.target.value.replace(/[^0-9]/g, "");

                                        field.onChange(value);
                                    }}
                                />
                            )}
                        />
                    )}
                </DialogContent>

                <DialogActions className="justify-center">
                    <Button type="submit" variant="contained" disabled={loading}>
                        {loading ? <CircularProgress size={24} sx={{ color: 'white' }} /> : 'Submit'}
                    </Button>

                    <Button variant="outlined" onClick={handleClose}>
                        Cancel
                    </Button>
                </DialogActions>

            </form>
        </Dialog >
    )
}

export default ProposalDialog
