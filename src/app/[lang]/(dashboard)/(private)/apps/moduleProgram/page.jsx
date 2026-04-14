'use client'


import { useState } from 'react'

import { useParams } from 'next/navigation'

import Tab from '@mui/material/Tab'
import TabContext from '@mui/lab/TabContext'
import TabList from '@mui/lab/TabList'

import TabPanel from '@mui/lab/TabPanel'

import Courses from '@components/Courses'

import PermissionGuard from '@/hocs/PermissionClientGuard'

const moduleList = [
    {
        id: 1,
        tutorImg: '/images/apps/academy/1.png',
        courseTitle: 'Basics of Angular',
        tags: 'Web',
        percentage: 40
    },
    {
        id: 2,
        tutorImg: '/images/apps/academy/2.png',
        courseTitle: 'UI/UX Design',
        tags: 'Design',
        percentage: 60
    },
    {
        id: 3,
        tutorImg: '/images/apps/academy/3.png',
        courseTitle: 'React Native',
        tags: 'Web',
        percentage: 50
    }
]

const liveList = [{
    id: 4,
    tutorImg: '/images/apps/academy/4.png',
    courseTitle: 'Art & Drawing',
    tags: 'Design',
    percentage: 20
},
{
    id: 5,
    tutorImg: '/images/apps/academy/5.png',
    courseTitle: 'Basic Fundamentals',
    tags: 'Web',
    percentage: 10
},
{
    id: 6,
    tutorImg: '/images/apps/academy/6.png',
    courseTitle: 'React for Beginners',
    tags: 'Web',
    percentage: 40
},
{
    id: 10,
    tutorImg: '/images/apps/academy/4.png',
    courseTitle: 'Advanced React Native',
    tags: 'Web',
    percentage: 40
}
];

const loocList = [
    {
        id: 7,
        tutorImg: '/images/apps/academy/1.png',
        courseTitle: 'The Science of Critical Thinking',
        tags: 'Psychology',
        percentage: 90
    },
    {
        id: 8,
        tutorImg: '/images/apps/academy/2.png',
        courseTitle: 'The Complete Figma UI/UX Course',
        tags: 'Design',
        percentage: 80
    },
    {
        id: 9,
        tutorImg: '/images/apps/academy/3.png',
        courseTitle: 'Advanced Problem Solving Techniques',
        tags: 'Psychology',
        percentage: 20
    }
]

const iltList = [
    {
        id: 10,
        tutorImg: '/images/apps/academy/4.png',
        courseTitle: 'Advanced React Native',
        tags: 'Web',
        percentage: 40
    }
];

const FormLayoutsWithTabs = () => {
    const [value, setValue] = useState('micro_learning_module')

    const handleTabChange = (event, newValue) => {
        setValue(newValue)
    }

    const { lang: locale } = useParams();

    // const lang = 'en';


    return (
        <PermissionGuard locale={locale} element='isUser'>
            <TabContext value={value}>
                <TabList variant='scrollable' onChange={handleTabChange} className='border-b px-0 pt-0'>
                    <Tab key={1} label='Micro learning module' value='micro_learning_module' />
                    <Tab key={2} label='Live session' value='live_session' />
                    <Tab key={3} label='LOOC' value='looc' />
                    <Tab key={4} label='ILT' value='ilt' />
                </TabList>

                <div className='pt-0 mt-4'>
                    <TabPanel value='micro_learning_module' className='p-0'>
                        <Courses searchValue={moduleList} type={1} />
                    </TabPanel>
                    <TabPanel value='live_session' className='p-0'>
                        <Courses searchValue={liveList} type={1} />
                    </TabPanel>
                    <TabPanel value='looc' className='p-0'>
                        <Courses searchValue={loocList} type={1} />
                    </TabPanel>
                    <TabPanel value='ilt' className='p-0'>
                        <Courses searchValue={iltList} type={1} />
                    </TabPanel>
                </div>
            </TabContext>
        </PermissionGuard>
    )
}

export default FormLayoutsWithTabs
