import { useEffect, useState, useRef } from 'react'

import {
    Avatar,
    CircularProgress,
    LinearProgress,
    Button,
    Typography,
    DialogActions,
    DialogContent,
    DialogTitle
} from '@mui/material'

import Grid from '@mui/material/Grid2'

import { useForm, Controller } from 'react-hook-form'
import { valibotResolver } from '@hookform/resolvers/valibot'
import { useDropzone } from 'react-dropzone'

import { array, string, object, pipe, minLength, maxLength, boolean, nonEmpty, value } from 'valibot'

import { useSession } from 'next-auth/react'

import { toast } from 'react-toastify'

import AppReactDropzone from '@/libs/styles/AppReactDropzone';

import CustomTextField from '@core/components/mui/TextField'

import SkeletonFormComponent from '@/components/skeleton/form/page'

import { useApi } from '../../../../../utils/api';

import ScormPlayerPipeworks from './scormPlayerPipeworks';

// Third-party Imports


const schema = object({
    title: pipe(
        string(),
        minLength(1, 'Title is required'),
        maxLength(255, 'Title can be maximum of 300 characters')
    ),
})

const ScromCardLayout = ({ data, onClose, moduleData }) => {

    const URL = process.env.NEXT_PUBLIC_API_URL
    const public_url = process.env.NEXT_PUBLIC_ASSETS_URL;
    const { data: session } = useSession()
    const token = session?.user?.token
    const [loading, setLoading] = useState(false)
    const [isView, setIsView] = useState(false);
    const [item, setItem] = useState(data);
    const [media, setMedia] = useState(data?.content?.media);
    const { doPostFormData } = useApi();
    const [cardItems, setCardItems] = useState([]);

    const [file, setFile] = useState(null);
    const [progress, setProgress] = useState(0);
    const [uploadedPath, setUploadedPath] = useState(null);
    const [uploadStats, setUploadStats] = useState('');
    const startTimeRef = useRef(null);

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

        const formData = new FormData();

        formData.append('file', file);

        Object.entries(values).forEach(([key, value]) => {
            formData.append(key, value);
        });

        setLoading(true);
        startTimeRef.current = Date.now();

        try {

            const endpoint = `admin/module/${moduleData._id}/card/scorm/${data._id}`;
            const url = `${process.env.NEXT_PUBLIC_API_URL}/${endpoint}`;

            const xhr = new XMLHttpRequest();
            
            xhr.open("PUT", url, true);

            if (token) {
                xhr.setRequestHeader("Authorization", `Bearer ${token}`);
            }

            xhr.timeout = 600000;

            xhr.upload.onprogress = (event) => {
                if (event.lengthComputable && file) {
                    const percent = Math.round((event.loaded * 100) / event.total);
                    
                    setProgress(percent);

                    const elapsed = (Date.now() - startTimeRef.current) / 1000;
                    const uploadedMB = event.loaded / (1024 * 1024);
                    const totalMB = event.total / (1024 * 1024);
                    const speed = uploadedMB / elapsed;
                    const remaining = (totalMB - uploadedMB) / speed;

                    setUploadStats(
                        `${uploadedMB.toFixed(2)} MB / ${totalMB.toFixed(2)} MB uploaded — ` +
                        `Speed: ${speed.toFixed(2)} MB/s — ETA: ${remaining.toFixed(1)} sec`
                    );
                }
            };

            xhr.onload = () => {
                if (xhr.status >= 200 && xhr.status < 300) {
                    const res = JSON.parse(xhr.responseText);

                    if (res.status === "Success") {
                        const resp = res.data;

                        onClose(resp.cards);
                        setItem(resp.card);
                        setCardItems(resp.cards);

                        toast.success(res.message, { autoClose: 1200 });
                    }

                    setUploadedPath(res.filePath);
                } else {
                    console.error("Upload failed:", xhr.responseText);
                }
            };

            xhr.onerror = () => console.error("Network error");
            xhr.ontimeout = () => console.error("Upload timeout");

            xhr.send(formData);

        } catch (error) {

            console.error('Upload error:', error);

            alert('Upload failed');

        }

        setLoading(false);
    };


    const { getRootProps, getInputProps } = useDropzone({
        multiple: false,
        maxSize: 524288000,
        accept: {
            'application/zip': ['.zip']
        },
        onDrop: acceptedFiles => {
            setFile(acceptedFiles[0]);
            setProgress(0);
            setUploadStats('');
            setUploadedPath(null);
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

    const handleRemove = (fileToRemove) => {
        setFile('');
        setProgress(0);
        setUploadStats('');
        setUploadedPath(null);
    };

    const handleView = (is) => {
        setIsView(is);
    };

    const handleViewBack = () => {
        setIsView(false);
    };

    return (
        <>
            <form onSubmit={handleSubmit(onSubmit)}>

                <DialogTitle
                    variant='h4'
                    className='flex flex-col gap-2 text-center sm:pbs-16 sm:pbe-6 sm:pli-16'
                >
                    Scorm content
                </DialogTitle>

                <DialogContent className='overflow-visible pbs-0 sm:pli-16'>
                    {!isView ? (
                        <>
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
                                            label="Title*"
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
                                            <Avatar variant='rounded' className='bs-12 is-12 mbe-2'>
                                                <i className='tabler-upload' />
                                            </Avatar>
                                            <Typography variant='h5' className='mbe-2.5'>
                                                Drop files here or click to upload.
                                            </Typography>
                                            <Typography>Allowed *.zip</Typography>
                                            <Typography>Max 1 file and max size of 500 MB</Typography>
                                        </div>
                                    </div>
                                </AppReactDropzone>
                                {progress > 0 && (
                                    <div className='flex items-center gap-3'>
                                        <div className='is-full'>
                                            <LinearProgress variant='determinate' color='success' value={progress} />
                                        </div>
                                        <Typography variant='body2' color='text.secondary' className='font-medium'>{`${progress}%`}</Typography>
                                        <p className="text-sm text-gray-700">{uploadStats}</p>
                                    </div>
                                )}
                                {uploadedPath && (
                                    <p className="text-green-600 text-sm">
                                        ✅ File uploaded: <a href={uploadedPath} target="_blank">{uploadedPath}</a>
                                    </p>
                                )}

                                {file && (
                                    <div className='mt-4'>

                                        <div key={file.name} className='flex justify-between items-center border p-2 rounded'>
                                            <div>
                                                <Typography>Selected file to upload: {file.name}</Typography>
                                                <Typography variant='caption'>{(file.size / 1024).toFixed(1)} KB</Typography>
                                            </div>
                                            <Button color='error' onClick={() => handleRemove()}>Remove</Button>
                                        </div>

                                    </div>
                                )}

                                {media?.length > 0 && (
                                    <div className='mt-4'>
                                        {media.map(file => (
                                            <div key={file.size} className='flex justify-between items-center border p-2 rounded'>
                                                <div>
                                                    <Typography>{file.file}</Typography>
                                                    <Typography variant='caption'>{(file.size / 1024).toFixed(1)} KB</Typography>
                                                </div>
                                                <Button variant="outlined" color="primary" onClick={() => handleView(true)}>View</Button>

                                            </div>
                                        ))}
                                    </div>
                                )}

                            </Grid>
                        </>
                    ) : (
                        <>
                            {media?.length > 0 && (
                                <div className='mt-4'>
                                    {media.map(file => (
                                        <div key={file.size} className='flex justify-between items-center border p-2 rounded'>
                                            <ScormPlayerPipeworks scormUrl={file.uploadDir} />
                                        </div>

                                    ))}
                                </div>
                            )}
                        </>
                    )
                    }
                </DialogContent>

                <DialogActions className='flex max-sm:flex-col max-sm:items-center max-sm:gap-2 justify-center pbs-0 sm:pbe-16 sm:pli-16'>
                    {!isView ? (
                        <>
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
                        </>
                    ) : (
                        <Button onClick={handleClose} variant='tonal' color='secondary'>
                            Discard
                        </Button>
                    )}
                </DialogActions>
            </form>
        </>
    )
}

export default ScromCardLayout
