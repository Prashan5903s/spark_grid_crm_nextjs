// React Imports
import { useState, useEffect } from 'react'

import { useParams, useRouter } from 'next/navigation'

// Next Imports
import Link from 'next/link'

// MUI Imports
import { Card, CardHeader, CardContent, CardActions } from '@mui/material'
import Grid from '@mui/material/Grid2'
import Typography from '@mui/material/Typography'
import Alert from '@mui/material/Alert'
import AlertTitle from '@mui/material/AlertTitle'
import Button from '@mui/material/Button'
import Divider from '@mui/material/Divider'
import Chip from '@mui/material/Chip'
import IconButton from '@mui/material/IconButton'
import Rating from '@mui/material/Rating'
import Collapse from '@mui/material/Collapse'
import Fade from '@mui/material/Fade'
import Tab from '@mui/material/Tab'
import TabList from '@mui/lab/TabList'
import TabPanel from '@mui/lab/TabPanel'
import TabContext from '@mui/lab/TabContext'

import { toast } from 'react-toastify'

// Component Imports
import DirectionalIcon from '@components/DirectionalIcon'
import CustomTextField from '@core/components/mui/TextField'

import { useApi } from '../../../../../utils/api';

import CardContentDialog from '../../../../../components/dialogs/modules/card-content-dialog/page'
import ModuleTypeDialog from '../../../../../components/dialogs/modules/module-type-dialog/page'
import PublishModuleDialog from '../../../../../components/dialogs/modules/publish-module-dialog/page'
import ModuleSettingLayout from './module-setting-layout';
import ColoredCards from '../../list/ColoredCards';

import { getLocalizedUrl } from '@/utils/i18n'

const iconMap = {
    documents: (

        // <svg viewBox='0 0 24 24' fill='currentColor' className='w-full h-full text-primary'>
        //     <path d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z' />
        // </svg>
        <svg xmlns="http://www.w3.org/2000/svg" className='w-full h-full text-primary' viewBox="0 0 24 24"><g fill="none" fillRule="evenodd"><path d="m12.593 23.258l-.011.002l-.071.035l-.02.004l-.014-.004l-.071-.035q-.016-.005-.024.005l-.004.01l-.017.428l.005.02l.01.013l.104.074l.015.004l.012-.004l.104-.074l.012-.016l.004-.017l-.017-.427q-.004-.016-.017-.018m.265-.113l-.013.002l-.185.093l-.01.01l-.003.011l.018.43l.005.012l.008.007l.201.093q.019.005.029-.008l.004-.014l-.034-.614q-.005-.018-.02-.022m-.715.002a.02.02 0 0 0-.027.006l-.006.014l-.034.614q.001.018.017.024l.015-.002l.201-.093l.01-.008l.004-.011l.017-.43l-.003-.012l-.01-.01z"></path><path fill="currentColor" d="M14 2v5.5A1.5 1.5 0 0 0 15.5 9H21v7a2 2 0 0 1-2 2h-2v2a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h2V4a2 2 0 0 1 2-2zM8 8H6v12h9v-2h-5a2 2 0 0 1-2-2zm8-5.957a2 2 0 0 1 1 .543L20.414 6a2 2 0 0 1 .543 1H16z"></path></g></svg>
    ),
    videos: (
        <svg viewBox='0 0 24 24' fill='currentColor' className='w-full h-full text-blue-600'>
            <path d='M10 8v8l5-4z' />
        </svg>
    ),
    scorm: (
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full" style={{ color: '#7367F0' }}>
            {/* Document outline */}
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" fill="currentColor" opacity="0.1" />

            {/* Play button inside document */}
            <circle cx="12" cy="12" r="5" fill="currentColor" opacity="0.3" />
            <path d="M11 10v4l3-2z" fill="currentColor" />
        </svg>
    ),
    youtube_videos: (

        // <svg viewBox='0 0 24 24' fill='currentColor' className='w-full h-full text-blue-600'>
        //     <path d='M10 8v8l5-4z' />
        // </svg>
        <svg xmlns="http://www.w3.org/2000/svg" className='w-full h-full text-blue-600' viewBox="0 0 24 24"><path fill="currentColor" d="m10 15l5.19-3L10 9zm11.56-7.83c.13.47.22 1.1.28 1.9c.07.8.1 1.49.1 2.09L22 12c0 2.19-.16 3.8-.44 4.83c-.25.9-.83 1.48-1.73 1.73c-.47.13-1.33.22-2.65.28c-1.3.07-2.49.1-3.59.1L12 19c-4.19 0-6.8-.16-7.83-.44c-.9-.25-1.48-.83-1.73-1.73c-.13-.47-.22-1.1-.28-1.9c-.07-.8-.1-1.49-.1-2.09L2 12c0-2.19.16-3.8.44-4.83c.25-.9.83-1.48 1.73-1.73c.47-.13 1.33-.22 2.65-.28c1.3-.07 2.49-.1 3.59-.1L12 5c4.19 0 6.8.16 7.83.44c.9.25 1.48.83 1.73 1.73"></path></svg>
    ),
    assessments: (
        <svg viewBox='0 0 24 24' fill='currentColor' className='w-full h-full text-amber-600'>
            <path d='M3 3v18h18V3H3zm8 14H6v-2h5v2zm5-4H6v-2h10v2zm0-4H6V7h10v2z' />
        </svg>
    ),
    quiz: (
        <svg viewBox='0 0 24 24' fill='currentColor' className='w-full h-full text-amber-600'>
            <path d='M3 3v18h18V3H3zm8 14H6v-2h5v2zm5-4H6v-2h10v2zm0-4H6V7h10v2z' />
        </svg>
    )
};

