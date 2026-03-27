'use client'

// React Imports
import { useEffect, useState } from 'react'

// MUI Imports
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    CircularProgress,
} from '@mui/material'

import Grid from "@mui/material/Grid2";

// Hook Form + Validation
import { useForm, Controller } from 'react-hook-form'
import { valibotResolver } from '@hookform/resolvers/valibot'
import {
    object,
    string,
    pipe,
    minLength,
    maxLength,
    regex
} from 'valibot'

import { toast } from 'react-toastify'

import { useSession } from 'next-auth/react'

// Components
import CustomTextField from '@core/components/mui/TextField'

import DialogCloseButton from '../DialogCloseButton'


// Schema (status removed)
const languageSchema = object({
    name: pipe(
        string(),
        minLength(1, 'Label name is required'),
        maxLength(100, 'Name can be of max 100 length'),
        regex(/^[A-Za-z\s]+$/, 'Only alphabets and spaces are allowed')
    )
})

const LabelDialog = ({ open, setOpen, title = '', fetchLanguageData, selectedLanguage, typeForm, tableData }) => {

    const [loading, setLoading] = useState(false)
    const { data: session } = useSession()
    const token = session?.user?.token
    const API_URL = process.env.NEXT_PUBLIC_API_URL

    const {
        control,
        handleSubmit,
        reset,
        setError,
        formState: { errors }
    } = useForm({
        resolver: valibotResolver(languageSchema),
        defaultValues: {
            name: '',
        }
    })

    useEffect(() => {
        if (open && selectedLanguage) {
            reset({
                name: selectedLanguage.label_name
            })
        }
    }, [open, selectedLanguage])

    const handleClose = () => {
        reset()
        setOpen(false)
    }

    const submitData = async (formData) => {

        const tableMenu = tableData.menu;

        if (tableMenu && tableMenu.length > 0) {

            let hasError = false;

            const name = formData?.name?.trim();

            if (!name) return; // Skip empty names (optional)               

            const existName = tableMenu.some(value =>
                value.label_name.trim().toLowerCase() === name.trim().toLowerCase()
            );

            if (existName) {
                setError(`name`, {
                    type: 'manual',
                    message: 'Label name must be unique.'
                });
                hasError = true;
            }

            if (hasError) return;

        }

        setLoading(true)

        try {
            const url = `${API_URL}/company/terminology/label`
            const method = 'POST'

            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            })

            const data = await response.json()

            if (response.ok) {

                fetchLanguageData?.()
                toast.success(`Label added successfully!`, {
                    autoClose: 700
                })
                handleClose()
            } else {
                console.error('Server error:', data)
            }
        } catch (err) {
            console.error('Submit error:', err)
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog
            fullWidth
            maxWidth="md"
            open={open}
            scroll="body"
            sx={{ '& .MuiDialog-paper': { overflow: 'visible' } }}
        >
            <DialogCloseButton onClick={handleClose}>
                <i className="tabler-x" />
            </DialogCloseButton>

            <DialogTitle variant="h4" className="text-center sm:pbs-16 sm:pbe-6 sm:pli-16">
                Add label
            </DialogTitle>

            <form onSubmit={handleSubmit(submitData)} noValidate>
                <DialogContent className="overflow-visible flex flex-col gap-6 sm:pli-16">
                    <>
                        <Grid item size={{ xs: 12, md: 11, }}>
                            <Controller
                                name="name"
                                control={control}
                                render={({ field }) => (
                                    <CustomTextField
                                        {...field}
                                        label="Label Name"
                                        placeholder="Enter label name"
                                        fullWidth
                                        error={!!errors?.name}
                                        helperText={errors?.name?.message}
                                    />
                                )}
                            />
                        </Grid>
                    </>
                </DialogContent>
                <DialogActions className="justify-center sm:pbe-16 sm:pli-16">
                    <Button variant="contained" type="submit" disabled={loading}>
                        {loading ? (
                            <CircularProgress
                                size={24}
                                sx={{
                                    color: 'white',
                                    position: 'absolute',
                                    top: '50%',
                                    left: '50%',
                                    mt: '-12px',
                                    ml: '-12px',
                                }}
                            />
                        ) : selectedLanguage ? 'Update' : 'Submit'}
                    </Button>
                    <Button variant="tonal" color="secondary" onClick={handleClose}>
                        Cancel
                    </Button>
                </DialogActions>
            </form>
        </Dialog>
    )
}

export default LabelDialog
