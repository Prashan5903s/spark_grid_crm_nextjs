'use client'

import React, { useEffect, useState } from 'react'

import { useParams } from 'next/navigation'

// MUI Imports

import Grid from '@mui/material/Grid'

import Divider from '@mui/material/Divider'

import { useSession } from 'next-auth/react'
import CardHeader from '@mui/material/CardHeader'
import Typography from '@mui/material/Typography'
import {
    Box,
    TextField,
    Card,
    Button,
    Paper
} from '@mui/material'

// Form Imports
import { useForm, Controller } from 'react-hook-form'
import { valibotResolver } from '@hookform/resolvers/valibot'
import { object, string, minLength, maxLength, pipe } from 'valibot'

// Third-party Imports

import { toast } from 'react-toastify'

import SkeletonFormComponent from '../skeleton/form/page'
import PermissionGuard from '@/hocs/PermissionClientGuard'

const LabelFormLayout = () => {
    const URL = process.env.NEXT_PUBLIC_API_URL
    const { data: session } = useSession() || {}
    const token = session?.user?.token
    const { lang: locale } = useParams()

    const [labels, setLabels] = useState(null)

    // Step 1: Fetch labels first
    useEffect(() => {
        const fetchLabelList = async () => {
            try {
                const response = await fetch(`${URL}/company/app/menu/label/listing/${locale}`, {
                    method: "GET",
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`
                    },
                });

                const result = await response.json();

                if (response.ok) {
                    const labelData = result?.data

                    setLabels(labelData)

                    const defaultValues = Object.fromEntries(
                        labelData.map(label => [
                            label.key,
                            {
                                singular: label.singularValue || '',
                                plural: label.pluralValue || ''
                            }
                        ])
                    )

                    reset(defaultValues)
                } else {
                    toast.error(result?.message || 'Something went wrong!', { autoClose: 1500 })
                }
            } catch (error) {
                console.error(error)
                toast.error('Network error. Please try again.', { autoClose: 1500 })
            }
        }

        if (URL && token) {
            fetchLabelList()
        }
    }, [URL, token])

    // Step 2: Build validation schema based on labels
    const schema = labels
        ? object(
            Object.fromEntries(
                labels.map(label => [
                    label.key,
                    object({
                        singular: pipe(string(), minLength(1, 'Singular is required'), maxLength(255)),
                        plural: pipe(string(), minLength(1, 'Plural is required'), maxLength(255))
                    })
                ])
            )
        )
        : object({}) // default fallback

    // Step 3: Init form after schema is ready
    const {
        control,
        handleSubmit,
        formState: { errors },
        reset
    } = useForm({
        resolver: valibotResolver(schema),
        defaultValues: {}
    })

    const onSubmit = async (data) => {
        try {
            const response = await fetch(`${URL}/company/app/menu/label/listing/${locale}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(data)
            })

            const result = await response.json()

            if (response.ok) {
                toast.success('Labels updated successfully!', { autoClose: 1000 })
                
                // Optional: Re-fetch or give visual confirmation
                // fetchLabelList(); // OR navigate somewhere
                window.location.reload()
            } else {
                toast.error(result?.message || 'Something went wrong!', { autoClose: 1500 })
            }
        } catch (error) {
            console.error(error)
            toast.error('Network error. Please try again.', { autoClose: 1500 })
        }
    }

    if (!labels) return <SkeletonFormComponent />

    return (
        <PermissionGuard
            element={'hasLabelPermission'}
            locale={locale}
        >
            <Card>
                <CardHeader title='Label' />
                <Divider />
                <form onSubmit={handleSubmit(onSubmit)} noValidate>
                    <Paper elevation={3} sx={{ p: 3 }}>
                        <Grid container spacing={2} alignItems="center" pt={2} mb={2}>
                            <Grid item sm={3} />
                            <Grid item sm={4.5}>
                                <Typography variant="subtitle1" fontWeight="bold">Singular</Typography>
                            </Grid>
                            <Grid item sm={4.5}>
                                <Typography variant="subtitle1" fontWeight="bold">Plural</Typography>
                            </Grid>
                        </Grid>

                        {labels.map((field) => (
                            <Grid container spacing={2} alignItems="center" key={field.key} pl={4} pr={6} mb={2}>
                                <Grid item sm={3}>
                                    <Typography variant="body1" fontWeight="medium">{field.label}</Typography>
                                </Grid>

                                <Grid item sm={4.5}>
                                    <Controller
                                        name={`${field.key}.singular`}
                                        control={control}
                                        render={({ field: controllerField }) => (
                                            <TextField
                                                {...controllerField}
                                                fullWidth
                                                placeholder="Enter singular value"
                                                size="small"
                                                error={!!errors?.[field.key]?.singular}
                                                helperText={errors?.[field.key]?.singular?.message}
                                            />
                                        )}
                                    />
                                </Grid>

                                <Grid item sm={4.5}>
                                    <Controller
                                        name={`${field.key}.plural`}
                                        control={control}
                                        render={({ field: controllerField }) => (
                                            <TextField
                                                {...controllerField}
                                                fullWidth
                                                placeholder="Enter plural value"
                                                size="small"
                                                error={!!errors?.[field.key]?.plural}
                                                helperText={errors?.[field.key]?.plural?.message}
                                            />
                                        )}
                                    />
                                </Grid>
                            </Grid>
                        ))}

                        <Box display="flex" justifyContent="center" mt={4} pb={4}>
                            <Button type="submit" variant="contained" color="primary">
                                Save
                            </Button>
                        </Box>
                    </Paper>
                </form>
            </Card>
        </PermissionGuard>
    )
}

export default LabelFormLayout
