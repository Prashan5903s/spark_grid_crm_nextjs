'use client'

// React Imports
import { useState, useEffect } from 'react'

// MUI Imports

import { useRouter, useParams, useSearchParams } from 'next/navigation'

import Card from '@mui/material/Card'
import Button from '@mui/material/Button'
import Grid from '@mui/material/Grid2'
import Divider from '@mui/material/Divider'
import { useSession } from 'next-auth/react'
import MenuItem from '@mui/material/MenuItem'
import Box from '@mui/material/Box'
import Avatar from '@mui/material/Avatar'
import CardHeader from '@mui/material/CardHeader'
import CircularProgress from '@mui/material/CircularProgress'



import Typography from '@mui/material/Typography'

import { useForm, Controller, useFormContext } from 'react-hook-form'

import CardContent from '@mui/material/CardContent'

import InputAdornment from '@mui/material/InputAdornment'


import IconButton from '@mui/material/IconButton'

import { valibotResolver } from '@hookform/resolvers/valibot';

import { useDropzone } from 'react-dropzone'

import { toast } from 'react-toastify'

// Components Imports

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

import DirectionalIcon from '@components/DirectionalIcon'
import { getLocalizedUrl } from '@/utils/i18n'

import AppReactDropzone from '@/libs/styles/AppReactDropzone';

import CategoryDialog from '@components/dialogs/category/page'

import { useApi } from '../../../../../utils/api';

import SkeletonFormComponent from '../../../../../components/skeleton/form/page'

import CustomTextField from '@core/components/mui/TextField'

// Third-party Imports


