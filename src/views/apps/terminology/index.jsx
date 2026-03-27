// MUI Imports
'use client'

import { useState, useEffect } from 'react'

import { useSession } from 'next-auth/react'

import Grid from '@mui/material/Grid2'

import Typography from '@mui/material/Typography'

import LabelTable from './LabelTable'

import SkeletonTableComponent from '@/components/skeleton/table/page'

const Label = () => {

  const [labelData, setLabelData] = useState();
  const [loading, setLoading] = useState(false);

  const URL = process.env.NEXT_PUBLIC_API_URL;

  const { data: session } = useSession() || {};

  const token = session && session.user && session?.user?.token;

  async function fetchLanguageData() {
    try {
      const response = await fetch(`${URL}/company/terminology`,
        {
          method: "GET",
          headers: {
            // "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          }
        })

      const datas = await response.json();

      if (response.ok) {
        setLoading(true);
        setLabelData(datas?.data);
      } else {

      }

    } catch (error) {
      throw new Error(error);
    } finally {
      setLoading(true);
    }
  }

  useEffect(() => {
    if (URL && token) {
      fetchLanguageData();
    }
  }, [token])

  return (
    <Grid container spacing={6}>
      <Grid size={{ xs: 12 }} className='!pbs-12'>
        <Typography variant='h4' className='mbe-1'>
          Total label with their language
        </Typography>
        <Typography>Find all of your company&#39;s label and their associate language.</Typography>
      </Grid>
      <Grid size={{ xs: 12 }}>
        {labelData ? (
          <LabelTable
            tableData={labelData}
            fetchLanguageData={fetchLanguageData}
          />
        )
          : (
            <SkeletonTableComponent />
          )
        }
      </Grid>
    </Grid>
  )
}

export default Label
