// MUI Imports
'use client'

import { useState, useEffect } from 'react'

import { useSession } from 'next-auth/react'

import Typography from '@mui/material/Typography'

import Grid from '@mui/material/Grid2'

import SkeletonTableComponent from '@/components/skeleton/table/page'

import MailTemplateTable from './MailTemplateTable'

const MailTemplateList = () => {

  const [mailTemplateData, setMailTemplateData] = useState();
  const [loading, setLoading] = useState(false);

  const URL = process.env.NEXT_PUBLIC_API_URL;

  const { data: session } = useSession() || {};

  const token = session && session.user && session?.user?.token;

  async function fetchMailTemplateData() {
    try {
      const response = await fetch(`${URL}/company/mail/template/data`,
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
        setMailTemplateData(datas?.data);
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
      fetchMailTemplateData();
    }
  }, [token])

  return (
    <Grid container spacing={6}>
      <Grid size={{ xs: 12 }}>
        <Typography variant='h4' className='mbe-1'>
          Mail template List
        </Typography>
      </Grid>
      <Grid size={{ xs: 12 }}>
        {mailTemplateData ? (
          <MailTemplateTable tableData={mailTemplateData} fetchMailTemplateData={fetchMailTemplateData} />
        )
          : (
            <SkeletonTableComponent />
          )
        }
      </Grid>
    </Grid>
  )
}

export default MailTemplateList