const ProgramFormLayout = ({ setLayoutType, setShowCards, setModuleData }) => {

    const URL = process.env.NEXT_PUBLIC_API_URL
    const public_url = process.env.NEXT_PUBLIC_ASSETS_URL;
    const { data: session } = useSession() || {}
    const token = session?.user?.token
    const [categories, setCategories] = useState([]);
    const [createData, setCreateData] = useState({ categories: [] });
    const [training, setTraining] = useState();
    const [isLoading, setIsLoading] = useState(true);
    const { doGet, doPost, doPostFormData } = useApi();
    const [loading, setLoading] = useState(false)
    const [files, setFiles] = useState([])
    const [preview, setPreview] = useState(null);
    const [open, setOpen] = useState(false)

    const searchParams = useSearchParams();
    const step = searchParams.get('step');

    const router = useRouter();

    const { lang: locale, id: id } = useParams()

    const schema = object({
        title: pipe(
            string(),
            minLength(1, 'Title is required'),
            maxLength(400, 'Title can be a maximum of 400 characters')
        ),

        // status: boolean(),
        category_id: pipe(
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
        category_id: '',
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
            category_id: '',
            status: '',
            description: ''
        }
    });

    const { getRootProps, getInputProps } = useDropzone({
        multiple: false,
        maxSize: 2000000,
        accept: {
            'image/jpeg': ['.jpeg', '.jpg'],
            'image/png': ['.png'],
        },
        onDrop: (acceptedFiles) => {
            if (!acceptedFiles.length) return;

            setFiles(acceptedFiles.map(file => Object.assign(file)))

            const file = acceptedFiles[0];
            const reader = new FileReader();

            reader.onload = (e) => {

                const base64 = e.target.result;

                setPreview(base64); // use this to render <img src={base64} />
            };

            reader.readAsDataURL(file);
        },
        onDropRejected: (rejectedFiles) => {

            const errorMessage = rejectedFiles.map(file => {

                if (file.errors.length > 0) {

                    return file.errors.map(error => {
                        switch (error.code) {
                            case 'file-invalid-type':
                                return `Invalid file type for ${file.file.name}.`;
                            case 'file-too-large':
                                return `File ${file.file.name} is too large.`;
                            case 'too-many-files':
                                return `Too many files selected.`;
                            default:
                                return `Error with file ${file.file.name}.`;
                        }
                    }).join(' ');
                }

                return `Error with file ${file.file.name}.`;
            });

            errorMessage.map(error => {
                toast.error(error, {
                    hideProgressBar: false
                });
            })

        }
    })

    // const img = files.map(file => (
    //     <img key={file.name} alt={file.name} className='single-file-image' src={URL.createObjectURL(file)} />
    // ))

    const loadData = async () => {
        const result = await doGet(`admin/categories?type=training&status=true`);

        setCreateData(prevData => ({
            ...prevData,
            categories: result
        }));
        setIsLoading(false);
    };

    const getModule = async () => {

        const result = await doGet(`admin/training/${id}`);

        setTraining(result);
        setModuleData(result);
    };

    const onLoadCategories = async (items) => {
        loadData();
    };

    const handleNextToCard = async () => {
        setShowCards(true);
    };

    const setOpenCategoryModal = async () => {
        setOpen(true);
    };


    useEffect(() => {
        if (URL && token) {

            setIsLoading(true);
            loadData();

            if (id) {
                getModule();
                setIsLoading(false);
            }
        }

    }, [URL, token, id])

    useEffect(() => {
        if (id && training) {
            reset({
                title: training?.title || '',
                status: training?.status || '',
                description: training?.description || '',
                category_id: training?.category_id || '',
            });
        }
    }, [id, training, setValue])

    useEffect(() => {
        //if (!router.isReady) return;

        if (searchParams.get('showCards')) {
            setShowCards(true)
        }
    }, [router.isReady]);


    const onSubmit = async (data) => {
        const endpoint = id ? `admin/training/${id}` : `admin/training`;

        const newData = {
            ...data,
            file: files[0]
        };

        setLoading(true);

        await doPostFormData({
            endpoint,
            values: newData,
            method: id ? 'PUT' : 'POST',
            successMessage: '',
            errorMessage: '',
            onSuccess: (response) => {
                toast.success(response.message);

                // if (!id) {
                //     router.replace(`/${locale}/apps/modules/form/${response.data._id}?showCards=1`);
                //     toast.success(response.message, {
                //         autoClose: 700
                //     });
                // } else {
                //     setShowCards(true); // Only run if no redirection
                //     setModuleData(response.data);
                //     toast.success(response.message);
                // }
            },
        });

        setLoading(false);
    };

    if (isLoading) {
        return <SkeletonFormComponent />
    }

    return (
        <>

            <Card>
                <CardHeader
                    title={id ? `Edit ${training?.title}` : 'Add Program'}
                    action={
                        <Button
                            variant='outlined'
                            startIcon={<DirectionalIcon ltrIconClass='tabler-arrow-left' rtlIconClass='tabler-arrow-right' />}
                            onClick={() => router.push(getLocalizedUrl('/apps/program', locale))}
                        >
                            Back to Trainings
                        </Button>
                    }
                />
                <Divider />
                <form onSubmit={handleSubmit(onSubmit)} noValidate encType="multipart/form-data">
                    <CardContent>
                        <Grid container spacing={5}>
                            <Grid size={{ xs: 12, sm: 6 }}>
                                <Controller
                                    name="title"
                                    control={control}
                                    render={({ field }) => (
                                        <CustomTextField
                                            {...field}
                                            fullWidth
                                            label="Title*"
                                            placeholder="Title"
                                            error={!!errors.title}
                                            helperText={errors.title?.message}
                                        />
                                    )}
                                />
                            </Grid>

                            <Grid size={{ xs: 12, sm: 6 }}>
                                <Controller
                                    name="category_id"
                                    control={control}
                                    render={({ field }) => (
                                        <CustomTextField
                                            {...field}
                                            select
                                            fullWidth
                                            label="Category*"
                                            value={field.value ?? ''} // ✅ ensure controlled
                                            onChange={(e) => {
                                                field.onChange(e.target.value); // ✅ update RHF state
                                            }}
                                            error={!!errors.category_id}
                                            helperText={errors.category_id?.message}

                                            InputProps={{
                                                endAdornment: (

                                                    <IconButton edge="end" onClick={() => setOpenCategoryModal(true)}>
                                                        <i className='tabler-plus text-textSecondary' />
                                                    </IconButton>

                                                )
                                            }}
                                        >
                                            {createData?.categories?.length > 0 ? (
                                                createData?.categories.map((item) => (
                                                    <MenuItem key={item._id} value={item._id}>
                                                        {item.name}
                                                    </MenuItem>
                                                ))
                                            ) : (
                                                <MenuItem value="1">No data</MenuItem>
                                            )}
                                        </CustomTextField>
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
                                            label="Description*"
                                            variant="outlined"
                                            placeholder="Enter Description"
                                            className="mbe-2"
                                            multiline
                                            rows={6}
                                            error={!!errors.description}
                                            helperText={errors?.description?.message}
                                        />
                                    )}
                                />
                            </Grid>
                            <Grid size={{ xs: 6, sm: 6 }}>
                                <Typography variant='body'>Image</Typography>
                                <AppReactDropzone>
                                    <div {...getRootProps({ className: 'dropzone', })} style={{ minHeight: '150px' }}>
                                        <input {...getInputProps()} />

                                        <div className='flex items-center flex-col'>
                                            <Avatar variant='rounded' className='bs-12 is-12 mbe-1'>
                                                <i className='tabler-upload' />
                                            </Avatar>
                                            <Typography>Allowed *.png. *.jpg *.jpeg, *.gif</Typography>
                                            <Typography>Max 1 file and max size of 2 MB</Typography>
                                        </div>

                                        {preview && (
                                            <div className='mt-4'>
                                                <img src={preview} alt='Preview' style={{ maxWidth: '200px' }} />
                                            </div>
                                        )}

                                        {training?.image && !preview && (
                                            <div className='mt-4'>
                                                <img src={`${public_url}/${training.image}`} alt='Preview' style={{ maxWidth: '100px', 'borderRadius': '10%' }} />
                                            </div>
                                        )}


                                    </div>
                                </AppReactDropzone>
                            </Grid>
                        </Grid>

                        {/* <Grid size={{ xs: 6, sm: 6 }}>
                            {preview && (
                                <div className='mt-4'>
                                    <img src={preview} alt='Preview' style={{ maxWidth: '200px' }} />
                                </div>
                            )}
                        </Grid> */}
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

                        <Button
                            variant="tonal"
                            color="error"
                            type="reset"
                            onClick={() => {
                                router.push(`/${locale}/apps/program`);
                            }}
                        >
                            Cancel
                        </Button>
                    </CardActions>
                </form>

                <CategoryDialog open={open} setOpen={setOpen} type="training" location="addmoduleform" onLoadCategories={onLoadCategories} />
            </Card>
        </>
    )
}

export default ProgramFormLayout
