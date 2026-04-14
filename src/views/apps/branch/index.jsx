// MUI Imports
'use client'


import { useState, useEffect } from 'react'

import { useSession } from 'next-auth/react'

import Grid from '@mui/material/Grid2'

import Typography from '@mui/material/Typography'

import BranchCards from './BranchCards';
import BranchTable from './BranchTable';

import SkeletonTableComponent from '@/components/skeleton/table/page'

const Branch = () => {

  const [branchData, setBranchData] = useState();
  const [loading, setLoading] = useState(false);

  const URL = process.env.NEXT_PUBLIC_API_URL;

  const { data: session } = useSession() || {};

  const token = session && session.user && session?.user?.token;

  async function fetchBranchData() {
    try {
      const response = await fetch(`${URL}/company/branch`,
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
        setBranchData(datas?.data);
      }

    } catch (error) {
      throw new Error(error);
    } finally {
      setLoading(true);
    }
  }

  useEffect(() => {
    if (URL && token) {
      fetchBranchData();
    }
  }, [token])

  return (
    <Grid container spacing={6}>
      <Grid size={{ xs: 12 }}>
        <Typography variant='h4' className='mbe-1'>
          Branch List
        </Typography>
        <Typography>
          A brach provided access to predefined menus and features so that depending on assigned role an administrator
          can have access to what he need
        </Typography>
      </Grid>
      <Grid size={{ xs: 12 }}>
        <BranchCards fetchBranchData={fetchBranchData} tableData={branchData} />
      </Grid>
      <Grid size={{ xs: 12 }} className='!pbs-12'>
        <Typography variant='h4' className='mbe-1'>
          Total users with their branch
        </Typography>
        <Typography>Find all of your company&#39;s administrator accounts and their associate roles.</Typography>
      </Grid>
      <Grid size={{ xs: 12 }}>
        {branchData ? (
          <BranchTable tableData={branchData} fetchBranchData={fetchBranchData} />
        )
          : (
            <SkeletonTableComponent />
          )
        }
      </Grid>
    </Grid>
  )
}

export default Branch;