const ManageContentsCard = ({ cardrows, setShowContents, onDelete, setCardItemsModuleType, moduleData, currentPage, setShowCards }) => {
    // States
    const [openCollapse, setOpenCollapse] = useState(true)
    const [openFade, setOpenFade] = useState(true)
    const [open, setOpen] = useState(false);
    const [openCardContentDialog, setOpenCardContentDialog] = useState(false);
    const [openPublishDialog, setOpenPublishDialog] = useState(false);
    const [cardItems, setCardItems] = useState([]);
    const [cardContent, setCardContent] = useState({});
    const [moduleStatus, setModuleStatus] = useState(moduleData?.status);
    const { doDelete } = useApi();
    const router = useRouter();
    const [tab, setTab] = useState('1')
    const { lang: locale, id: id } = useParams()
    const public_url = process.env.NEXT_PUBLIC_ASSETS_URL;

    const onSelectSlideFromPopup = (cardItems) => {
        // const updated = [...cardItems, newItem];
        setCardItems(cardItems);
        setCardItemsModuleType(cardItems);
    };

    const handleEdit = (item) => {
        setCardContent(item);
        setOpenCardContentDialog(true);
    };

    const onUpdateStatusChangeState = (status) => {
        setModuleStatus(status);
    };

    const handleCardDelete = async (item) => {

        if (confirm('Are you sure?')) {
            const endpoint = `admin/module/${moduleData?._id}/card/${item._id}`;

            await doDelete({
                endpoint,
                params: {},
                onSuccess: (response) => {
                    toast.success(response.message, { autoClose: 2000 });
                    setCardItems(response.data);
                },
                onError: (error) => {
                    toast.error(error.message, { autoClose: 2000 });
                }
            });
        }
    };

    useEffect(() => {
        if (!openFade) {
            setTimeout(() => {

                setOpenCollapse(false)
            }, 300)
        }

        setCardItems(cardrows);
    }, [openFade, cardrows])

    const handleChangeTab = (event, newValue) => {
        setTab(newValue)
    };

    return (

        <Card>

            <CardContent>
                {/* <CardHeader
                        title='Content lists'
                        action={
                            <Button onClick={(e) => {
                                setOpen(true)
                            }} variant="outlined" color="primary" size='small'>
                                Add more activity
                            </Button>
                        }
                        className='pbe-4'
                    /> */}
                <CardHeader
                    className='p-4 pb-2'
                    title={
                        <div className='flex items-center justify-between gap-4 flex-wrap'>
                            {/* Left: Icon + Title */}
                            <div className='flex items-center gap-3'>
                                <div className='w-10 h-10 rounded-lg overflow-hidden bg-gray-100 shadow-sm flex items-center justify-center'>
                                    {moduleData?.image ? (
                                        <img
                                            src={`${public_url}/${moduleData.image}`}
                                            alt='Module Preview'
                                            className='object-cover w-full h-full'
                                        />
                                    ) : (
                                        <svg
                                            viewBox='0 0 24 24'
                                            fill='currentColor'
                                            className='w-6 h-6 text-gray-400'
                                        >
                                            <path d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z' />
                                        </svg>
                                    )}
                                </div>

                                <div className='flex items-center gap-2'>
                                    <Typography variant='h6' className='text-xl font-semibold text-textPrimary'>
                                        {moduleData?.title ? `${moduleData.title} module` : 'Untitled Module'}
                                    </Typography>
                                    <i
                                        className='tabler-edit cursor-pointer text-primary'
                                        onClick={() => {
                                            // router.replace(`/${locale}/apps/modules/form/${id}`);
                                            if (id) {
                                                location.href = `/${locale}/apps/modules/form/${id}`;
                                            } else {
                                                setShowCards(false);
                                            }
                                        }}
                                    />
                                </div>
                            </div>

                            {/* Right: Edit & Back Buttons */}
                            <div className='flex items-center gap-2'>
                                <Button
                                    variant='contained'
                                    color={moduleStatus === 'draft' ? 'warning' : 'success'}
                                    size='medium'
                                    onClick={() => {
                                        setOpenPublishDialog(true)
                                    }}
                                >
                                    <i className={`tabler-${moduleStatus === 'published' ? 'arrow-down' : 'arrow-up'} mr-1`} />
                                    {moduleStatus === 'published' ? 'Unpublish' : 'Publish'}
                                </Button>
                                {Array.isArray(cardItems) && cardItems.length > 0 &&
                                    <Button
                                        variant='outlined'
                                        color='info'
                                        size='medium'
                                        onClick={() => {
                                            setOpen(true)
                                        }}
                                    >
                                        <i className='tabler-plus mr-1 text-sm' />
                                        Add Content
                                    </Button>
                                }
                            </div>
                        </div>
                    }
                />
                <Divider />
                <TabContext value={tab}>
                    <TabList onChange={handleChangeTab} aria-label='nav tabs example'>
                        <Tab value='1' component='a' label='Content Flow' href='/drafts' onClick={e => e.preventDefault()} />
                        <Tab value='2' component='a' label='Settings' href='/trash' onClick={e => e.preventDefault()} />
                    </TabList>
                    <TabPanel value='1' className='pt-10'>
                        <Grid key="item3" container spacing={5} >
                            <Grid key="item1" size={{ xs: 12, md: 8, lg: 8 }} className='flex flex-col gap-4'>
                                {Array.isArray(cardItems) && cardItems.length > 0 ? (
                                    cardItems.slice().reverse().map(item => (
                                        <div
                                            key={item._id}
                                            className='flex items-center justify-between gap-4 p-3 border rounded-lg shadow-sm bg-white'
                                        >
                                            {/* Left: Icon + Info */}
                                            <div className='flex items-center gap-4'>
                                                <div className='w-10 h-20'>{iconMap[item.value]}</div>
                                                <div className='flex flex-col gap-1'>
                                                    <Typography color='text.primary'>{item.title}</Typography>

                                                    {(item.value === 'documents' || item.value === 'videos') && (
                                                        item?.content?.media?.length > 0 ? (
                                                            item.content.media.map((file, index) => (
                                                                <div
                                                                    key={file.file || index}
                                                                    className='flex items-center gap-2.5 is-fit bg-actionHover rounded plb-[5px] pli-2.5'
                                                                >
                                                                    {file.type === 'application/pdf' && (
                                                                        <img height={20} alt='document' src='/images/icons/pdf-document.png' />
                                                                    )}
                                                                    <Typography variant='body2' className='font-medium'>
                                                                        {file.file}
                                                                    </Typography>
                                                                </div>
                                                            ))
                                                        ) : (
                                                            <Typography variant='body2' color='#FF0000' className='font-medium'>
                                                                This activity is empty or invalid.
                                                            </Typography>
                                                        )
                                                    )}

                                                    {item.value === 'youtube_videos' && (
                                                        item?.content?.url ? (
                                                            <Typography variant='body2' color='text.primary'>
                                                                {item.content.url}
                                                            </Typography>
                                                        ) : (
                                                            <Typography variant='body2' color='#FF0000' className='font-medium'>
                                                                This activity is empty or invalid.
                                                            </Typography>
                                                        )
                                                    )}

                                                    {item.value === 'quiz' && (
                                                        item?.content?.questions ? (
                                                            <Typography variant='body2' color='text.primary'>
                                                                {item.content.questions.length} Questions
                                                            </Typography>
                                                        ) : (
                                                            <Typography variant='body2' color='#FF0000' className='font-medium'>
                                                                This activity is empty or invalid.
                                                            </Typography>
                                                        )
                                                    )}
                                                </div>
                                            </div>

                                            {/* Right: Action Buttons */}
                                            <div className='flex items-center gap-2'>
                                                <IconButton color='primary' onClick={() => handleEdit(item)}>
                                                    <i className='tabler-edit text-textSecondary' />
                                                </IconButton>
                                                <IconButton color='error' onClick={() => handleCardDelete(item)}>
                                                    <i className='tabler-trash text-textSecondary' />
                                                </IconButton>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <Button
                                        variant='outlined'
                                        color='primary'
                                        onClick={() => {
                                            setOpen(true)
                                        }}
                                        className='mx-auto mt-4'
                                    >
                                        <i className='tabler-plus me-2' /> Add First Content
                                    </Button>
                                )}
                            </Grid>


                            <Grid key="item2" size={{ xs: 12, md: 4, lg: 4 }} className='flex flex-col gap-4'>
                                <Typography variant='body2'>
                                    To enhance engagement and deliver a complete learning experience, you can add multiple content types within each module. Use a combination of the following formats to make your content effective, interactive, and accessible:
                                </Typography>

                                <Typography variant='body2'>
                                    1.  Enhance your course by adding objectives, documents, videos, YouTube links, SCORM content, and assessments.
                                </Typography>

                                <Typography variant='body2'>
                                    2.  Build dynamic learning experiences with a mix of videos, documents, quizzes, YouTube, and SCORM modules.
                                </Typography>

                                <Typography variant='body2'>
                                    3.  Combine videos, PDFs, SCORM, YouTube, and assessments to deliver a complete learning journey.
                                </Typography>

                                <Typography variant='body2'>
                                    4.  Create impactful LMS content using documents, multimedia, YouTube, SCORM, and interactive quizzes.
                                </Typography>



                                <div className='flex justify-normal sm:justify-end xl:justify-normal'>
                                    {/* <Button variant='contained' onClick={(e) => { setOpen(true) }}>
                                    Add more activity
                                </Button> */}
                                </div>
                            </Grid>
                        </Grid>
                    </TabPanel>
                    <TabPanel value='2'>
                        <ModuleSettingLayout moduleData={moduleData} />
                    </TabPanel>
                </TabContext>
            </CardContent>

            <Divider />
            <CardActions>
                {/* <Button
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
                    </Button> */}
                <CardActions sx={{ display: 'flex', justifyContent: 'left', gap: 2 }}>
                    <Button
                        type='button'
                        variant='outlined'
                        component={Link}
                        href={getLocalizedUrl(`/apps/modules`, locale)}
                        startIcon={<DirectionalIcon ltrIconClass='tabler-arrow-left' rtlIconClass='tabler-arrow-right' />}

                    // sx={{ height: 40 }}
                    >
                        Back to Module list
                    </Button>
                    {currentPage != 'direct' ? (
                        <Button variant="tonal" color="warning" type="reset"
                            startIcon={<DirectionalIcon ltrIconClass='tabler-arrow-left' rtlIconClass='tabler-arrow-right' />}
                            onClick={(e) => { setShowContents(false) }}>
                            Previous
                        </Button>
                    ) : ('')}
                </CardActions>
            </CardActions>

            <ModuleTypeDialog open={open} setOpen={setOpen} onSelectSlideFromPopup={onSelectSlideFromPopup} moduleData={moduleData} />
            <CardContentDialog open={openCardContentDialog} setOpen={setOpenCardContentDialog} moduleData={moduleData} cardContent={cardContent} onSetCardItems={onSelectSlideFromPopup} />
            <PublishModuleDialog open={openPublishDialog} setOpen={setOpenPublishDialog} moduleData={moduleData} type={moduleStatus} onUpdateStatusChangeState={onUpdateStatusChangeState} cardItems={cardItems} />
        </Card >

    )
}

export default ManageContentsCard
