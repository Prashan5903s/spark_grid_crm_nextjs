// MUI Imports

import { useEffect, useState } from 'react'

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
import { array, string, object, pipe, minLength, maxLength, boolean, nonEmpty, value, regex } from 'valibot'

// Component Imports

import { useSession } from 'next-auth/react'


import { MenuItem } from '@mui/material'

// Third-party Imports
import { toast } from 'react-toastify'

import DialogCloseButton from '../DialogCloseButton'

import SkeletonFormComponent from '@/components/skeleton/form/page'

import CustomTextField from '@core/components/mui/TextField'

const schema = object({
  name: pipe(
    string(),
    minLength(1, 'Name is required'),
    maxLength(255, 'Name can be maximum of 255 characters'),
    regex(/^[A-Za-z\s]+$/, 'Only alphabets and spaces are allowed')
  ),
  permissionmodule: pipe(
    array(string()),
    nonEmpty('Select at least one permission')
  ),
  status: boolean()
})

const AddContent = ({ control, errors, createData }) => (
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
            label="Permission Name"
            placeholder="Enter Permission Name"
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

    <Controller
      name="permissionmodule"
      control={control}
      render={({ field }) => (
        <CustomTextField
          {...field}
          select
          required
          fullWidth
          label="Permission"
          variant="outlined"
          placeholder="Select Package Type"
          className="mbe-2"
          error={!!errors.permissionmodule}
          helperText={errors?.permissionmodule?.message}
          SelectProps={{
            multiple: true,
            value: field.value || [], // Ensure it's always an array
            onChange: (event) => {
              field.onChange(event.target.value); // Pass the selected array
            },
          }}
        >
          {createData.map((data) => (
            <MenuItem key={data._id} value={data._id}>
              {data.name}
            </MenuItem>
          ))}
        </CustomTextField>
      )}
    />

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

const EditContent = ({ control, errors, createData }) => (
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
            label="Permission Name"
            placeholder="Enter Permission Name"
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

    {/* <Controller name="permissionmodule" control={control} render={({ field }) => (
            <CustomTextField {...field} select fullWidth label="Permission module" variant="outlined" placeholder="Select Package Type" className="mbe-2" error={!!errors.permissionmodule} helperText={errors?.permissionmodule?.message}>
                {createData.map((data) => (
                    <MenuItem key={data._id} value={data._id}>{data.name}</MenuItem>
                ))}
            </CustomTextField>
        )} /> */}

    <Controller
      name="permissionmodule"
      control={control}
      render={({ field }) => (
        <CustomTextField
          {...field}
          select
          required
          fullWidth
          label="Permission"
          variant="outlined"
          placeholder="Select Package Type"
          className="mbe-2"
          error={!!errors.permissionmodule}
          helperText={errors?.permissionmodule?.message}
          SelectProps={{
            multiple: true,
            value: field.value || [], // Ensure it's always an array
            onChange: (event) => {
              field.onChange(event.target.value); // Pass the selected array
            },
          }}
        >
          {createData.map((data) => (
            <MenuItem key={data._id} value={data._id}>
              {data.name}
            </MenuItem>
          ))}
        </CustomTextField>
      )}
    />

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

const PermissionDialog = ({ open, setOpen, data, fetchPermissionModule, nameData }) => {
  const handleClose = () => setOpen(false)

  const URL = process.env.NEXT_PUBLIC_API_URL
  const { data: session } = useSession() || {}
  const token = session?.user?.token
  const [editData, setEditData] = useState();
  const [createData, setCreateData] = useState();
  const [loading, setLoading] = useState(false);

  const {
    control,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm({
    resolver: valibotResolver(schema),
    mode: 'onChange',
    defaultValues: {
      name: data?.name || '',
      status: data?.status ?? false,
      permissionmodule: Array.isArray(data?.permission_module_id)
        ? data.permission_module_id
        : data?.permission_module_id
          ? [data.permission_module_id]
          : []

    }
  })

  useEffect(() => {
    if (open && data && editData) {
      reset({
        name: data.name || '',
        status: data.status ?? false,
        permissionmodule: editData || []
      })
    } else {
      reset({
        name: "",
        status: false,
        permissionmodule: []
      });
    }
  }, [open, data, reset, editData])

  const fetchFormData = async () => {
    try {
      const response = await fetch(`${URL}/admin/permission/create`, {
        method: "GET",
        headers: {
          // "Content-Type": "application/json",
          'authorization': `Bearer ${token}`
        }
      })

      const data = await response.json();

      if (response.ok) {
        setCreateData(data?.data);
      }

    } catch (error) {
      console.log("Error", error);

    }
  }

  const editFormData = async (value) => {
    const response = await fetch(`${URL}/admin/permission/edit/${value._id}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      }
    });

    const data = await response.json();

    if (response.ok) {
      setEditData(data?.data?.permission_module_id);
    }

  }

  useEffect(() => {
    if (URL && token) {
      fetchFormData();

      if (data) {
        editFormData(data);
      }
    }

  }, [URL, token, data])

  const submitData = async (VALUE) => {
    setLoading(true);

    try {
      const response = await fetch(data ? `${URL}/admin/permission/${editData}/${data?._id}` : `${URL}/admin/permission`,
        {
          method: data ? "PUT" : "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify(VALUE)
        }
      );

      const responseData = await response.json();

      if (response.ok) {
        setLoading(false);
        fetchPermissionModule();
        toast.success(`Permission ${data ? "updated" : "added"} successfully!`, {
          autoClose: 700, // in milliseconds
        });
      }

    } catch (error) {
      setLoading(false);
      console.log("Error", error);
    } finally {
      setLoading(false);
    }

  }

  const onSubmit = (values) => {

    if (!data) {
      const exist = nameData.find(item => item.name.trim().toLowerCase() === values.name.trim().toLowerCase());

      if (exist) {
        setError('name', {
          type: 'manual',
          message: 'This name already exists.'
        });

        return;
      }
    } else {
      const exist = nameData.find(item =>
        item._id.toString() !== data._id.toString() && item.name.trim().toLowerCase() === values.name.trim().toLowerCase()
      );

      if (exist) {
        setError('name', {
          type: 'manual',
          message: 'This name already exists.'
        });

        return;
      }
    }

    submitData(values);
    setOpen(false)

    // handle API or logic here
  }

  return (
    <Dialog
      open={open}
      fullWidth
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
          {data ? 'Edit Permission' : 'Add Permission'}
        </DialogTitle>

        {createData ? (

          data ? (
            <EditContent control={control} errors={errors} createData={createData} />
          ) : (
            <AddContent control={control} errors={errors} createData={createData} />
          )
        )
          : <SkeletonFormComponent />
        }

        <DialogActions className='flex max-sm:flex-col max-sm:items-center max-sm:gap-2 justify-center pbs-0 sm:pbe-16 sm:pli-16'>
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


          <Button onClick={handleClose} variant='tonal' color='secondary'>
            Discard
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  )
}

export default PermissionDialog
