
"use client"

import { useEffect, useState } from 'react'

import { useParams } from 'next/navigation'

import { useSession } from 'next-auth/react'

// MUI Imports
import Grid from '@mui/material/Grid2'

// Component Imports
import Details from '@components/Details'

const CourseDetailsPage = () => {

  const API_URL = process.env.NEXT_PUBLIC_API_URL

  const { data: session } = useSession()

  const token = session?.user?.token

  const { slug } = useParams()

  const [data, setData] = useState()

  const fetchModuleData = async () => {
    try {

      const response = await fetch(`${API_URL}/user/module/data/${slug}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`
        }
      })

      const result = await response.json()

      if (response.ok) {

        setData(result?.data)
      }

    } catch (error) {
      throw new Error(error)
    }
  }

  useEffect(() => {
    if (API_URL && token && slug) {
      fetchModuleData()
    }
  }, [API_URL, token, slug])

  return (
    <Grid container spacing={6}>
      <Grid size={{ xs: 12 }}>
        <Details data={data} />
      </Grid>
    </Grid>
  )
}

export default CourseDetailsPage
