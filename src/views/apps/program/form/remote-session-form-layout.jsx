'use client'

// React Imports
import { useState, useEffect } from 'react'

// MUI Imports

import { useRouter, useParams } from 'next/navigation'

import Card from '@mui/material/Card'
import Button from '@mui/material/Button'
import Grid from '@mui/material/Grid2'
import Divider from '@mui/material/Divider'
import { useSession } from 'next-auth/react'
import MenuItem from '@mui/material/MenuItem'
import CardHeader from '@mui/material/CardHeader'
import Typography from '@mui/material/Typography'

import { useForm, Controller, useFormContext } from 'react-hook-form'

import CardContent from '@mui/material/CardContent'

import { valibotResolver } from '@hookform/resolvers/valibot';

import { toast } from 'react-toastify'

import CardActions from '@mui/material/CardActions'

import {
    object,
    string,
    minLength,
    maxLength,
    pipe,
    boolean,
    check,
    optional,
    email,
    custom,
    array
} from 'valibot';

import CircularProgress from '@mui/material/CircularProgress'

import AppReactDatepicker from '@/libs/styles/AppReactDatepicker'

import { useApi } from '../../../../utils/api';

import SkeletonFormComponent from '../../../../components/skeleton/form/page'

import CustomTextField from '@core/components/mui/TextField'

// Third-party Imports

