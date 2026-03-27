'use client'

// React Imports
import { useState, useEffect, useRef } from 'react'

// MUI Imports
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import Typography from '@mui/material/Typography'
import FormControl from '@mui/material/FormControl'
import FormControlLabel from '@mui/material/FormControlLabel'
import DialogActions from '@mui/material/DialogActions'
import Button from '@mui/material/Button'
import RadioGroup from '@mui/material/RadioGroup'
import CircularProgress from '@mui/material/CircularProgress'

import Radio from '@mui/material/Radio'

import FormGroup from '@mui/material/FormGroup'

import { Checkbox } from '@mui/material'

// Hook Form + Validation
import { useForm, Controller } from 'react-hook-form'
import { valibotResolver } from '@hookform/resolvers/valibot'
import { object, string, array, pipe, minLength, maxLength, boolean, regex } from 'valibot'

// Component Imports
import { useSession } from 'next-auth/react'

// Third-party Imports
import { toast } from 'react-toastify'

import DialogCloseButton from '../DialogCloseButton'

import tableStyles from '@core/styles/table.module.css'

import CustomTextField from '@core/components/mui/TextField'

// Validation Schema
const schema = object({
  name: pipe(
    string(),
    minLength(1, 'Name is required'),
    maxLength(50, 'Name can be a maximum of 50 characters'),
    regex(/^[A-Za-z\s]+$/, 'Only alphabets and spaces are allowed')
  ),
  description: pipe(
    string(),
    minLength(1, 'Description is required'),
    maxLength(5000, 'Description can be a maximum of 5000 characters')
  ),
  status: boolean(),
  permissions: pipe(
    array(string()),
    minLength(1, 'At least one permission must be selected')
  )
})

