'use client'

import { useEffect, useState } from 'react'

import { useSession } from 'next-auth/react'

import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogActions,
  DialogContent,
  Checkbox,
  FormControlLabel,
  Stack,
  Typography,
  Skeleton,
  Tab,
  Card,
  CardContent
} from '@mui/material'

import Grid from '@mui/material/Grid2'
import { TabContext, TabList, TabPanel } from '@mui/lab'
import { toast } from 'react-toastify'

import DialogCloseButton from '@/components/dialogs/DialogCloseButton'

/* ---------------------------------------
   Group Notifications By Category
--------------------------------------- */
const groupByCategory = notifications =>
  notifications.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = []
    }

    acc[item.category].push(item)

    return acc
  }, {})

/* ---------------------------------------
   Email Template Modal
--------------------------------------- */
const EmailTemplateModal = ({ open, onClose, templateData }) => {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth='lg'
      sx={{
        '& .MuiDialog-paper': {
          overflow: 'visible'
        }
      }}
    >
      <DialogCloseButton onClick={onClose} disableRipple>
        <i className='tabler-x' />
      </DialogCloseButton>

      <DialogTitle>Template Details</DialogTitle>

      <DialogContent dividers>
        <Typography variant='h6' gutterBottom>
          Subject
        </Typography>

        <Typography variant='body1' gutterBottom>
          {templateData?.subject || '-'}
        </Typography>

        <Typography variant='h6' gutterBottom>
          Message
        </Typography>

        <Typography
          variant='body1'
          dangerouslySetInnerHTML={{
            __html: templateData?.message || ''
          }}
        />
      </DialogContent>

      <DialogActions
        sx={{
          mt: 2,
          display: 'flex',
          justifyContent: 'center'
        }}
      >
        <Button onClick={onClose} variant='outlined'>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  )
}

/* ---------------------------------------
   Email Notification Tab
--------------------------------------- */
const EmailNotificationTab = ({
  formData,
  handleCheckboxChange,
  isOpen,
  setIsOpen,
  editData,
  setEditData
}) => {
  const grouped = groupByCategory(formData || [])

  const handleClose = () => {
    setIsOpen(false)
    setEditData(null)
  }

  return (
    <Box>
      {Object.entries(grouped).map(([category, items]) => (
        <Box key={"email_template"} mb={4}>
          <Stack spacing={2}>
            {items.map(item => (
              <Box
                key={item._id}
                display='flex'
                justifyContent='space-between'
                alignItems='center'
                border='1px solid #ddd'
                borderRadius={2}
                p={2}
              >
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={!!item.default_select}
                      onChange={handleCheckboxChange(item)}
                      color='primary'
                    />
                  }
                  label={item.template_name}
                />

                <Grid size={{ xs: 12 }}>
                  <Button
                    type='button'
                    onClick={() => {
                      setEditData(item)
                      setIsOpen(true)
                    }}
                  >
                    <i className='tabler-eye' />
                  </Button>
                </Grid>
              </Box>
            ))}
          </Stack>
        </Box>
      ))}

      <EmailTemplateModal
        open={isOpen}
        onClose={handleClose}
        templateData={editData}
      />
    </Box>
  )
}

/* ---------------------------------------
   Skeleton Loader
--------------------------------------- */
const SkeletonComponent = () => {
  return (
    <Card>
      <CardContent>
        <Stack direction='row' spacing={2}>
          {[...Array(4)].map((_, idx) => (
            <Skeleton
              key={idx}
              variant='rectangular'
              width={100}
              height={40}
            />
          ))}
        </Stack>

        <Box mt={4}>
          <Skeleton variant='text' height={40} width='60%' />
          <Skeleton variant='text' height={30} width='40%' />
          <Skeleton variant='rectangular' height={200} sx={{ mt: 2 }} />
        </Box>
      </CardContent>
    </Card>
  )
}

/* ---------------------------------------
   Main Component
--------------------------------------- */
const NotificationTabs = () => {
  const { data: session } = useSession()

  const token = session?.user?.token
  const URL = process.env.NEXT_PUBLIC_API_URL

  const [tabValue, setTabValue] = useState('email_template')
  const [formData, setFormData] = useState([])
  const [loading, setLoading] = useState(true)
  const [editData, setEditData] = useState(null)

  const [isOpen, setIsOpen] = useState(false)

  /* Fetch Notification Data */
  const fetchNotificationFormData = async () => {
    if (!token || !URL) return

    setLoading(true)

    try {
      const res = await fetch(`${URL}/company/notification/data`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })

      const json = await res.json()

      if (!res.ok) {
        throw new Error(json?.message || 'Failed to fetch notifications')
      }

      setFormData(json?.data || [])
    } catch (error) {
      console.error(error)
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  /* Update Notification Checkbox */
  const updateCheckNotificationAPI = async (payload, id) => {
    try {
      const response = await fetch(
        `${URL}/company/notification/check/select/${id}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify(payload)
        }
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data?.message || 'Failed to update notification')
      }

      toast.success('Template updated successfully', {
        autoClose: 1000
      })
      fetchNotificationFormData()
    } catch (error) {
      console.error(error)
      toast.error(error.message)
    }
  }

  /* Checkbox Handler */
  const handleCheckboxChange = item => async event => {
    const updatedDefault = event.target.checked

    const payload = {
      template_name: item.template_name,
      subject: item.subject,
      message: item.message,
      schedule_days: item.schedule_days,
      default_select: updatedDefault
    }

    await updateCheckNotificationAPI(payload, item._id)
  }

  useEffect(() => {
    fetchNotificationFormData()
  }, [token, URL])

  if (loading) {
    return <SkeletonComponent />
  }

  return (
    <Card>
      <CardContent>
        <TabContext value={tabValue}>
          <TabList
            onChange={(_, newVal) => setTabValue(newVal)}
            variant='scrollable'
            className='border-b'
          >
            <Tab
              label='Email Template'
              value='email_template'
            />
          </TabList>

          <Box mt={4}>
            <TabPanel value='email_template' className='p-0'>
              <EmailNotificationTab
                formData={formData}
                handleCheckboxChange={handleCheckboxChange}
                isOpen={isOpen}
                setIsOpen={setIsOpen}
                editData={editData}
                setEditData={setEditData}
              />
            </TabPanel>
          </Box>
        </TabContext>
      </CardContent>
    </Card>
  )
}

export default NotificationTabs