const RemoteSessionModuleFormLayout = ({ setLayoutType }) => {

    const URL = process.env.NEXT_PUBLIC_API_URL
    const public_url = process.env.NEXT_PUBLIC_ASSETS_URL;
    const { data: session } = useSession() || {}
    const token = session?.user?.token
    const [createData, setCreateData] = useState();
    const [stateData, setStateData] = useState();
    const [stateId, setStateId] = useState();
    const [module, setmodule] = useState();
    const [isLoading, setIsLoading] = useState(false);
    const { doGet, doPost } = useApi();
    const [loading, setLoading] = useState(false)
    const [date, setDate] = useState(new Date())
    const [time, setTime] = useState(new Date())

    const router = useRouter();

    const { lang: locale, id: id } = useParams()

    const schema = object({
        title: pipe(
            string(),
            minLength(1, 'Title is required'),
            maxLength(400, 'Title can be a maximum of 400 characters')
        ),
        status: boolean(),
        platform: pipe(
            string(),
            minLength(1, 'Category is required'),
        ),
        description: pipe(
            string(),
            minLength(1, 'Description is required'),
        ),
    });

    // States
    const [formData, setFormData] = useState({
        title: '',
        platform: '',
        status: false,
        description: ''
    })

    // Hooks
    const {
        control,
        reset,
        handleSubmit,
        setError,
        setValue,
        formState: { errors }
    } = useForm({
        resolver: valibotResolver(schema),
        defaultValues: {
            title: '',
            platform: '',
            status: '',
            description: ''
        }
    });



    const editFormData = async () => {
        try {
            const response = await fetch(`${URL}/admin/user/${id}/edit`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
            });

            const result = await response.json();

            if (!response.ok) {
                // If server responded with an error status, handle it explicitly
                console.error('Failed to fetch user data:', result.message || result);

                return;
            }

            if (result?.data) {
                setmodule(result.data);
            } else {
                console.warn('No data found in response:', result);
            }

        } catch (error) {
            console.error('Network or parsing error:', error);
        }
    };

    const loadData = async () => {

        // try {
        //     const categoryData = await doGet(`admin/module/categories`);
        //     setCreateData(prevData => ({
        //         ...prevData,
        //         categories: categoryData.categories,
        //     }));

        //     setIsLoading(false);
        // } catch (error) {
        //     console.error('Error loading data:', error.message);
        // }
        setIsLoading(false);
    };


    useEffect(() => {
        if (URL && token) {
            loadData();

            if (id) {
                editFormData();
            }
        }

    }, [URL, token, id])

    useEffect(() => {
        if (id && module) {
            reset({
                title: module.title,
                status: module.status,
                platform: module?.platform || '',
            });
        }
    }, [id, module, setValue])


    const submitFormData = async (values) => {
        try {

            // if (values.roles.length == 0) {
            //     setError('roles', {
            //         type: 'manual',
            //         message: 'Please select at least one role.'
            //     });

            //     return;
            // }

            const formData = new FormData();

            // Append file first — must match multer field name
            if (values.photo) {
                formData.append('photo', values.photo);
            }

            // Append all other fields
            Object.entries(values).forEach(([key, value]) => {
                if (key !== 'photo') {
                    formData.append(key, value);
                }
            });
            setLoading(true);

            const response = await fetch(id ? `${URL}/admin/user1/${id}` : `${URL}/admin/user1`, {
                method: id ? "PUT" : "POST",
                headers: {
                    Authorization: `Bearer ${token}` // ✅ No content-type here
                },
                body: formData
            });

            const data = await response.json();

            if (response.ok) {
                router.push(`/${locale}/apps/user/list`)
                toast.success(data.message, {
                    autoClose: 1000, // in milliseconds
                });
            } else {
                if (data?.message) {
                    toast.error(data?.message, {
                        autoClose: 1200, // in milliseconds
                    });

                }

            }
        } catch (error) {
            if (data?.message) {

                toast.error(data?.message, {
                    autoClose: 1200, // in milliseconds

                });
            }

        } finally {
            setLoading(false)
        }
    };

    const onSubmit = async (data) => {
        const newUser = {
            ...data,
            photo: file
        };

        submitFormData(newUser);
    };

    const handleReset = () => {
        handleClose()
        setFormData(initialData)
    }

    const [file, setFile] = useState(null);

    useEffect(() => {
        if (stateId && stateData) {
            const data = stateData && stateData.find(item => item.state_id == stateId);
            const city = data['cities'];

            setCityData(city);
        }
    }, [stateId, stateData])

    if (isLoading) {
        return <SkeletonFormComponent />
    }

    return (
        <Card>
            <CardHeader title={id ? `Edit ${module?.title}` : 'Define your Live Session'} />
            <Divider />
            <form onSubmit={handleSubmit(onSubmit)} noValidate encType="multipart/form-data">
                <CardContent>
                    <Grid container spacing={5}>
                        <Grid size={{ xs: 12 }}>
                            <Typography variant='body2' className='font-medium'>
                                1. Session details
                            </Typography>
                        </Grid>
                        <Grid size={{ xs: 12, sm: 12 }}>
                            <Controller
                                name="title"
                                control={control}
                                render={({ field }) => (
                                    <CustomTextField
                                        {...field}
                                        fullWidth
                                        label="Live Session Name*"
                                        placeholder="Live Session Name"
                                        error={!!errors.title}
                                        helperText={errors.title?.message}
                                    />
                                )}
                            />
                        </Grid>

                        <Grid size={{ xs: 12, sm: 6 }}>
                            <Controller
                                name="platform"
                                control={control}
                                render={({ field }) => (
                                    <CustomTextField
                                        {...field}
                                        select
                                        fullWidth
                                        label="Delivery Platform"
                                        value={field.value ?? ''} // ✅ ensure controlled
                                        onChange={(e) => {
                                            field.onChange(e.target.value); // ✅ update RHF state
                                        }}
                                        error={!!errors.platform}
                                        helperText={errors.platform?.message}
                                    >
                                        <MenuItem value="Google Meet">Google Meet</MenuItem>
                                        <MenuItem value="MS Team">MS Team</MenuItem>
                                        <MenuItem value="Zoom">Zoom</MenuItem>
                                    </CustomTextField>
                                )}
                            />

                        </Grid>

                        <Grid size={{ xs: 12, sm: 6 }}>
                            <Controller
                                name="status"
                                control={control}
                                render={({ field }) => (
                                    <CustomTextField
                                        {...field}
                                        select
                                        fullWidth
                                        label="Status*"
                                        error={!!errors.status}
                                        helperText={errors.status?.message}
                                    >
                                        <MenuItem value={true}>Published</MenuItem>
                                        <MenuItem value={false}>Draft</MenuItem>
                                    </CustomTextField>
                                )}
                            />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <Controller
                                name="link"
                                control={control}
                                render={({ field }) => (
                                    <CustomTextField
                                        {...field}
                                        fullWidth
                                        label="Resource link"
                                        variant="outlined"
                                        placeholder="Resource link"
                                        className="mbe-2"
                                        multiline
                                        rows={2}
                                        error={!!errors.link}
                                        helperText={errors?.link?.message}
                                    />
                                )}
                            />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <Controller
                                name="description"
                                control={control}
                                render={({ field }) => (
                                    <CustomTextField
                                        {...field}
                                        fullWidth
                                        label="Description"
                                        variant="outlined"
                                        placeholder="Enter Description"
                                        className="mbe-2"
                                        multiline
                                        rows={2}
                                        error={!!errors.description}
                                        helperText={errors?.description?.message}
                                    />
                                )}
                            />
                        </Grid>
                    </Grid>

                    <Grid container spacing={5}>
                        <Grid size={{ xs: 12 }}>
                            <Typography variant='body2' className='font-medium'>
                                2. Schedules
                            </Typography>
                        </Grid>
                        <Grid size={{ xs: 12, sm: 4 }}>
                            <AppReactDatepicker
                                selected={date}
                                id='date-input'
                                onChange={date => setDate(date)}
                                placeholderText='Select a date'
                                customInput={<CustomTextField label='Date' fullWidth />}
                            />
                        </Grid>
                        <Grid size={{ xs: 12, lg: 4 }}>
                            <AppReactDatepicker
                                showTimeSelect
                                selected={time}
                                timeIntervals={15}
                                showTimeSelectOnly
                                dateFormat='h:mm aa'
                                id='time-from-picker'
                                onChange={date => setTime(date)}
                                customInput={<CustomTextField label='From' fullWidth />}
                            />
                        </Grid>
                        <Grid size={{ xs: 12, lg: 4 }}>
                            <AppReactDatepicker
                                showTimeSelect
                                selected={time}
                                timeIntervals={15}
                                showTimeSelectOnly
                                dateFormat='h:mm aa'
                                id='time-to-picker'
                                onChange={date => setTime(date)}
                                customInput={<CustomTextField label='To' fullWidth />}
                            />
                        </Grid>
                    </Grid>
                </CardContent>
                <Divider />
                <CardActions>
                    <Button
                        type='submit'
                        variant='contained'
                        disabled={loading}
                        sx={{ height: 40, position: 'relative' }}
                    >
                        {loading ? (
                            <CircularProgress
                                size={24}
                                sx={{
                                    color: 'white',
                                    position: 'absolute',
                                    top: '50%',
                                    left: '50%',
                                    marginTop: '-12px',
                                    marginLeft: '-12px',
                                }}
                            />
                        ) : (
                            'Submit'
                        )}
                    </Button>
                    <Button variant="tonal" color="error" type="reset" onClick={(e) => { setLayoutType('') }}>
                        Cancel
                    </Button>
                </CardActions>
            </form>

        </Card>
    )
}

export default RemoteSessionModuleFormLayout
