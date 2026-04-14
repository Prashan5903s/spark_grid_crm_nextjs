// MUI Imports
'use client'

import { useState, useEffect } from 'react'

import { useSession } from 'next-auth/react'

import Typography from '@mui/material/Typography'

import Grid from '@mui/material/Grid2'

import SkeletonTableComponent from '@/components/skeleton/table/page'

import RoleCards from './RoleCards'

import RolesTable from './RolesTable'

const Role = () => {

  const [roleData, setRoleData] = useState();
  const [loading, setLoading] = useState(false);

  const URL = process.env.NEXT_PUBLIC_API_URL;

  const { data: session } = useSession() || {};

  const token = session && session.user && session?.user?.token;

  async function fetchRoleData() {
    try {
      const response = await fetch(`${URL}/company/role`,
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
          Roles List
        </Typography>
        <Typography>
          A role provided access to predefined menus and features so that depending on assigned role an administrator
          can have access to what he need
        </Typography>
      </Grid>
      <Grid size={{ xs: 12 }}>
        <RoleCards fetchRoleData={fetchRoleData} tableData={roleData} />
      </Grid>
      <Grid size={{ xs: 12 }} className='!pbs-12'>
        <Typography variant='h4' className='mbe-1'>
          Total users with their roles
        </Typography>
        <Typography>Find all of your company&#39;s administrator accounts and their associate roles.</Typography>
      </Grid>
      <Grid size={{ xs: 12 }}>
        {roleData ? (
          <RolesTable tableData={roleData} fetchRoleData={fetchRoleData} />
        )
          : (
            <SkeletonTableComponent />
          )
        }
      </Grid>
    </Grid>
  )
}

export default Role
