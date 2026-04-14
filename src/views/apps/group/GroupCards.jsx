'use client'

// MUI Imports

import { useState, useEffect } from 'react'

import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Grid from '@mui/material/Grid2'
import Typography from '@mui/material/Typography'

import Button from '@mui/material/Button'

// Component Imports
import GroupDialog from '@components/dialogs/group-dialog/page'

import OpenDialogOnElementClick from '@components/dialogs/OpenDialogOnElementClick'

import { usePermissionList } from '@/utils/getPermission'

// Dummy Role Data
const cardData = [
  { totalUsers: 4, title: 'Administrator', avatars: ['1.png', '2.png', '3.png', '4.png'] },
  { totalUsers: 7, title: 'Editor', avatars: ['5.png', '6.png', '7.png'] },
  { totalUsers: 5, title: 'Users', avatars: ['4.png', '5.png', '6.png'] },
  { totalUsers: 6, title: 'Support', avatars: ['1.png', '2.png', '3.png'] },
  { totalUsers: 10, title: 'Restricted User', avatars: ['4.png', '5.png', '6.png'] }
]

const GroupCard = ({ fetchRoleData, tableData }) => {

  const getPermissions = usePermissionList(); // returns an async function
  const [permissions, setPermissions] = useState({});

  useEffect(() => {
    const fetchPermissions = async () => {
      try {
        const result = await getPermissions();

        setPermissions(result);
      } catch (error) {
        console.error('Error fetching permissions:', error);
      }
    };

    if (getPermissions) {
      fetchPermissions();
    }
  }, [getPermissions]);

  return (
    <Grid container spacing={6}>
      {/* Add Role Card */}
      {permissions && permissions?.['hasGroupAddPermission'] && (
        <Grid size={{ xs: 12, sm: 6, lg: 4 }}>
          <OpenDialogOnElementClick
            element={Card}
            elementProps={{
              className: 'cursor-pointer bs-full',
              children: (
                <Grid container className='bs-full'>
                  <Grid size={{ xs: 5 }}>
                    <div className='flex items-end justify-center bs-full'>
                      <img alt='add-role' src='/images/illustrations/characters/5.png' height={130} />
                    </div>
                  </Grid>
                  <Grid size={{ xs: 7 }}>
                    <CardContent>
                      <div className='flex flex-col items-end gap-4 text-right'>
                        <Button variant='contained' size='small'>
                          Add Group
                        </Button>
                        <Typography>
                          Add new Group
                        </Typography>
                      </div>
                    </CardContent>
                  </Grid>
                </Grid>
              )
            }}
            dialog={({ open, setOpen }) => (
              <GroupDialog
                open={open}
                setOpen={setOpen}
                fetchRoleData={fetchRoleData}
                tableData={tableData}
              />
            )}
          />
        </Grid>
      )}
    </Grid>
  )
}

export default GroupCard
