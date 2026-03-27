// Imports

import { useEffect, useState } from 'react'

import { useForm, Controller } from 'react-hook-form'

import { valibotResolver } from '@hookform/resolvers/valibot'

import CircularProgress from '@mui/material/CircularProgress'

import { Checkbox } from '@mui/material'

import {
  object,
  string,
  minLength,
  maxLength,
  nonEmpty,
  pipe,
  array,
  integer,
  minValue,
  maxValue,
  boolean,
  number,
  regex
} from 'valibot'

// MUI Imports
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import Alert from '@mui/material/Alert'
import FormControl from '@mui/material/FormControl'
import MenuItem from '@mui/material/MenuItem'
import RadioGroup from '@mui/material/RadioGroup'
import { Radio, FormGroup } from '@mui/material'
import FormControlLabel from '@mui/material/FormControlLabel'

// Component Imports

import { toast } from 'react-toastify'

import { useSession } from 'next-auth/react'

import CustomTextField from '@core/components/mui/TextField'

import DialogCloseButton from '../DialogCloseButton'

import SkeletonFormComponent from '@/components/skeleton/form/page'

import tableStyles from '@core/styles/table.module.css'

// Schema
const schema = object({
  name: pipe(
    string(),
    minLength(1, 'Name is required'),
    maxLength(100, 'Name can be maximum of 100 characters'),
    regex(/^[A-Za-z\s]+$/, 'Only alphabets and spaces are allowed') // ✅ Alphabet & space only
  ),
  description: pipe(
    string(),
    minLength(1, 'Description is required'),
    maxLength(5000, 'Description can be maximum of 5000 characters')
  ),
  amount: pipe(
    number('Amount must be a number'),
    integer('Amount must be a whole number'), // ✅ No decimal/symbols
    minValue(1, 'Amount must be at least 1'),
    maxValue(1000000, 'Amount must be less than or equal to 1,000,000')
  ),
  packagetype: pipe(
    string(),
    nonEmpty('Please select a package type')
  ),
  status: boolean(),
  permissions: pipe(
    array(string()),
    minLength(1, 'At least one permission must be selected')
  )
})

