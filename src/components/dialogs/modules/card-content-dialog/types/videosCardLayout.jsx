// MUI Imports

import { useEffect, useState } from 'react'

import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import Grid from '@mui/material/Grid2'
import Switch from '@mui/material/Switch'
import FormControl from '@mui/material/FormControl'
import CircularProgress from '@mui/material/CircularProgress'
import RadioGroup from '@mui/material/RadioGroup'
import Radio from '@mui/material/Radio'
import Alert from '@mui/material/Alert'
import Avatar from '@mui/material/Avatar'

import FormControlLabel from '@mui/material/FormControlLabel'


// React Hook Form
import { useForm, Controller } from 'react-hook-form'
import { valibotResolver } from '@hookform/resolvers/valibot'
import { useDropzone } from 'react-dropzone'

// Valibot schema
import { array, string, object, pipe, minLength, maxLength, boolean, nonEmpty, value } from 'valibot'

// Component Imports

import { useSession } from 'next-auth/react'

import { toast } from 'react-toastify'

import AppReactDropzone from '@/libs/styles/AppReactDropzone';

import CustomTextField from '@core/components/mui/TextField'

import { useApi } from '../../../../../utils/api';

import SkeletonFormComponent from '@/components/skeleton/form/page'


// Third-party Imports


const schema = object({
    title: pipe(
        string(),
        minLength(1, 'Title is required'),
        maxLength(255, 'Title can be maximum of 300 characters')
    ),
})

const VideosCardLayout = ({ data, onClose, moduleData }) => {

    const URL = process.env.NEXT_PUBLIC_API_URL
    const { data: session } = useSession()
    const token = session?.user?.token
    const [loading, setLoading] = useState(false)
    const [files, setFiles] = useState([]);
    const [item, setItem] = useState(data);
    const [media, setMedia] = useState(data?.content?.media);
    const { doPostFormData } = useApi();
    const [cardItems, setCardItems] = useState([]);

    const handleClose = () => {
        onClose(cardItems, item);
    }


    const {
        control,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm({
        resolver: valibotResolver(schema),
        mode: 'onChange',
        defaultValues: {
            title: ''
        }
    })

    useEffect(() => {
        if (moduleData?.cards?.length > 0) {
            setCardItems(moduleData.cards);
        }
    }, [moduleData])

    useEffect(() => {
        if (item) {
            reset({
                title: data?.title || ''
            })
        }
    }, [item, reset])

    const onSubmit = async (values) => {
        setLoading(true);

        const newData = {
            ...values,
            file: files[0]
        };

        const endpoint = `admin/module/${moduleData._id}/card/videos/${data._id}`;

        await doPostFormData({
            endpoint,
            values: newData,
            method: 'PUT',
            successMessage: '',
            errorMessage: '',
            onSuccess: (response) => {
                onClose(response.data.cards);
                setItem(response.data.card);

                setCardItems(response.data.cards);
                toast.success(response.message, {
                    autoClose: 700
                });

            },
        });
        setLoading(false);
    };

    const { getRootProps, getInputProps } = useDropzone({
        multiple: false,
        maxSize: 5000000,
        accept: {
            'video/mp4': ['.mp4'],
            'video/webm': ['.webm']
        },
        onDrop: acceptedFiles => {
            setFiles(acceptedFiles.map(file => Object.assign(file)))
            setMedia([]);
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
    });


    const handleRemove = (fileToRemove) => {
        setFiles(files.filter(file => file !== fileToRemove));
    };

    return (
        <>
            <form onSubmit={handleSubmit(onSubmit)}>

                <DialogTitle
                    variant='h4'
                    className='flex flex-col gap-2 text-center sm:pbs-16 sm:pbe-6 sm:pli-16'
                >
                    Videos
                </DialogTitle>

                <DialogContent className='overflow-visible pbs-0 sm:pli-16'>
                    <div className="flex items-end gap-4 mbe-2">
                        <Controller
                            name="title"
                            control={control}
                            render={({ field }) => (
                                <CustomTextField
                                    {...field}
                                    fullWidth
                                    size="small"
                                    variant="outlined"
                                    label="Title"
                                    placeholder=""
                                    error={!!errors.title}
                                    helperText={errors.title?.message}
                                />
                            )}
                        />
                    </div>
                    <Grid size={{ xs: 12, sm: 6 }}>
                        <AppReactDropzone>
                            <div {...getRootProps({ className: 'dropzone', })} style={{ minHeight: '200px' }}>
                                <input {...getInputProps()} />
                                <div className='flex items-center flex-col'>
                                    <Avatar variant='rounded' className='bs-12 is-12 mbe-5'>
                                        <i className='tabler-upload' />
                                    </Avatar>
                                    <Typography variant='h5' className='mbe-2.5'>
                                        Drop files here or click to upload.
                                    </Typography>
                                    <Typography>Allowed *.mp4</Typography>
                                    <Typography>Max 1 file and max size of 5 MB</Typography>
                                </div>
                            </div>
                        </AppReactDropzone>
                        {files.length > 0 && (
                            <div className='mt-4'>
                                {files.map(file => (
                                    <div key={file.name} className='flex justify-between items-center border p-2 rounded'>
                                        <div>
                                            <Typography>{file.name}</Typography>
                                            <Typography variant='caption'>{(file.size / 1024).toFixed(1)} KB</Typography>
                                        </div>
                                        <Button color='error' onClick={() => handleRemove(file)}>Remove</Button>
                                    </div>
                                ))}
                            </div>
                        )}

                        {media?.length > 0 && (
                            <div className='mt-4'>
                                {media.map(file => (
                                    <div key={file.file} className='flex justify-between items-center border p-2 rounded'>
                                        <div>
                                            <Typography>{file.file}</Typography>
                                            <Typography variant='caption'>{(file.size / 1024).toFixed(1)} KB</Typography>
                                        </div>
                                        <Button color='error' onClick={() => handleRemove(file)}>Remove</Button>
                                    </div>
                                ))}
                            </div>
                        )}

                    </Grid>

                </DialogContent>

                <DialogActions className='flex max-sm:flex-col max-sm:items-center max-sm:gap-2 justify-center pbs-0 sm:pbe-16 sm:pli-16'>
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
                    <Button onClick={handleClose} variant='tonal' color='secondary'>
                        Discard
                    </Button>
                </DialogActions>
            </form>
        </>
    )
}

export default VideosCardLayout
