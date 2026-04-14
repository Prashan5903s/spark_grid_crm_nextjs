'use client'


import { useEffect, useState } from 'react'

import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    Button, MenuItem, CircularProgress, IconButton
} from '@mui/material'

import Grid from "@mui/material/Grid2"

import { useForm, useFieldArray, Controller } from 'react-hook-form'
import { valibotResolver } from '@hookform/resolvers/valibot'
import { object, string, array, pipe, minLength, maxLength, regex, optional } from 'valibot'
import { useSession } from 'next-auth/react'

import { toast } from 'react-toastify'

import CustomTextField from '@core/components/mui/TextField'

import DialogCloseButton from '../DialogCloseButton'

// Validation regex
const nameRegex = /^[A-Za-z0-9\s]+$/

// Single branch schema (for standalone branch form)
const singleBranchSchema = object({
    name: pipe(
        string(),
        minLength(1, 'Branch name is required'),
        maxLength(50, 'Branch name can be a maximum of 50 characters'),
        regex(nameRegex, 'Only alphabets, numbers, and spaces are allowed')
    ),
    code: optional(pipe(
        string(),
        maxLength(40, 'Branch code can be a maximum of 40 characters'),
    )),
    regionId: pipe(string(), minLength(1, 'Region is required'))
})

// Multiple branches for a selected region
const branchItemSchema = object({
    name: pipe(
        string(),
        minLength(1, 'Branch name is required'),
        maxLength(50, 'Branch name can be a maximum of 50 characters'),
        regex(nameRegex, 'Only alphabets, numbers, and spaces are allowed')
    ),
    code: optional(pipe(
        string(),
        maxLength(40, 'Branch code can be a maximum of 40 characters'),
    )),
    branchId: optional(string()),
    regionId: pipe(string(), minLength(1, 'Region is required'))
})

const multiBranchSchema = object({
    branch: pipe(
        array(branchItemSchema),
        minLength(1, 'At least one branch must be added'),
        maxLength(50, 'Maximum of 50 branches allowed')
    )
})

