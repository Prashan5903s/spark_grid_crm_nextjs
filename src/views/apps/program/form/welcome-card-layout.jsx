"use client"

import { useState, useEffect } from 'react'

// Next Imports
import Link from 'next/link'
import { useParams } from 'next/navigation'

// MUI Imports
import Grid from '@mui/material/Grid2'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'

// Component Imports
import DirectionalIcon from '@components/DirectionalIcon'

// Util Imports
import { getLocalizedUrl } from '@/utils/i18n'

const courseData = [
    {
        id: 1,
        user: 'Lauretta Coie',
        image: '/images/avatars/1.png',
        tutorImg: '/images/apps/academy/1.png',
        completedTasks: 19,
        totalTasks: 25,
        time: '17h 34m',
        logo: 'tabler-brand-angular',
        color: 'error',
        courseTitle: 'Micro learning modules',
        desc: 'Create a sequence of engaging activities like videos, assessments, assignments, etcCreate a variety of engaging learning experiences—videos, assessments, assignments, and beyond.',
        tags: 'Web',
        rating: 4.4,
        ratingCount: 8,
        type: 'micro-modules',
    },
    {
        id: 2,
        user: 'Maybelle Zmitrovich',
        tutorImg: '/images/apps/academy/2.png',
        image: '/images/avatars/2.png',
        completedTasks: 48,
        totalTasks: 52,
        time: '19h 17m',
        logo: 'tabler-palette',
        color: 'warning',
        desc: 'A collaborative digital whiteboard integrated with audio-video conferencing and tools to launch live activities such as assessments and document sharing.',
        courseTitle: 'Live session',
        tags: 'Design',
        rating: 4.9,
        ratingCount: 10,
        type: 'remote-session-modules'
    },
    {
        id: 3,
        user: 'Gertie Langwade',
        image: '/images/avatars/2.png',
        tutorImg: '/images/apps/academy/3.png',
        completedTasks: 87,
        totalTasks: 100,
        time: '16h 16m',
        logo: 'tabler-brand-react-native',
        color: 'info',
        desc: 'Instructor-led training with support for managing multiple batches, users, and learning progress.In-person training that enables batch creation and seamless management of users and learning activities.',
        courseTitle: 'ILT',
        tags: 'Web',
        rating: 4.8,
        ratingCount: 9
    },
]

const WelcomeModuleCardLayout = ({ setLayoutType }) => {
    // Props
    const { searchValue } = ''

    // States
    const [course, setCourse] = useState('All')
    const [hideCompleted, setHideCompleted] = useState(true)
    const [data, setData] = useState([])
    const [activePage, setActivePage] = useState(0)

    const [showModuleTypeWindow, setShowModuleTypeWindow] = useState(false)

    const { lang: locale } = useParams()

    useEffect(() => {
        setData(courseData)
    }, [searchValue, activePage, course, hideCompleted, courseData, setLayoutType])


    const handleModuleSections = (item) => {
        setLayoutType(item.type);
    }

    return (
        <>
            <Card>
                <CardContent className='flex flex-col gap-6'>
                    <Typography variant="body1">Select the type of Module to continue</Typography>
                    {data.length > 0 ? (
                        <Grid container spacing={6}>
                            {data.slice(activePage * 6, activePage * 6 + 6).map((item, index) => (
                                <Grid size={{ xs: 12, sm: 6, md: 4 }} key={index}>
                                    <div className='border rounded bs-full'>
                                        <div className='pli-2 pbs-2'>
                                            <Link href={getLocalizedUrl('/apps/academy/course-details', locale)} className='flex'>
                                                <img src={item.tutorImg} alt={item.courseTitle} className='is-full' />
                                            </Link>
                                        </div>
                                        <div className='flex flex-col gap-4 p-5'>
                                            <div className='flex flex-col gap-1'>
                                                <Typography
                                                    variant='h5'
                                                    component={Link}
                                                    href={getLocalizedUrl('/apps/academy/course-details', locale)}
                                                    className='hover:text-primary'
                                                >
                                                    {item.courseTitle}
                                                </Typography>
                                                <Typography>{item.desc}</Typography>
                                            </div>
                                            <div className='flex flex-col gap-1'>
                                            </div>
                                            {item.completedTasks === item.totalTasks ? (
                                                <Button
                                                    variant='tonal'
                                                    startIcon={<i className='tabler-rotate-clockwise-2' />}
                                                    component={Link}
                                                    href={"#"}
                                                >
                                                    Start Over
                                                </Button>
                                            ) : (
                                                <div className='flex flex-wrap gap-4'>
                                                    <Button
                                                        fullWidth
                                                        variant='tonal'
                                                        endIcon={
                                                            <DirectionalIcon ltrIconClass='tabler-chevron-right' rtlIconClass='tabler-chevron-left' />
                                                        }
                                                        onClick={(e) => {
                                                            handleModuleSections(item)
                                                        }}
                                                        className='is-auto flex-auto'
                                                    >
                                                        Continue
                                                    </Button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </Grid>
                            ))}
                        </Grid>
                    ) : (
                        <Typography className='text-center'></Typography>
                    )}
                </CardContent>
            </Card>
        </>
    )
}

export default WelcomeModuleCardLayout
