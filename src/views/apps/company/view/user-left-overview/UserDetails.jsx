// MUI Imports
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'
import Divider from '@mui/material/Divider'

// Component Imports
import CustomAvatar from '@core/components/mui/Avatar'

import { getInitials } from '@/utils/getInitials';

const public_url = process.env.NEXT_PUBLIC_ASSETS_URL;

const getAvatar = params => {
  const { avatar, fullName } = params

  if (avatar) {
    return <CustomAvatar src={`${public_url}/uploads/images/${avatar}`} size={34} />
  } else {
    return <CustomAvatar size={34}>{getInitials(fullName)}</CustomAvatar>
  }
}

const UserDetails = ({
  company
}) => {

  return (
    <>
      <Card>
        <CardContent className='flex flex-col pbs-12 gap-6'>
          <div className='flex flex-col gap-6'>
            <div className='flex items-center justify-center flex-col gap-4'>
              <div className='flex flex-col items-center gap-4'>
                {getAvatar({ avatar: company?.photo, fullName: company?.first_name + " " + company?.last_name })}
                <Typography variant='h5'>{`${company?.first_name} ${company?.last_name}`}</Typography>
              </div>
              <Chip label='User' color='secondary' size='small' variant='tonal' />
            </div>
            {/* <div className='flex items-center justify-around flex-wrap gap-4'>
              <div className='flex items-center gap-4'>
                <CustomAvatar variant='rounded' color='primary' skin='light'>
                  <i className='tabler-checkbox' />
                </CustomAvatar>
                <div>
                  <Typography variant='h5'>1.23k</Typography>
                  <Typography>Task Done</Typography>
                </div>
              </div>
              <div className='flex items-center gap-4'>
                <CustomAvatar variant='rounded' color='primary' skin='light'>
                  <i className='tabler-briefcase' />
                </CustomAvatar>
                <div>
                  <Typography variant='h5'>568</Typography>
                  <Typography>Project Done</Typography>
                </div>
              </div>
            </div> */}
          </div>
          <div>
            <Typography variant='h5'>Details</Typography>
            <Divider className='mlb-4' />
            <div className='flex flex-col gap-2'>
              <div className='flex items-center flex-wrap gap-x-1.5'>
                <Typography className='font-medium' color='text.primary'>
                  Email:
                </Typography>
                <Typography>{company?.email}</Typography>
              </div>
              <div className='flex items-center flex-wrap gap-x-1.5'>
                <Typography className='font-medium' color='text.primary'>
                  Status
                </Typography>
                <Typography color='text.primary'>{company?.status ? "Active" : "Inctive"}</Typography>
              </div>
              <div className='flex items-center flex-wrap gap-x-1.5'>
                <Typography className='font-medium' color='text.primary'>
                  User created:
                </Typography>
                <Typography color='text.primary'>{company?.company_user?.length}</Typography>
              </div>
              <div className='flex items-center flex-wrap gap-x-1.5'>
                <Typography className='font-medium' color='text.primary'>
                  Contact:
                </Typography>
                <Typography color='text.primary'>{company?.phone}</Typography>
              </div>
              <div className='flex items-center flex-wrap gap-x-1.5'>
                <Typography className='font-medium' color='text.primary'>
                  Package:
                </Typography>
                <Typography color='text.primary'>{company?.package}</Typography>
              </div>
              <div className='flex items-center flex-wrap gap-x-1.5'>
                <Typography className='font-medium' color='text.primary'>
                  Country:
                </Typography>
                <Typography color='text.primary'>{company?.country}</Typography>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  )
}

export default UserDetails
