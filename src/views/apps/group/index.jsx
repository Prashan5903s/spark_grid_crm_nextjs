// MUI Imports
'use client'

import { useState, useEffect } from 'react'

import { useSession } from 'next-auth/react'

import Typography from '@mui/material/Typography'

import Grid from '@mui/material/Grid2'

import SkeletonTableComponent from '@/components/skeleton/table/page'

import GroupCard from './GroupCards'

import GroupTable from './GroupTable'

const Group = () => {

  const [roleData, setRoleData] = useState();
  const [loading, setLoading] = useState(false);

  const URL = process.env.NEXT_PUBLIC_API_URL;

  const { data: session } = useSession() || {};

  const token = session && session.user && session?.user?.token;

  async function fetchRoleData() {
    try {
      const response = await fetch(`${URL}/company/group`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          }
        })

      const datas = await response.json();

      if (response.ok) {

        setLoading(true);
        setRoleData(datas?.data);
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
      fetchRoleData();
    }
  }, [token])

  return (
    <Grid container spacing={6}>
      <Grid size={{ xs: 12 }}>
        <Typography variant='h4' className='mbe-1'>
          Group List
        </Typography>
      </Grid>
      <Grid size={{ xs: 12 }}>
        <GroupCard fetchRoleData={fetchRoleData} tableData={roleData} />
      </Grid>
      <Grid size={{ xs: 12 }}>
        {roleData ? (
          <GroupTable tableData={roleData} fetchRoleData={fetchRoleData} />
        )
          : (
            <SkeletonTableComponent />
          )
        }
      </Grid>
    </Grid>
  )
}

export default Group
