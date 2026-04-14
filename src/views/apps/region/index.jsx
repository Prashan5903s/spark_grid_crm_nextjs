// MUI Imports
'use client'


import { useState, useEffect } from 'react'

import { useSession } from 'next-auth/react'

import Grid from '@mui/material/Grid2'

import Typography from '@mui/material/Typography'

import RegionCards from './RegionCards';
import RegionTable from './RegionTable';

import SkeletonTableComponent from '@/components/skeleton/table/page'

const Region = () => {

  const [regionData, setRegionData] = useState();
  const [loading, setLoading] = useState(false);

  const URL = process.env.NEXT_PUBLIC_API_URL;

  const { data: session } = useSession() || {};

  const token = session && session.user && session?.user?.token;

  async function fetchRegionData() {
    try {
      const response = await fetch(`${URL}/company/region`,
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
        setRegionData(datas?.data);
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
      fetchRegionData();
    }
  }, [token])

  return (
    <Grid container spacing={6}>
      <Grid size={{ xs: 12 }}>
        <Typography variant='h4' className='mbe-1'>
          Region List
        </Typography>
        <Typography>
          A role provided access to predefined menus and features so that depending on assigned role an administrator
          can have access to what he need
        </Typography>
      </Grid>
      <Grid size={{ xs: 12 }}>
        <RegionCards fetchRegionData={fetchRegionData} tableData={regionData} />
      </Grid>
      <Grid size={{ xs: 12 }} className='!pbs-12'>
        <Typography variant='h4' className='mbe-1'>
          Total users with their region
        </Typography>
        <Typography>Find all of your company&#39;s administrator accounts and their associate roles.</Typography>
      </Grid>
      <Grid size={{ xs: 12 }}>
        {regionData ? (
          <RegionTable tableData={regionData} fetchRegionData={fetchRegionData} />
        )
          : (
            <SkeletonTableComponent />
          )
        }
      </Grid>
    </Grid>
  )
}

export default Region;
