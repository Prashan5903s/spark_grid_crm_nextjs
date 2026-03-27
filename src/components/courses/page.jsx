'use client'

// React Imports

import { useEffect, useState } from 'react'

import { useSession } from 'next-auth/react'

// MUI Imports
import Grid from '@mui/material/Grid2'

import { Tab, Box, Typography, Button } from '@mui/material'

import TabContext from '@mui/lab/TabContext'
import TabPanel from '@mui/lab/TabPanel'

// Component Imports
import Course from '@components/Courses'
import CustomTabList from '@core/components/mui/TabList'

const Courses = () => {

  const API_URL = process.env.NEXT_PUBLIC_API_URL

  const { data: session } = useSession()
  const token = session?.user?.token

  const [activeTab, setActiveTab] = useState('')
  const [searchData, setSearchData] = useState([])
  const [courseData, setCourseData] = useState([])
  const [courseListData, setCourseListData] = useState({})

  const handleChange = (event, value) => {
    setActiveTab(value)
  }

  const fetchProgramData = async () => {
    try {
      const response = await fetch(`${API_URL}/user/program/data`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      const value = await response.json()

      if (response.ok) {
        const result = value?.data || []

        // Tab list data
        const course_data = result.map(item => ({
          label: item?.title,
          iconPosition: 'start',
          value: item?.title, // 👈 unique key
        }))

        setCourseData(course_data)

        // Courses grouped by program title
        const course_list_data = result.reduce((acc, item) => {
          acc[item.title] = item.content_folders.map((val, index) => ({
            id: index,
            _id: val?._id,
            tutorImg: val?.image_url,
            courseTitle: val?.title,
            tags: 'Web',
          }))

          return acc
        }, {})

        setCourseListData(course_list_data)

        // 👇 Set default active tab as first program
        if (course_data.length > 0) {
          setActiveTab(course_data[0].value)
        }
      }
    } catch (error) {
      console.error('Error fetching programs:', error)
    }
  }

  useEffect(() => {
    if (API_URL && token) {
      fetchProgramData()
    }
  }, [API_URL, token])

  useEffect(() => {
    if (activeTab && courseListData[activeTab]) {

      setSearchData(courseListData[activeTab])
    }
  }, [activeTab, courseListData])

  return (
    <TabContext value={activeTab}>
      <Grid container spacing={6}>
        {/* Sidebar Tabs */}
        <Grid size={{ xs: 12, md: 3 }}>
          <Typography variant='h5' className='mbe-4'>
            My Courses
          </Typography>
          <CustomTabList
            orientation='vertical'
            onChange={handleChange}
            className='is-full'
            pill='true'
          >
            {courseData && courseData.map((item, index) => (
              <Tab
                key={index}
                label={item.label}
                icon={<i className='tabler-bell-ringing' />}
                iconPosition='start'
                value={item.value}
                className='flex-row justify-start !min-is-full'
              />
            ))}
          </CustomTabList>
        </Grid>

        {/* Tab Panel Content */}
        <Grid item size={{ xs: 12, md: 8 }}>
          <TabPanel value={activeTab} className='p-0'>
            <Course searchValue={searchData} type={0} />
          </TabPanel>
        </Grid>
      </Grid>
    </TabContext>
  )
}

export default Courses
