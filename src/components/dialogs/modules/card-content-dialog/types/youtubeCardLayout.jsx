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

import useMediaQuery from '@mui/material/useMediaQuery'
import { useTheme } from '@mui/material/styles'

// React Hook Form
import { useForm, Controller } from 'react-hook-form'

import { valibotResolver } from '@hookform/resolvers/valibot'

import { useDropzone } from 'react-dropzone'

// Valibot schema
import { array, string, object, pipe, minLength, maxLength, custom, boolean, nonEmpty, value } from 'valibot'

import { useSession } from 'next-auth/react'

import { toast } from 'react-toastify'

import ReactPlayer from '@/libs/ReactPlayer'

import CustomIconButton from '@core/components/mui/IconButton'

import CustomTextField from '@core/components/mui/TextField'

import { useApi } from '../../../../../utils/api';

// Third-party Imports

const isYouTubeUrl = custom((value) => {
    const regex = /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)[\w\-]{11}$/;

    return regex.test(value) || 'Please enter a valid YouTube URL';
});

const schema = object({
    title: pipe(
        string(),
        minLength(1, 'Title is required'),
        maxLength(255, 'Title can be maximum of 300 characters')
    ),
    url: pipe(
        string(),
        minLength(1, 'URL is required'),
        maxLength(255, 'URL can be a maximum of 255 characters'),
        isYouTubeUrl
    ),
})

const YoutubeCardLayout = ({ data, onClose, moduleData }) => {

    const URL = process.env.NEXT_PUBLIC_API_URL
    const { data: session } = useSession()
    const token = session?.user?.token
    const [loading, setLoading] = useState(false)
    const [files, setFiles] = useState([]);
    const [item, setItem] = useState(data);
    const [media, setMedia] = useState(data?.content?.media);
    const { doPostFormData } = useApi();
    const [cardItems, setCardItems] = useState([]);

    const theme = useTheme()
    const smallScreen = useMediaQuery(theme.breakpoints.down('sm'))

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
            title: '',
            url: '',
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
                title: data?.title || '',
                url: data?.content?.url || ''
            })
        }
    }, [item, reset])

    const onSubmit = async (values) => {
        setLoading(true);

        const newData = {
            ...values
        };

        const endpoint = `admin/module/${moduleData._id}/card/youtubeVideos/${data._id}`;

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

    const extractYouTubeId = (url) => {

        const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/))([\w-]{11})/);

        return match ? match[1] : '';
    };


    return (
        <>
            <form onSubmit={handleSubmit(onSubmit)}>

                <DialogTitle
                    variant='h4'
                    className='flex flex-col gap-2 text-center sm:pbs-16 sm:pbe-6 sm:pli-16'
                >
                    Youtube Video
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
                                    label="Title*"
                                    placeholder=""
                                    error={!!errors.title}
                                    helperText={errors.title?.message}
                                />
                            )}
                        />
                    </div>
                    <div className="flex items-end gap-4 mbe-2">
                        <Controller
                            name="url"
                            control={control}
                            render={({ field }) => (
                                <CustomTextField
                                    {...field}
                                    fullWidth
                                    size="small"
                                    variant="outlined"
                                    label="Video URL*"
                                    placeholder=""
                                    error={!!errors.url}
                                    helperText={errors.url?.message}
                                />
                            )}
                        />
                    </div>
                    {item?.content?.url && (
                        <ReactPlayer
                            playing
                            controls
                            url={`https://www.youtube.com/embed/${extractYouTubeId(item.content.url)}`}
                            height={smallScreen ? 280 : 440}
                            className='bg-black !is-full'

                            // light={
                            //     <img
                            //         src='/images/apps/academy/4.png'
                            //         alt='Thumbnail'
                            //         className='is-full bs-full object-cover bg-backgroundPaper'
                            //     />
                            // }
                            playIcon={
                                <CustomIconButton variant='contained' color='error' className='absolute rounded-full'>
                                    <i className='tabler-player-play text-2xl' />
                                </CustomIconButton>
                            }
                        />
                    )}
                    {/* {item?.content?.url && (
                        <div className="flex items-end gap-4 mbe-2">
                            <iframe
                                width='100%'
                                height='315'
                                src={`https://www.youtube.com/embed/${extractYouTubeId(item.content.url)}`}
                                title='YouTube video player'
                                allow='accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture'
                                allowFullScreen
                            />
                        </div>
                    )} */}
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

export default YoutubeCardLayout
