// MUI Imports

'use client'

import { useState, useEffect } from 'react'

import { useSession } from 'next-auth/react'

import Typography from '@mui/material/Typography'

import Grid from '@mui/material/Grid2'

import ZonesTable from './ZonesTable'

import ZoneCards from './ZoneCards'

import SkeletonTableComponent from '@/components/skeleton/table/page'

const Zones = () => {

  const [zoneData, setZoneData] = useState();
  const [loading, setLoading] = useState(false);

  const URL = process.env.NEXT_PUBLIC_API_URL;

  const { data: session } = useSession()
  const token = session?.user?.token

  async function fetchZoneData() {

    try {
      const response = await fetch(`${URL}/company/zone`,
        {
          method: "GET",
          headers: {

            // "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          }
        })

      const datas = await response.json();

      if (response.ok) {


        console.log("Data", datas);

        setLoading(true);
        setZoneData(datas?.data);
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
      fetchZoneData();
    }
  }, [URL, token])

  return (
    <Grid container spacing={6}>
      <Grid size={{ xs: 12 }}>
        <Typography variant='h4' className='mbe-1'>
          Zones List
        </Typography>
        <Typography>
          A role provided access to predefined menus and features so that depending on assigned role an administrator
          can have access to what he need
        </Typography>
      </Grid>
      <Grid size={{ xs: 12 }}>
        <ZoneCards fetchZoneData={fetchZoneData} tableData={zoneData} />
      </Grid>
      <Grid size={{ xs: 12 }} className='!pbs-12'>
        <Typography variant='h4' className='mbe-1'>
          Total users with their roles
        </Typography>
        <Typography>Find all of your company&#39;s administrator accounts and their associate roles.</Typography>
      </Grid>
      <Grid size={{ xs: 12 }}>
        {loading ? (
          <ZonesTable tableData={zoneData} fetchZoneData={fetchZoneData} />
        )
          : (
            <SkeletonTableComponent />
          )
        }
      </Grid>
    </Grid>
  )
}

export default Zones
