'use client'

import { useState, useEffect } from 'react'

// MUI Imports
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Grid from '@mui/material/Grid2'
import Typography from '@mui/material/Typography'
import Avatar from '@mui/material/Avatar'
import AvatarGroup from '@mui/material/AvatarGroup'
import IconButton from '@mui/material/IconButton'
import Button from '@mui/material/Button'

// Component Imports
import ZoneDialog from '@components/dialogs/zone-dialog/page';
import OpenDialogOnElementClick from '@components/dialogs/OpenDialogOnElementClick'

import Link from '@components/Link'

import { usePermissionList } from '@/utils/getPermission'

// Dummy Role Data
const cardData = [
  { totalUsers: 4, title: 'Administrator', avatars: ['1.png', '2.png', '3.png', '4.png'] },
  { totalUsers: 7, title: 'Editor', avatars: ['5.png', '6.png', '7.png'] },
  { totalUsers: 5, title: 'Users', avatars: ['4.png', '5.png', '6.png'] },
  { totalUsers: 6, title: 'Support', avatars: ['1.png', '2.png', '3.png'] },
  { totalUsers: 10, title: 'Restricted User', avatars: ['4.png', '5.png', '6.png'] }
]

const ZoneCards = ({ fetchZoneData, tableData }) => {

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
  }, [getPermissions]); // Include in dependency array

  return (
    <Grid container spacing={6}>
      {cardData.map((item, index) => (
        <Grid key={index} size={{ xs: 12, sm: 6, lg: 4 }}>
          <Card>
            <CardContent className='flex flex-col gap-4'>
              <div className='flex items-center justify-between'>
                <Typography className='flex-grow'>{`Total ${item.totalUsers} users`}</Typography>
                <AvatarGroup total={item.totalUsers}>
                  {item.avatars.map((img, idx) => (
                    <Avatar key={idx} alt={item.title} src={`/images/avatars/${img}`} />
                  ))}
                </AvatarGroup>
              </div>

              <div className='flex justify-between items-center'>
                <div className='flex flex-col items-start gap-1'>
                  <Typography variant='h5'>{item.title}</Typography>

                  <OpenDialogOnElementClick
                    element={Typography}
                    elementProps={{
                      children: 'Edit Role',
                      component: Link,
                      color: 'primary',
                      onClick: e => e.preventDefault()
                    }}
                    dialog={({ open, setOpen, tableData }) => (
                      <ZoneDialog open={open} setOpen={setOpen} title={item.title} fetchZoneData={fetchZoneData} tableData={tableData} />
                    )}
                  />
                </div>

                <IconButton>
                  <i className='tabler-copy text-secondary' />
                </IconButton>
              </div>
            </CardContent>
          </Card>
        </Grid>
      ))}

      {/* Add Role Card */}
      {permissions && permissions?.['hasZoneAddPermission'] && (
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
                          Add Zones
                        </Button>
                        <Typography>
                          Add new zones, <br />
                          if it doesn&apos;t exist.
                        </Typography>
                      </div>
                    </CardContent>
                  </Grid>
                </Grid>
              )
            }}
            dialog={({ open, setOpen }) => (
              <ZoneDialog open={open} setOpen={setOpen} fetchZoneData={fetchZoneData} tableData={tableData} />
            )}
          />
        </Grid>
      )}
    </Grid>
  )
}

export default ZoneCards