const AddContent = ({ control, errors, createData, handleSelectAllCheckbox, selectedPermissions, permissionData, togglePermission }) => (
  <DialogContent className="overflow-visible pbs-0 sm:pli-16">
    {/* name */}
    <Controller
      name="name"
      control={control}
      render={({ field }) => (
        <CustomTextField
          {...field}
          fullWidth
          required
          label="Package Name"
          variant="outlined"
          placeholder="Enter Package Name"
          className="mbe-2"
          error={!!errors.name}
          helperText={errors?.name?.message}
        />
      )}
    />

    {/* amount */}
    <Controller
      name="amount"
      control={control}
      render={({ field }) => (
        <CustomTextField
          {...field}
          fullWidth
          label="Amount"
          required
          variant="outlined"
          placeholder="Enter Amount"
          className="mbe-2"
          error={!!errors.amount}
          helperText={typeof errors?.amount?.message === 'string' ? errors.amount.message : ''}
          value={field.value ?? ''}
          onChange={(e) => field.onChange(Number(e.target.value))}
          type="number"
        />
      )}
    />

    {/* description */}
    <Controller name="description" control={control} render={({ field }) => (
      <CustomTextField {...field} required fullWidth label="Description" variant="outlined" placeholder="Enter Package Type Description" className="mbe-2" multiline rows={4} error={!!errors.description} helperText={errors?.description?.message} />
    )} />

    {/* packagetype */}
    <Controller name="packagetype" control={control} render={({ field }) => (
      <CustomTextField {...field} required select fullWidth label="Package Type" variant="outlined" placeholder="Select Package Type" className="mbe-2" error={!!errors.packagetype} helperText={errors?.packagetype?.message}>
        {createData.map((data) => (
          <MenuItem key={data._id} value={data._id}>{data.name}</MenuItem>
        ))}
      </CustomTextField>
    )} />

    {/* status */}
    <Typography variant="h6" className="mbe-2">Status <span>*</span></Typography>
    <FormControl component="fieldset" error={!!errors.status}>
      <Controller name="status" control={control} render={({ field }) => (
        <RadioGroup row value={field.value?.toString()} onChange={(e) => field.onChange(e.target.value === "true")}>
          <FormControlLabel value="true" control={<Radio />} label="Active" />
          <FormControlLabel value="false" control={<Radio />} label="Inactive" />
        </RadioGroup>
      )} />
      {errors?.status && <Alert severity="error">{errors?.status?.message}</Alert>}
    </FormControl>

    <Typography variant='h5' className='min-is-[225px]'>
      Permissions <span>*</span>
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
                      Object.values(selectedPermissions).flat().length !== permissionData.reduce((acc, cur) => acc + cur.permission.length, 0)}
                    checked={Object.values(selectedPermissions).flat().length === permissionData.reduce((acc, cur) => acc + cur.permission.length, 0)}
                  />
                }
                label='Select All'
              />
            </th>
          </tr>
          {permissionData.map((item, index) => (
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
);

// Edit Content Component
const EditContent = ({ control, errors, createData, handleSelectAllCheckbox, selectedPermissions, permissionData, togglePermission }) => (
  <DialogContent className="overflow-visible pbs-0 sm:pli-16">
    <Controller
      name="name"
      control={control}
      render={({ field }) => (
        <CustomTextField
          {...field}
          fullWidth
          required
          label="Package Name"
          variant="outlined"
          placeholder="Enter Package Name"
          className="mbe-2"
          error={!!errors.name}
          helperText={errors?.name?.message}
        />
      )}
    />
    <Controller
      name="amount"
      control={control}
      render={({ field }) => (
        <CustomTextField
          {...field}
          fullWidth
          label="Amount"
          required
          variant="outlined"
          placeholder="Enter Amount"
          className="mbe-2"
          error={!!errors.amount}
          helperText={typeof errors?.amount?.message === 'string' ? errors.amount.message : ''}
          value={field.value ?? ''}
          onChange={(e) => field.onChange(Number(e.target.value))}
          type="number"
        />
      )}
    />
    <Controller
      name="description"
      control={control}
      render={({ field }) => (
        <CustomTextField
          {...field}
          fullWidth
          required
          label="Description"
          variant="outlined"
          placeholder="Enter Package Type Description"
          className="mbe-2"
          multiline
          rows={4}
          error={!!errors.description}
          helperText={errors?.description?.message}
        />
      )}
    />

    <Controller name="packagetype" control={control} render={({ field }) => (
      <CustomTextField {...field} required select fullWidth label="Package Type" variant="outlined" placeholder="Select Package Type" className="mbe-2" error={!!errors.packagetype} helperText={errors?.packagetype?.message}>
        {createData.map((data) => (
          <MenuItem key={data._id} value={data._id}>{data.name}</MenuItem>
        ))}
      </CustomTextField>
    )} />

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
    <Typography variant='h5' className='min-is-[225px]'>
      Permissions <span>*</span>
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
                      Object.values(selectedPermissions).flat().length !== permissionData.reduce((acc, cur) => acc + cur.permission.length, 0)}
                    checked={Object.values(selectedPermissions).flat().length === permissionData.reduce((acc, cur) => acc + cur.permission.length, 0)}
                  />
                }
                label='Select All'
              />
            </th>
          </tr>
          {permissionData.map((item, index) => (
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
)

// Main Dialog Component
const PackageDialog = ({ open, setOpen, data, fetchPackage, nameData }) => {

  const handleClose = () => setOpen(false)
  const URL = process.env.NEXT_PUBLIC_API_URL
  const { data: session } = useSession() || {}
  const token = session?.user?.token
  const [createData, setCreateData] = useState();
  const [selectedPermissions, setSelectedPermissions] = useState({})
  const [permissionData, setPermissionData] = useState();
  const [loading, setLoading] = useState(false);

  const {
    handleSubmit,
    control,
    reset,
    setValue,
    setError,
    formState: { errors, isValid, isSubmitting }
  } = useForm({
    mode: 'onChange',
    defaultValues: {
      _id: data?._id || '',
      name: data?.name || '',
      description: data?.description || '',
      packagetype: data?.package_type_id || '',
      amount: data?.amount || 0, // Make sure it's always a string
      status: data?.status ?? false,
      permissions: data?.permissions || {}
    },
    resolver: valibotResolver(schema)
  });

  const handleSelectAllCheckbox = () => {
    if (Object.keys(selectedPermissions).length > 0) {
      setSelectedPermissions({});
      setValue('permissions', []);
    } else if (permissionData) {
      const allPermissions = {};
      let flatPermissions = [];

      permissionData.forEach(module => {
        if (Array.isArray(module.permission)) {
          allPermissions[module._id] = module.permission.map(p => p._id);
          flatPermissions.push(...module.permission.map(p => p._id));
        }
      });

      setSelectedPermissions(allPermissions);
      setValue('permissions', flatPermissions);
    }
  };


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

  useEffect(() => {

    if (open && data) {
      const flatPermissions = Object.values(data.permissions || {}).flat()

      reset({
        _id: data?._id || '',
        name: data?.name || '',
        description: data?.description || '',
        packagetype: data?.package_type_id || '',
        amount: data?.amount || 0,
        status: data?.status ?? false,
        permissions: flatPermissions
      })

      setSelectedPermissions(data.permissions || {})
    }
  }, [open, data, reset])

  const createForm = async () => {
    try {
      const response = await fetch(`${URL}/admin/package/create`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (response.ok) {
        setCreateData(data?.data?.packageType);
        setPermissionData(data?.data?.permission)
      } else {
        console.error("Error:", data);
      }
    } catch (error) {
      console.error("Network error:", error);
    }
  };

  useEffect(() => {
    if (URL && token) {
      createForm();
    }
  }, [URL, token]);

  const submitPackage = async (formData) => {
    setLoading(true);

    try {
      const response = await fetch(
        data ? `${URL}/admin/package/${data?.package_type_id}/${data?._id}` : `${URL}/admin/package`,
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
          toast.success(`Package ${data ? "updated" : "added"} successfully!`, {
            autoClose: 700, // in milliseconds
          });
        }
      } else {
        setLoading(false);
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
      const exist = nameData.some(item => item.name.trim().toLowerCase() === formData.name.trim().toLowerCase());

      if (exist) {
        setError('name', {
          type: 'manual',
          message: 'This name already exists.'
        });

        return;
      }
    } else {
      const exist = nameData.some(item =>
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

    submitPackage({ ...formData, permissions: selectedPermissions })

  }

  return (
    <Dialog
      fullWidth
      maxWidth='md'
      scroll='body'
      open={open}
      onClose={handleClose}
      closeAfterTransition={false}
      sx={{ '& .MuiDialog-paper': { overflow: 'visible' } }}
    >
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <DialogCloseButton onClick={handleClose} disableRipple>
          <i className="tabler-x" />
        </DialogCloseButton>
        <DialogTitle
          variant="h4"
          className="flex flex-col gap-2 text-center sm:pbs-16 sm:pbe-6 sm:pli-16"
        >
          {data ? 'Edit Package' : 'Add New Package'}
          <Typography component="span" className="flex flex-col text-center">
            {data
              ? 'Edit Package as per your requirements.'
              : 'Package you may use and assign to your users.'}
          </Typography>
        </DialogTitle>

        {
          createData ? (
            data ? (
              <EditContent control={control} errors={errors} createData={createData} handleSelectAllCheckbox={handleSelectAllCheckbox} selectedPermissions={selectedPermissions} permissionData={permissionData} togglePermission={togglePermission} />
            ) : (
              <AddContent control={control} errors={errors} createData={createData} handleSelectAllCheckbox={handleSelectAllCheckbox} selectedPermissions={selectedPermissions} permissionData={permissionData} togglePermission={togglePermission} />
            )
          ) : (
            <SkeletonFormComponent />
          )

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
    </Dialog >
  )
}

export default PackageDialog
