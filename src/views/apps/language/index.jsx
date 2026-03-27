// MUI Imports
'use client'

import { useState, useEffect } from 'react'

import { useSession } from 'next-auth/react'

import Grid from '@mui/material/Grid2'

import Typography from '@mui/material/Typography'

import SkeletonTableComponent from '@/components/skeleton/table/page'

import LanguageCard from './LanguageCards'

import LanguageTable from './LanguageTable'

const Languages = () => {

  const [languageData, setLanguageData] = useState();
  const [loading, setLoading] = useState(false);

  const URL = process.env.NEXT_PUBLIC_API_URL;

  const { data: session } = useSession() || {};

  const token = session && session.user && session?.user?.token;

  async function fetchLanguageData() {
    try {
      const response = await fetch(`${URL}/company/language`,
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
        setLanguageData(datas?.data);
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
      <Grid size={{ xs: 12 }}>
        <Typography variant='h4' className='mbe-1'>
          Language List
        </Typography>
        <Typography>
          A language provided access to predefined menus and features so that depending on assigned role an administrator
          can have access to what he need
        </Typography>
      </Grid>
      <Grid size={{ xs: 12 }}>
        <LanguageCard
          fetchLanguageData={fetchLanguageData}
          tableData={languageData}
        />
      </Grid>
      <Grid size={{ xs: 12 }} className='!pbs-12'>
        <Typography variant='h4' className='mbe-1'>
          Total users with their language
        </Typography>
        <Typography>Find all of your company&#39;s administrator accounts and their associate language.</Typography>
      </Grid>
      <Grid size={{ xs: 12 }}>
        {languageData ? (
          <LanguageTable
            tableData={languageData}
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

export default Languages
