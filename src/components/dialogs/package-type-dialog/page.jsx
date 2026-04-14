// Imports

import { useEffect, useState } from 'react'

import { useForm, Controller } from 'react-hook-form'
import { valibotResolver } from '@hookform/resolvers/valibot'
import {
  object,
  string,
  minLength,
  pipe,
  maxLength,
  boolean,
  regex
} from 'valibot'

import CircularProgress from '@mui/material/CircularProgress'

// MUI Imports
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import Alert from '@mui/material/Alert'
import FormControl from '@mui/material/FormControl'
import FormLabel from '@mui/material/FormLabel'
import RadioGroup from '@mui/material/RadioGroup'
import Radio from '@mui/material/Radio'
import FormControlLabel from '@mui/material/FormControlLabel'

// Component Imports

import { useSession } from 'next-auth/react'

import { toast } from 'react-toastify'

import CustomTextField from '@core/components/mui/TextField'

import DialogCloseButton from '../DialogCloseButton'


// Schema

const schema = object({
  name: pipe(
    string(),
    minLength(1, 'This field is required'),
    maxLength(255, 'Name can be maximum of 255 characters'),
    regex(/^[A-Za-z\s]+$/, 'Only alphabets and spaces are allowed')
  ),
  status: boolean()
})

// Add Content Component
const AddContent = ({ control, errors }) => (
  <DialogContent className="overflow-visible pbs-0 sm:pli-16">
    <Controller
      name="name"
      control={control}
      rules={{ required: true }}
      render={({ field }) => (
        <CustomTextField
          {...field}
          required
          autoFocus
          fullWidth
          label="Package Type Name"
          variant="outlined"
          placeholder="Enter Package Type Name"
          className="mbe-2"
          error={!!errors.name}
          helperText={errors?.name?.message}
        />
      )}
    />

    <Typography variant="h6" className="mbe-2">Status <span>*</span></Typography>
    <FormControl component="fieldset" error={!!errors.status}>
      <FormLabel component="legend">Select Status</FormLabel>
      <Controller
        name="status"
        control={control}
        render={({ field }) => (
          <RadioGroup
            row
            value={field.value.toString()}
            onChange={(e) => field.onChange(e.target.value === "true")}
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

// Edit Content Component
const EditContent = ({ control, errors }) => (
  <DialogContent className="overflow-visible pbs-0 sm:pli-16">
    <div className="flex items-end gap-4 mbe-2">
      <Controller
        name="name"
        control={control}
        render={({ field }) => (
          <CustomTextField
            {...field}
            required
            fullWidth
            size="small"
            variant="outlined"
            label="Package Type Name"
            placeholder="Enter Package Type Name"
            error={!!errors.name}
            helperText={errors.name?.message}
          />
        )}
      />
    </div>

    <Typography variant="h6" className="mbe-2">Status <span>*</span></Typography>
    <FormControl component="fieldset" error={!!errors.status}>
      <Controller
        name="status"
        control={control}
        render={({ field }) => (
          <RadioGroup
            row
            value={field.value?.toString()}
            onChange={(e) => field.onChange(e.target.value === "true")}
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

// Main Dialog Component
const PackageTypeDialog = ({ open, setOpen, data, fetchPackage, nameData }) => {
  const handleClose = () => {
    setOpen(false)
    fetchPackage();
  }

  const URL = process.env.NEXT_PUBLIC_API_URL
  const { data: session } = useSession() || {}
  const token = session?.user?.token
  const [loading, setLoading] = useState(false);

  // Form setup
  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
    setError
  } = useForm({
    resolver: valibotResolver(schema),
    mode: 'onChange',
    defaultValues: {
      name: data?.name || '',
      status: data?.status ?? false
    },
  })

  // Reset form when dialog opens with new data
  useEffect(() => {
    if (open) {
      reset({
        name: data?.name || '',
        status: data?.status ?? false
      })
    }
  }, [open, data, reset])

  // Form submit
  const submitPackageType = async (formData) => {
    setLoading(true);

    try {
      const response = await fetch(
        data ? `${URL}/admin/package-type/${data?._id}` : `${URL}/admin/package-type`,
        {
          method: data ? "PUT" : "POST",
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify(formData)
        }
      )

      const result = await response.json()

      if (response.ok) {
        setLoading(false);
        handleClose();

        if (typeof fetchPackage === 'function') {
          fetchPackage();
          toast.success(`Package type ${data ? "updated" : "added"} successfully!`, {
            autoClose: 700, // in milliseconds
          });
        }
      } else {
        console.error("Failed to save data:", result?.message || result)
      }
    } catch (error) {
      setLoading(false);
      console.error("Error submitting package type:", error)
    } finally {
      setLoading(false);
    }
  }

  const onSubmit = (formData) => {

    if (!data) {
      const exist = nameData.find(item => item.name.trim().toLowerCase() === formData.name.trim().toLowerCase());

      if (exist) {
        setError('name', {
          type: 'manual',
          message: 'This name already exists.'
        });

        return;
      }
    } else {
      const exist = nameData.find(item =>
        item._id.toString() !== data._id.toString() && item.name.trim().toLowerCase() === formData.name.trim().toLowerCase()
      );

      if (exist) {
        setError('name', {
          type: 'manual',
          message: 'This name already exists.'
        });

        return;
      }
    }

    submitPackageType(formData)

  }

  return (
    <Dialog
      open={open}
      fullWidth
      onClose={handleClose}
      closeAfterTransition={false}
      sx={{ '& .MuiDialog-paper': { overflow: 'visible' } }}
    >
      <form
        onSubmit={handleSubmit(onSubmit)}
        noValidate
      >
        <DialogCloseButton onClick={handleClose}
          disableRipple>
          <i className="tabler-x" />
        </DialogCloseButton>
        <DialogTitle
          variant="h4"
          className="flex flex-col gap-2 text-center sm:pbs-16 sm:pbe-6 sm:pli-16"
        >
          {data ? 'Edit Package Type' : 'Add New Package Type'}
          <Typography component="span" className="flex flex-col text-center">
            {data
              ? 'Edit Package Type as per your requirements.'
              : 'Package Type you may use and assign to your users.'}
          </Typography>
        </DialogTitle>

        {data
          ? <EditContent control={control} errors={errors} />
          : <AddContent control={control} errors={errors} />
        }

        <DialogActions className="flex max-sm:flex-col max-sm:items-center max-sm:gap-2 justify-center pbs-0 sm:pbe-16 sm:pli-16">
          <Button
            type='submit'
            variant='contained'
            disabled={loading}

            // fullWidth
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

          <Button
            onClick={handleClose}
            variant="tonal"
            color="secondary"
            className="max-sm:mis-0"
          >
            Discard
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  )
}

export default PackageTypeDialog
