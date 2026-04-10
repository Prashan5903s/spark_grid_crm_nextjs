'use client'

import { useState, useEffect, useRef } from 'react'

import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    MenuItem, Button, CircularProgress
} from '@mui/material'

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

const schema = object({
    company_name: string(),
    name: pipe(string(), minLength(1, 'Name is required')),
    email: pipe(
        string(),
        minLength(1, 'Email is required'),
        regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Invalid email format')
    ),
    phone: pipe(
        string(),
        minLength(10, 'Phone is required'),
        maxLength(15, 'Invalid phone number')
    ),
    state_id: optional(any()),
    city_id: optional(any()),
    average_monthly_consumption: string(),
    sanctioned_load: string(),
    lead_status_id: string(),
    source_id: string(),
    solution_id: string(),
    address: string(),
    pincode: optional(
        string(),
        regex(/^[0-9]+$/, "Only numbers allowed"),
        maxLength(6, "Maximum 6 digits allowed"),
    ),
})

const LeadsDialog = ({
    open,
    isTable = true,
    setOpen,
    selectLeadStatusId,
    selectedLead,
    fetchLeadsData,
}) => {

    const { data: session } = useSession()
    const token = session?.user?.token
    const API_URL = process.env.NEXT_PUBLIC_API_URL

    const [createData, setCreateData] = useState();
    const [loading, setLoading] = useState(false)
    const [selectedStateId, setSelectedStateId] = useState();
    const [selectedCity, setSelectedCity] = useState([]);

    useEffect(() => {

        if (selectedStateId && createData) {
            const city = createData.states.find(u => String(u.state_id) === selectedStateId)

            setSelectedCity(city?.cities)

        }
    }, [selectedStateId, createData])

    const {
        control,
        handleSubmit,
        reset,
        setValue,
        formState: { errors }
    } = useForm({
        resolver: valibotResolver(schema),
        defaultValues: {
            company_name: "",
            name: '',
            email: '',
            phone: '',
            solution_id: "",
            state_id: '',
            city_id: '',
            average_monthly_consumption: '',
            sanctioned_load: '',
            lead_status_id: '',
            source_id: '',
            address: '',
            pincode: '',
        }
    })

    const fetchCreateData = async () => {
        try {

            const response = await fetch(`${API_URL}/user/leads/create/data`, {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${token}`
                }
            })

            const value = await response.json();

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

            fetchCreateData()
        }
    }, [API_URL, token])

    useEffect(() => {
        if (open && selectedLead) {
            reset({
                name: selectedLead?.name || '',
                email: selectedLead?.email || '',
                phone: selectedLead?.phone || '',
                company_name: selectedLead?.company_name || "",
                solution_id: selectedLead?.solution_id || "",
                average_monthly_consumption: selectedLead?.average_monthly_consumption || '',
                sanctioned_load: selectedLead?.sanctioned_load || '',
                lead_status_id: selectedLead?.lead_status_id || '',
                state_id: Number(selectedLead.state_id) || "",
                city_id: Number(selectedLead?.city_id) || "",
                source_id: selectedLead?.source_id || '',
                address: selectedLead?.address || '',
                pincode: selectedLead?.pincode || '',
            })
            setSelectedStateId(selectedLead?.state_id)
        } else if (selectLeadStatusId) {
            setValue("lead_status_id", selectLeadStatusId)
        } else {

            reset({
                company_name: "",
                name: '',
                email: '',
                phone: '',
                average_monthly_consumption: '',
                sanctioned_load: '',
                lead_status_id: '',
                state_id: "",
                city_id: "",
                solution_id: "",
                source_id: '',
                address: '',
                pincode: '',
            })
        }
    }, [open, selectedLead, reset, selectLeadStatusId])

    const handleClose = () => {
        setOpen(false)
        reset()
    }

    const submitData = async (values) => {
        setLoading(true)

        try {

            const res = await fetch(
                selectedLead
                    ? `${API_URL}/user/leads/data/${selectedLead._id}`
                    : `${API_URL}/user/leads/data`,
                {
                    method: selectedLead ? 'PUT' : 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`
                    },
                    body: JSON.stringify(values)
                }
            )

            const data = await res.json()

            if (res.ok) {
                toast.success(`Lead ${selectedLead ? 'updated' : 'created'} successfully`, {
                    autoClose: 1000
                })
                fetchLeadsData()
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
                {selectedLead ? 'Edit Lead' : 'Add Lead'}
            </DialogTitle>

            <form onSubmit={handleSubmit(submitData)} noValidate>

                <DialogContent className="grid grid-cols-2 gap-4">

                    {/* Lead Status */}
                    {
                        (


                            <Controller
                                name="lead_status_id"
                                control={control}
                                render={({ field, fieldState }) => (
                                    <CustomTextField select {...field}
                                        disabled={!isTable} label="Lead Status" fullWidth error={!!fieldState.error}
                                        helperText={fieldState.error?.message}>
                                        {(createData?.statusData?.length ?? 0) > 0 ? (
                                            createData?.statusData?.map(item => (
                                                <MenuItem key={item._id} value={item._id}>
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

                        )}

                    {/* Name */}
                    <Controller
                        name="company_name"
                        control={control}
                        render={({ field }) => (
                            <CustomTextField
                                {...field}
                                label="Company Name"
                                error={!!errors.company_name}
                                helperText={errors.company_name?.message}
                                fullWidth
                            />
                        )}
                    />

                    {/* Name */}
                    <Controller
                        name="name"
                        control={control}
                        render={({ field }) => (
                            <CustomTextField
                                {...field}
                                label="Name"
                                required
                                error={!!errors.name}
                                helperText={errors.name?.message}
                                fullWidth
                            />
                        )}
                    />

                    {/* Email */}
                    <Controller
                        name="email"
                        control={control}
                        render={({ field }) => (
                            <CustomTextField
                                {...field}
                                label="Email"
                                required
                                error={!!errors.email}
                                helperText={errors.email?.message}
                                fullWidth
                            />
                        )}
                    />

                    {/* Phone */}
                    <Controller
                        name="phone"
                        control={control}
                        render={({ field }) => (
                            <CustomTextField
                                {...field}
                                label="Phone"
                                required
                                error={!!errors.phone}
                                helperText={errors.phone?.message}
                                fullWidth
                            />
                        )}
                    />

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

                    {/* Source */}
                    <Controller
                        name="source_id"
                        control={control}
                        render={({ field, fieldState }) => (
                            <CustomTextField select {...field} label="Source" fullWidth error={!!fieldState.error}
                                helperText={fieldState.error?.message}>
                                {(createData?.sourceData?.length ?? 0) > 0 ? (
                                    createData?.sourceData?.map(item => (
                                        <MenuItem key={item._id} value={item._id}>
                                            {item.title}
                                        </MenuItem>
                                    ))
                                ) : (
                                    <MenuItem disabled value="">
                                        No Sources Available
                                    </MenuItem>
                                )}
                            </CustomTextField>
                        )}
                    />

                    <Controller
                        name="solution_id"
                        control={control}
                        render={({ field, fieldState }) => (
                            <CustomTextField select {...field} label="Solution" fullWidth error={!!fieldState.error}
                                helperText={fieldState.error?.message}>
                                {(createData?.solutionData?.length ?? 0) > 0 ? (
                                    createData?.solutionData?.map(item => (
                                        <MenuItem key={item._id} value={item._id}>
                                            {item.title}
                                        </MenuItem>
                                    ))
                                ) : (
                                    <MenuItem disabled value="">
                                        No Solution Available
                                    </MenuItem>
                                )}
                            </CustomTextField>
                        )}
                    />

                    {/* Lead Status */}
                    <Controller
                        name="state_id"
                        control={control}
                        render={({ field, fieldState }) => (
                            <CustomTextField
                                select
                                {...field}
                                label="State"
                                fullWidth
                                error={!!fieldState.error}
                                helperText={fieldState.error?.message}
                                onChange={(e) => {
                                    field.onChange(e); // keep RHF working
                                    setSelectedCity([]);
                                    setSelectedStateId(e.target.value); // your state update

                                }}
                            >
                                {(createData?.states?.length ?? 0) > 0 ? (
                                    createData.states.map(item => (
                                        <MenuItem key={item._id} value={String(item.state_id)}>
                                            {item?.state_name || ""}
                                        </MenuItem>
                                    ))
                                ) : (
                                    <MenuItem disabled value="">
                                        No State Available
                                    </MenuItem>
                                )}
                            </CustomTextField>
                        )}
                    />

                    {/* Source */}
                    <Controller
                        name="city_id"
                        control={control}
                        render={({ field, fieldState }) => (
                            <CustomTextField
                                select
                                {...field}
                                label="City"
                                fullWidth
                                error={!!fieldState.error}
                                helperText={fieldState.error?.message}
                            >
                                {(selectedCity?.length ?? 0) > 0 ? (
                                    selectedCity.map(item => (
                                        <MenuItem key={item._id} value={String(item.city_id)}>
                                            {item?.city_name}
                                        </MenuItem>
                                    ))
                                ) : (
                                    <MenuItem disabled value="">
                                        No City Available
                                    </MenuItem>
                                )}
                            </CustomTextField>
                        )}
                    />

                    {/* Pincode */}
                    <Controller
                        name="pincode"
                        control={control}
                        render={({ field, fieldState }) => (
                            <CustomTextField
                                {...field}
                                label="Pincode"
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

                    {/* Address */}
                    <Controller
                        name="address"
                        control={control}
                        render={({ field, fieldState }) => (
                            <CustomTextField
                                {...field}
                                label="Address"
                                fullWidth
                                multiline
                                error={!!fieldState.error}
                                helperText={fieldState.error?.message}
                                rows={3}
                            />
                        )}
                    />

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
        </Dialog>
    )
}

export default LeadsDialog