const RoleDialog = ({ open, setOpen, title = '', fetchRoleData, selectedRole, tableData }) => {

  const { data: session } = useSession()
  const token = session?.user?.token
  const API_URL = process.env.NEXT_PUBLIC_API_URL

  const [createData, setCreateData] = useState()
  const [loading, setLoading] = useState(false);
  const [selectedPermissions, setSelectedPermissions] = useState({})
  const calledRef = useRef(false)

  const {
    control,
    handleSubmit,
    reset,
    setValue,
    setError,
    formState: { errors }
  } = useForm({
    resolver: valibotResolver(schema),
    mode: 'onChange',
    defaultValues: {
      name: '',
      description: '',
      status: true,
      permissions: []
    }
  })

  const handleClose = () => setOpen(false)

  const handleSelectAllCheckbox = () => {
    if (Object.keys(selectedPermissions).length > 0) {
      setSelectedPermissions({})
      setValue('permissions', [])
    } else if (createData) {
      const allPermissions = {}
      let flatPermissions = []

      createData.forEach(module => {
        if (Array.isArray(module.permission)) {
          allPermissions[module._id] = module.permission.map(p => p._id)
          flatPermissions.push(...module.permission.map(p => p._id))
        }
      })
      setSelectedPermissions(allPermissions)
      setValue('permissions', flatPermissions)
    }
  }

  const togglePermission = (moduleId, permissionId) => {
    setSelectedPermissions(prev => {
      const modulePermissions = prev[moduleId] || []

      const updated = modulePermissions.includes(permissionId)
        ? {
          ...prev,
          [moduleId]: modulePermissions.filter(id => id !== permissionId)
        }
        : {
          ...prev,
          [moduleId]: [...modulePermissions, permissionId]
        }

      const flattened = Object.values(updated).flat()

      setValue('permissions', flattened)

      return updated
    })
  }

  const formData = async () => {
    try {
      const response = await fetch(`${API_URL}/admin/role/create`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      })

      const data = await response.json()

      if (response.ok) {

        setCreateData(data?.data)
      }
    } catch (error) {
      console.error('Error occurred:', error)
    }
  }

  useEffect(() => {
    if (token && !calledRef.current) {
      calledRef.current = true
      formData()
    }
  }, [token])

  useEffect(() => {
    if (open && selectedRole) {
      const flatPermissions = Object.values(selectedRole.permissions || {}).flat()

      reset({
        name: selectedRole?.name || '',
        description: selectedRole?.description || '',
        status: selectedRole?.status || false,
        permissions: flatPermissions
      })

      setSelectedPermissions(selectedRole.permissions || {})

    }
  }, [open, selectedRole, reset])

  const submitData = async values => {

    const name = values.name;

    let hasError = false;

    if (selectedRole) {

      const nameExist = tableData.some(item => {
        return (item.name.trim().toLowerCase() === name.trim().toLowerCase() && (item._id.toString().trim().toLowerCase() !== selectedRole._id.toString().trim().toLowerCase()))
      })


      if (nameExist) {
        hasError = true;
      }

    } else {
      const nameExist = tableData.some(item => {
        return item.name.trim().toLowerCase() === name.trim().toLowerCase()
      })

      if (nameExist) {
        hasError = true;
      }

    }

    if (hasError) {
      setError(`name`, {
        type: 'manual',
        message: 'Label name must be unique.'
      });

      return;
    }

    setLoading(true);

    try {
      const response = await fetch(selectedRole ? `${API_URL}/admin/role/${selectedRole._id}` : `${API_URL}/admin/role`, {
        method: selectedRole ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(values)
      })

      const data = await response.json()

      if (response.ok) {
        // Third-party Imports
        fetchRoleData?.()
        setLoading(false);

        toast.success(`Role ${selectedRole ? "updated" : "added"} successfully!`, {
          autoClose: 700, // in milliseconds
        });

      } else {
        setLoading(false);
        console.error('Server error response:', data)
      }
    } catch (err) {
      console.error('Submit error:', err)
    } finally {
      handleClose()
    }
  }

  const onSubmit = data => {
    submitData({ ...data, permissions: selectedPermissions })
  }

  if (!createData) return;

  return (
    <Dialog
      fullWidth
      maxWidth='md'
      scroll='body'
      open={open}
      closeAfterTransition={false}
      sx={{ '& .MuiDialog-paper': { overflow: 'visible' } }}
    >
      <DialogCloseButton onClick={handleClose}>
        <i className='tabler-x' />
      </DialogCloseButton>

      <DialogTitle variant='h4' className='flex flex-col gap-2 text-center sm:pbs-16 sm:pbe-6 sm:pli-16'>
        {selectedRole ? 'Edit Role' : 'Add Role'}
      </DialogTitle>

      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <DialogContent className='overflow-visible flex flex-col gap-6 pbs-0 sm:pli-16'>
          <Controller
            name='name'
            control={control}
            render={({ field }) => (
              <CustomTextField
                {...field}
                label='Role Name'
                required
                placeholder='Enter Role Name'
                variant='outlined'
                fullWidth
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
          <Controller
            name='description'
            control={control}
            render={({ field }) => (
              <CustomTextField
                {...field}
                label='Description'
                placeholder='Enter Role Description'
                variant='outlined'
                fullWidth
                required
                multiline
                rows={4}
                error={!!errors.description}
                helperText={errors.description?.message}
              />
            )}
          />

          <FormControl>
            <Typography variant="h6" className="mbe-2">
              Status <span>*</span>
            </Typography>
            <Controller
              name='status'
              control={control}
              render={({ field }) => (
                <RadioGroup
                  row
                  required={true}
                  value={String(field.value)}
                  onChange={(e) => field.onChange(e.target.value === 'true')}
                >
                  <FormControlLabel value='true' control={<Radio />} label='Active' />
                  <FormControlLabel value='false' control={<Radio />} label='Inactive' />
                </RadioGroup>
              )}
            />
          </FormControl>

          <Typography variant='h5' className='min-is-[225px]'>
            Role Permissions <span>*</span>
          </Typography>
          <div className='overflow-x-auto'>
            <table className={tableStyles.table}>
              <tbody>
                <tr className='border-bs-0'>
                  <th className='pis-0'>
                    <Typography color='text.primary' className='font-medium whitespace-nowrap flex-grow min-is-[225px]'>
                      Administrator Access
                    </Typography>
                  </th>
                  <th className='!text-end pie-0'>
                    <FormControlLabel
                      className='mie-0 capitalize'
                      control={
                        <Checkbox
                          onChange={handleSelectAllCheckbox}
                          indeterminate={Object.keys(selectedPermissions).length > 0 &&
                            Object.values(selectedPermissions).flat().length !== createData.reduce((acc, cur) => acc + cur.permission.length, 0)}
                          checked={Object.values(selectedPermissions).flat().length === createData.reduce((acc, cur) => acc + cur.permission.length, 0)}
                        />
                      }
                      label='Select All'
                    />
                  </th>
                </tr>
                {createData.map((item, index) => (
                  <tr key={index} className='border-be'>
                    <td className='pis-0 w-full'>
                      <Typography data-id={item._id} className='font-medium whitespace-nowrap flex-grow min-is-[225px]' color='text.primary'>
                        {item.name}
                      </Typography>
                    </td>
                    <td className='!text-end pie-0'>
                      {Array.isArray(item.permission) && (
                        <FormGroup className='flex-row justify-start flex-nowrap gap-6'>
                          {item.permission
                            .slice()
                            .sort((a, b) => a.name.localeCompare(b.name))
                            .map((perm, idx) => (
                              <FormControlLabel
                                key={idx}
                                data-id={perm._id}
                                className='mie-0'
                                control={
                                  <Checkbox
                                    checked={selectedPermissions[item._id]?.includes(perm._id) || false}
                                    onChange={() => togglePermission(item._id, perm._id)}
                                  />
                                }
                                label={perm.name}
                              />
                            ))}
                        </FormGroup>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {errors.permissions && errors.permissions.message && (
              <Typography color="error" variant="body2" className="mt-2" style={{ color: `var(--mui-palette-error-main)` }}>
                {errors.permissions.message}
              </Typography>
            )}
          </div>
        </DialogContent>

        <DialogActions className='justify-center pbs-0 sm:pbe-16 sm:pli-16'>
          <Button variant='contained' type='submit' disabled={loading}>
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
              selectedRole ? "Update" : 'Submit'
            )}
          </Button>
          <Button variant='tonal' type='reset' color='secondary' onClick={handleClose}>
            Cancel
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  )
}

export default RoleDialog
