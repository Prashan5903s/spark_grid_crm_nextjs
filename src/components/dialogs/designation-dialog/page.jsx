// MUI Imports

import { useEffect, useState } from 'react'

import { useSession } from 'next-auth/react'

import Dialog from '@mui/material/Dialog'

import DialogTitle from '@mui/material/DialogTitle'

import DialogContent from '@mui/material/DialogContent'

import DialogActions from '@mui/material/DialogActions'

import Typography from '@mui/material/Typography'

import Button from '@mui/material/Button'

import FormControl from '@mui/material/FormControl'

import CircularProgress from '@mui/material/CircularProgress'

import RadioGroup from '@mui/material/RadioGroup'

import Radio from '@mui/material/Radio'

import FormControlLabel from '@mui/material/FormControlLabel'

import Alert from '@mui/material/Alert'

// React Hook Form
import { useForm, Controller } from 'react-hook-form'

import { valibotResolver } from '@hookform/resolvers/valibot'

// Valibot schema
import { array, string, object, pipe, minLength, maxLength, boolean, nonEmpty, value } from 'valibot'

// Component Imports

import { toast } from 'react-toastify'

import CustomTextField from '@core/components/mui/TextField'

import DialogCloseButton from '../DialogCloseButton'

import SkeletonFormComponent from '@/components/skeleton/form/page'

// Third-party Imports


const schema = object({
  name: pipe(
    string(),
    minLength(1, 'Name is required'),
    maxLength(50, 'Name can be maximum of 50 characters')
  ),
  status: boolean()
})

const DesignationFormContent = ({ control, errors }) => (
  <DialogContent className='overflow-visible pbs-0 sm:pli-16'>
    <div className="flex items-end gap-4 mbe-2">
      <Controller
        name="name"
        control={control}
        render={({ field }) => (
          <CustomTextField
            {...field}
            fullWidth
            required
            size="small"
            variant="outlined"
            label="Designation Name"
            placeholder="Enter Designation Name"
            onKeyDown={(e) => {
              const key = e.key;
              const allowedKeys = ['Backspace', 'Tab', 'ArrowLeft', 'ArrowRight', 'Delete', ' ']; // include space

              // Allow A-Z, a-z, and space
              if (!/^[a-zA-Z ]$/.test(key) && !allowedKeys.includes(key)) {
                e.preventDefault();
              }
            }}

            onPaste={(e) => {
              const paste = e.clipboardData.getData('text');

              // Allow paste if it only contains letters and spaces
              if (!/^[a-zA-Z ]+$/.test(paste)) {
                e.preventDefault();
              }
            }}
            error={!!errors.name}
            helperText={errors.name?.message}
          />
        )}
      />
    </div>

    <Typography variant="h6" className="mbe-2">Status</Typography>
    <FormControl component="fieldset" error={!!errors.status}>
      <Controller
        name="status"
        control={control}
        render={({ field }) => (
          <RadioGroup
            row
            value={String(field.value)}
            onChange={(e) => field.onChange(e.target.value === 'true')}
          >
            <FormControlLabel value="true" control={<Radio />} label="Active" />
            <FormControlLabel value="false" control={<Radio />} label="Inactive" />
          </RadioGroup>
        )}
      />
      {errors?.status && <Alert severity="error">{errors?.status?.message}</Alert>}
    </FormControl>
  </DialogContent>
)

const DesignationDialog = ({ open, setOpen, data, fetchDesignations }) => {
  const handleClose = () => setOpen(false)

  const URL = process.env.NEXT_PUBLIC_API_URL
  const { data: session } = useSession()
  const token = session?.user?.token
  const [loading, setLoading] = useState(false)

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: valibotResolver(schema),
    mode: 'onChange',
    defaultValues: {
      name: '',
      status: true,
    }
  })

  useEffect(() => {
    if (open) {
      reset({
        name: data?.name || '',
        status: data?.status ?? true
      })
    }
  }, [open, data, reset])

  const submitData = async (value) => {
    setLoading(true)

    const isEdit = Boolean(data)

    const endpoint = isEdit
      ? `${URL}/admin/designation/${data._id}`
      : `${URL}/admin/designation`

    const method = isEdit ? 'PUT' : 'POST'

    try {
      const response = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(value)
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.message || 'Something went wrong!')
      }

      toast.success(result.message || 'Operation successful', { autoClose: 700 })
      fetchDesignations()
      setOpen(false)

    } catch (error) {
      console.error('submitData error:', error)
      toast.error(error.message || 'Submission failed')
    } finally {
      setLoading(false)
    }
  }

  const onSubmit = (values) => submitData(values)

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      closeAfterTransition={false}
      sx={{ '& .MuiDialog-paper': { overflow: 'visible' } }}
    >
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <DialogCloseButton onClick={handleClose} disableRipple>
          <i className='tabler-x' />
        </DialogCloseButton>

        <DialogTitle
          variant='h4'
          className='flex flex-col gap-2 text-center sm:pbs-16 sm:pbe-6 sm:pli-16'
        >
          {data ? 'Edit Designation' : 'Add New Designation'}
        </DialogTitle>

        {open ? (
          <DesignationFormContent control={control} errors={errors} />
        ) : (
          <SkeletonFormComponent />
        )}

        <DialogActions className='flex max-sm:flex-col max-sm:items-center max-sm:gap-2 justify-center pbs-0 sm:pbe-16 sm:pli-16'>
          <Button
            type='submit'
            variant='contained'
            disabled={loading}
            sx={{ height: 40, position: 'relative' }}
          >
            {loading ? (
              <CircularProgress
                size={24}
                sx={{
                  color: 'white',
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  marginTop: '-12px',
                  marginLeft: '-12px',
                }}
              />
            ) : (
              data ? 'Update' : 'Create'
            )}
          </Button>
          <Button onClick={handleClose} variant='tonal' color='secondary'>
            Discard
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  )
}

export default DesignationDialog