const BranchDialog = ({
    open,
    setOpen,
    title = '',
    fetchBranchData,
    selectedRegion,
    typeForm,
    selectedRegionData,
    tableData
}) => {
    const { data: session } = useSession()
    const token = session?.user?.token
    const API_URL = process.env.NEXT_PUBLIC_API_URL
    const isEdit = Boolean(selectedRegion || selectedRegionData)

    const {
        control,
        handleSubmit,
        reset,
        setError,
        clearErrors,
        formState: { errors }
    } = useForm({
        resolver: valibotResolver(selectedRegion ? multiBranchSchema : singleBranchSchema),
        defaultValues: {
            branch: [{ name: '', code: '', regionId: '', branchId: '' }],
            name: '',
            code: '',
            regionId: ''
        }
    })

    const { fields, append, remove } = useFieldArray({
        control,
        name: 'branch'
    })

    const [loading, setLoading] = useState(false)
    const [branchOptions, setBranchOptions] = useState([])

    const handleClose = () => {
        reset()
        setOpen(false)
    }

    useEffect(() => {
        if (typeForm && selectedRegion) {
            const regionId = selectedRegion?.data?._id || ''

            reset({
                branch: selectedRegion?.data?.branch?.map(r => ({
                    name: r.name || '',
                    code: r.code || '',
                    branchId: r._id || '',
                    regionId
                })) || [{ name: '', code: '', regionId }]
            })
        } else if (typeForm && selectedRegionData) {
            reset({
                name: selectedRegionData?.data?.name || '',
                code: selectedRegionData?.data?.code || '',
                regionId: selectedRegionData?.regionId || ''
            })
        }
    }, [typeForm, selectedRegion, selectedRegionData, reset])

    const loadRegionData = async () => {
        try {
            const response = await fetch(`${API_URL}/company/region`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                }
            })

            const data = await response.json()

            if (response.ok) {
                setBranchOptions(data?.data || [])
            }
        } catch (error) {
            console.error('Error loading region:', error)
        }
    }

    useEffect(() => {
        if (API_URL && token && !selectedRegion) {
            loadRegionData()
        }
    }, [API_URL, token])

    const checkUniqueField = async (datas) => {
        try {
            const response = await fetch(`${API_URL}/company/branch/unique/check`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(datas)
            });

            const data = await response.json();

            if (!response.ok) {
                console.error("Server error:", data);

                return null; // or throw new Error(data.message)
            }

            return data;

        } catch (error) {
            console.error("Fetch error:", error.message || error);

            return null;
        }
    };

    const submitData = async (formData) => {
        let hasError = false;
        const branchFields = formData?.['branch'];

        if (selectedRegion) {
            const nameCount = new Map();
            const codeCount = new Map();

            const uniqueCheck = await checkUniqueField(branchFields);
            const uniqueNameIndex = uniqueCheck?.['matchedNameIndexes'] || [];
            const uniqueCodeIndex = uniqueCheck?.['matchedCodeIndexes'] || [];

            const backendErrorIndexes = {
                name: new Set(uniqueNameIndex),
                code: new Set(uniqueCodeIndex),
            };

            // Backend error: duplicate name
            uniqueNameIndex.forEach((index) => {
                hasError = true;
                setError(`branch.${index}.name`, {
                    type: 'duplicate',
                    message: 'Branch name already exists',
                });
            });

            // Backend error: duplicate code
            uniqueCodeIndex.forEach((index) => {
                hasError = true;
                setError(`branch.${index}.code`, {
                    type: 'duplicate',
                    message: 'Branch code already exists',
                });
            });

            // Count duplicates in frontend
            branchFields.forEach((branch) => {
                const name = branch.name?.trim().toLowerCase();
                const code = branch.code?.trim().toLowerCase();

                if (name) nameCount.set(name, (nameCount.get(name) || 0) + 1);
                if (code) codeCount.set(code, (codeCount.get(code) || 0) + 1);
            });

            branchFields.forEach((branch, index) => {
                const name = branch.name?.trim().toLowerCase();
                const code = branch.code?.trim().toLowerCase();

                if (
                    name &&
                    nameCount.get(name) > 1 &&
                    !backendErrorIndexes.name.has(index)
                ) {
                    hasError = true;
                    setError(`branch.${index}.name`, {
                        type: 'duplicate',
                        message: 'Branch name must be unique',
                    });
                } else if (name && !backendErrorIndexes.name.has(index)) {
                    clearErrors(`branch.${index}.name`);
                }

                if (
                    code &&
                    codeCount.get(code) > 1 &&
                    !backendErrorIndexes.code.has(index)
                ) {
                    hasError = true;
                    setError(`branch.${index}.code`, {
                        type: 'duplicate',
                        message: 'Branch code must be unique',
                    });
                } else if (code && !backendErrorIndexes.code.has(index)) {
                    clearErrors(`branch.${index}.code`);
                }
            });
        } else {
            const name = formData?.name?.trim().toLowerCase();
            const code = formData?.code?.trim().toLowerCase();

            const branchId = selectedRegionData?.data?._id?.toString();

            const isEditMode = !!selectedRegionData;

            const nameExist = tableData.some(item => {
                const currentName = item.data.name?.trim().toLowerCase();
                const currentId = item.data._id?.toString();

                return currentName === name && (!isEditMode || currentId !== branchId);
            });

            const codeExist = tableData.some(item => {
                const currentCode = item.data.code?.trim().toLowerCase();
                const currentId = item.data._id?.toString();

                return currentCode === code && (!isEditMode || currentId !== branchId);
            });

            if (nameExist) {
                hasError = true;
                setError('name', {
                    type: 'duplicate',
                    message: 'Branch name already exists',
                });
            }

            if (codeExist) {
                hasError = true;
                setError('code', {
                    type: 'duplicate',
                    message: 'Branch code already exists',
                });
            }
        }

        if (hasError) return;

        setLoading(true);

        try {
            const url = selectedRegion
                ? `${API_URL}/company/app/branch/region/${selectedRegion.data._id}`
                : selectedRegionData
                    ? `${API_URL}/company/branch/data/${selectedRegionData.data._id}`
                    : `${API_URL}/company/branch/data`;

            const method = selectedRegionData ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(formData),
            });

            const data = await response.json();

            if (response.ok) {

                toast.success(`Branch ${isEdit ? 'updated' : 'added'} successfully!`, {
                    autoClose: 1000,
                });
                handleClose();
                window.location.reload();
            } else {
                toast.error(data?.message || 'Server error');
            }
        } catch (err) {
            toast.error('Network or server error');
            console.error('Submit error:', err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog fullWidth maxWidth="md" open={open} scroll="body"
            sx={{ '& .MuiDialog-paper': { overflow: 'visible' } }}
        >
            <DialogCloseButton onClick={handleClose}>
                <i className="tabler-x" />
            </DialogCloseButton>

            <DialogTitle variant="h4" className="text-center sm:pbs-16 sm:pbe-6 sm:pli-16">
                {isEdit ? 'Edit Branch' : 'Add Branch'}
            </DialogTitle>

            <form onSubmit={handleSubmit(submitData)} noValidate>
                {selectedRegion ? (
                    <DialogContent className="overflow-visible flex flex-col gap-6 sm:pli-16">
                        {fields.map((field, index) => (
                            <Grid container spacing={2} key={field.id} alignItems="center">
                                <Grid item size={{ xs: 12, }}>
                                    <Controller
                                        name={`branch.${index}.name`}
                                        control={control}
                                        render={({ field }) => (
                                            <CustomTextField
                                                {...field}
                                                required
                                                label="Branch Name"
                                                placeholder="Enter branch name"
                                                fullWidth
                                                onChange={(e) => {
                                                    const allowed = e.target.value.replace(/[^A-Za-z0-9 ]/g, '');

                                                    field.onChange(allowed);
                                                }}
                                                error={!!errors.branch?.[index]?.name}
                                                helperText={errors.branch?.[index]?.name?.message}
                                            />
                                        )}
                                    />
                                </Grid>
                                <Grid item size={{ xs: 12, }}>
                                    <Controller
                                        name={`branch.${index}.code`}
                                        control={control}
                                        render={({ field }) => (
                                            <CustomTextField
                                                {...field}
                                                label="Branch Code"
                                                placeholder="Enter branch code (optional)"
                                                fullWidth
                                                onChange={(e) => {
                                                    const allowed = e.target.value.replace(/[^A-Za-z0-9 ]/g, '');

                                                    field.onChange(allowed);
                                                }}
                                                error={!!errors.branch?.[index]?.code}
                                                helperText={errors.branch?.[index]?.code?.message}
                                            />
                                        )}
                                    />
                                </Grid>
                                <Grid item size={{ xs: 12, md: 1, }} className="flex justify-end">
                                    {fields.length > 1 && (
                                        <IconButton
                                            color="error"
                                            onClick={() => remove(index)}
                                            sx={{ mt: 1 }}
                                        >
                                            <i className="tabler-x" />
                                        </IconButton>
                                    )}
                                </Grid>
                            </Grid>
                        ))}

                        <Button
                            size="small"
                            variant="contained"
                            onClick={() => {
                                append({ name: '', code: '', regionId: selectedRegion?.data?._id || '' })
                            }}
                            startIcon={<i className="tabler-plus" />}
                            sx={{ mt: 2, alignSelf: 'flex-start' }}
                        >
                            Add more
                        </Button>
                    </DialogContent>
                ) : (
                    <DialogContent className="sm:pli-16">
                        <Grid container spacing={2}>
                            <Grid item size={{ xs: 12, md: 11, }}>
                                <Controller
                                    name="name"
                                    control={control}
                                    render={({ field }) => (
                                        <CustomTextField
                                            {...field}
                                            required
                                            label="Branch Name"
                                            placeholder="Enter branch name"
                                            fullWidth
                                            error={!!errors.name}
                                            helperText={errors.name?.message}
                                        />
                                    )}
                                />
                            </Grid>
                            <Grid item size={{ xs: 12, md: 11, }}>
                                <Controller
                                    name="code"
                                    control={control}
                                    render={({ field }) => (
                                        <CustomTextField
                                            {...field}
                                            label="Branch Code"
                                            placeholder="Enter branch code (optional)"
                                            fullWidth
                                            error={!!errors.code}
                                            helperText={errors.code?.message}
                                            onChange={(e) => {
                                                const allowed = e.target.value.replace(/[^A-Za-z0-9 ]/g, '');

                                                field.onChange(allowed);
                                            }}
                                        />
                                    )}
                                />
                            </Grid>
                            <Grid item size={{ xs: 12, md: 11, }}>
                                <Controller
                                    name="regionId"
                                    control={control}
                                    render={({ field }) => (
                                        <CustomTextField
                                            {...field}
                                            required
                                            select
                                            fullWidth
                                            label="Region"
                                            value={field.value ?? ''}
                                            onChange={field.onChange}
                                            error={!!errors.regionId}
                                            helperText={errors.regionId?.message}
                                        >
                                            {branchOptions.length > 0 ? (
                                                branchOptions.map((item) => (
                                                    <MenuItem key={item.data._id} value={item.data._id}>
                                                        {item.data.name}
                                                    </MenuItem>
                                                ))
                                            ) : (
                                                <MenuItem disabled>No data</MenuItem>
                                            )}
                                        </CustomTextField>
                                    )}
                                />
                            </Grid>
                        </Grid>
                    </DialogContent>
                )}

                <DialogActions className="justify-center sm:pbe-16 sm:pli-16">
                    <Button variant="contained" type="submit" disabled={loading}>
                        {loading ? (
                            <CircularProgress size={24} sx={{
                                color: 'white', position: 'absolute',
                                top: '50%', left: '50%', mt: '-12px', ml: '-12px'
                            }} />
                        ) : isEdit ? 'Update' : 'Submit'}
                    </Button>
                    <Button variant="tonal" color="secondary" onClick={handleClose}>
                        Cancel
                    </Button>
                </DialogActions>
            </form>
        </Dialog>
    )
}

export default BranchDialog
