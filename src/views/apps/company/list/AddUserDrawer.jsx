// React Imports
import { useState } from 'react'

// MUI Imports
import Button from '@mui/material/Button'
import Drawer from '@mui/material/Drawer'
import IconButton from '@mui/material/IconButton'
import MenuItem from '@mui/material/MenuItem'
import Card from '@mui/material/Card'
import Typography from '@mui/material/Typography'
import Divider from '@mui/material/Divider'

// Third-party Imports
import { useForm, Controller } from 'react-hook-form'

// Component Imports

import { valibotResolver } from '@hookform/resolvers/valibot';

import { CardContent } from '@mui/material'

// Vars
const initialData = {
  company: '',
  country: '',
  contact: ''
}

import {
  object,
  string,
  minLength,
  maxLength,
  pipe,
  boolean,
  array,
  date,
  optional,
  email
} from 'valibot';

import CustomTextField from '@core/components/mui/TextField'

const schema = object({
  first_name: pipe(
    string(),
    minLength(1, 'First Name is required'),
    maxLength(255, 'First Name can be a maximum of 255 characters')
  ),
  last_name: pipe(
    string(),
    minLength(1, 'Last Name is required'),
    maxLength(255, 'Last Name can be a maximum of 255 characters')
  ),
  email: pipe(
    string(),
    minLength(1, 'Email is required'),
    email('Please enter a valid email address'),
    maxLength(255, 'Email can be a maximum of 255 characters')
  ),
  password: pipe(
    string(),
    minLength(6, 'Password must be at least 6 characters'),
    maxLength(255, 'Password can be a maximum of 255 characters')
  ),
  country_id: pipe(
    string(),
    minLength(1, 'Country is required')
  ),
  state_id: pipe(
    string(),
    minLength(1, 'State is required')
  ),
  city_id: pipe(
    string(),
    minLength(1, 'City is required')
  ),
  address: pipe(
    string(),
    minLength(1, 'Address is required'),
    maxLength(1000, 'Address can be a maximum of 1000 characters')
  ),
  dob: pipe(
    string(),
    minLength(1, 'Date of Birth is required')
  ),
  phone: pipe(
    string(),
    minLength(7, 'Phone number must be valid'),
    maxLength(15, 'Phone number can be a maximum of 15 digits')
  ),
  photo: optional(string()), // Optional field or could validate file type
  status: boolean() // or optional(boolean()) if not required
});

const AddUserDrawer = props => {
  // Props
  const { open, handleClose, userData, setData } = props

  // States
  const [formData, setFormData] = useState(initialData)
  const [imgSrc, setImgSrc] = useState('/images/avatars/11.png');
  const [fileInput, setFileInput] = useState('')

  // Hooks
  const {
    control,
    reset: resetForm,
    handleSubmit,
    setError,
    formState: { errors }
  } = useForm({
    resolver: valibotResolver(schema),
    defaultValues: {
      first_name: '',
      last_name: '',
      email: '',
      password: '',
      country_id: '',
      state_id: '',
      city_id: '',
      address: '',
      dob: '',
      phone: '',
      photo: '',
      status: false
    }
  });

  const onSubmit = (data) => {
    const newUser = {
      photo: imgSrc,
      first_name: data.first_name,
      last_name: data.last_name,
      email: data.email,
      password: data.password,
      phone: data.phone,
      dob: data.dob,
      address: data.address,
      status: data.status,
      country_id: data.country_id,
      state_id: data.state_id,
      city_id: data.city_id
    };

    setData([...(userData ?? []), newUser]);
    handleClose();
    setFormData(initialData);

    // Reset form fields based on actual form keys
    resetForm({
      first_name: '',
      last_name: '',
      email: '',
      password: '',
      phone: '',
      status: false,
      country_id: '',
      state_id: '',
      city_id: '',
      address: '',
      dob: '',
      photo: ''
    });
  };

  const handleReset = () => {
    handleClose()
    setFormData(initialData)
  }

  const handleFileInputChange = file => {
    const reader = new FileReader()
    const { files } = file.target

    if (files && files.length !== 0) {
      const file = files[0];

      // Validate file type (JPG, GIF, PNG)
      const validTypes = ['image/jpeg', 'image/gif', 'image/png'];
      
      if (!validTypes.includes(file.type)) {
        setError('photo', {
          type: 'manual',
          message: 'Invalid file type. Only JPG, GIF, or PNG are allowed.'
        });
        
        return;
      }

      // Validate file size (max 800KB)
      if (file.size > 800 * 1024) { // 800KB in bytes
        setError('photo', {
          type: 'manual',
          message: 'File size exceeds 800KB.'
        });
        
        return;
      }

      setError('photo', {
        type: 'manual',
        message: ''
      });

      reader.onload = () => setImgSrc(reader.result)
      reader.readAsDataURL(files[0])

      if (reader.result !== null) {
        setFileInput(reader.result)
      }
    }
  }

  const handleFileInputReset = () => {
    setFileInput('')
    setImgSrc('/images/avatars/11.png')
  }

  return (
    <Drawer
      open={open}
      anchor='right'
      variant='temporary'
      onClose={handleReset}
      ModalProps={{ keepMounted: true }}
      sx={{ '& .MuiDrawer-paper': { width: { xs: 300, sm: 400 } } }}
    >
      <div className='flex items-center justify-between plb-5 pli-6'>
        <Typography variant='h5'>Add New User</Typography>
        <IconButton size='small' onClick={handleReset}>
          <i className='tabler-x text-2xl text-textPrimary' />
        </IconButton>
      </div>
      <Divider />
      <div>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6 p-6" noValidate>
          {/* Profile Photo Card */}
          <Card className="p-4">
            <Typography variant="h6" className="mb-4">Profile Photo</Typography>
            <CardContent className="flex flex-col sm:flex-row items-start gap-6 p-0">
              <img
                src={imgSrc}
                alt="Profile"
                className="rounded-full object-cover border"
                style={{ width: 100, height: 100 }}
              />
              <div className="flex flex-col gap-2">
                <div className="flex flex-col gap-2 w-48">
                  <Button component="label" variant="contained" fullWidth htmlFor="upload-image">
                    Upload New Photo
                    <input
                      hidden
                      type="file"
                      accept="image/png, image/jpeg"
                      id="upload-image"
                      onChange={handleFileInputChange}
                    />
                  </Button>
                  <Button variant="outlined" color="secondary" fullWidth onClick={handleFileInputReset}>
                    Reset
                  </Button>
                </div>
                {errors?.photo && (
                  <Typography
                    variant="body2"
                    color="error"
                    className="mt-2"
                    style={{ color: 'var(--mui-palette-error-main)' }}
                  >
                    {errors.photo.message}
                  </Typography>
                )}
              </div>
            </CardContent>
          </Card>
          {/* First Name */}
          <Controller
            name="first_name"
            control={control}
            render={({ field }) => (
              <CustomTextField
                {...field}
                fullWidth
                label="First Name"
                placeholder="First Name"
                error={!!errors.first_name}
                helperText={errors.first_name?.message}
              />
            )}
          />

          {/* Last Name */}
          <Controller
            name="last_name"
            control={control}
            render={({ field }) => (
              <CustomTextField
                {...field}
                fullWidth
                label="Last Name"
                placeholder="Last Name"
                error={!!errors.last_name}
                helperText={errors.last_name?.message}
              />
            )}
          />

          {/* Email */}
          <Controller
            name="email"
            control={control}
            render={({ field }) => (
              <CustomTextField
                {...field}
                fullWidth
                type="email"
                label="Email"
                placeholder="Email"
                error={!!errors.email}
                helperText={errors.email?.message}
              />
            )}
          />

          {/* Password */}
          <Controller
            name="password"
            control={control}
            render={({ field }) => (
              <CustomTextField
                {...field}
                fullWidth
                type="password"
                label="Password"
                placeholder="Password"
                error={!!errors.password}
                helperText={errors.password?.message}
              />
            )}
          />

          {/* Phone */}
          <Controller
            name="phone"
            control={control}
            render={({ field }) => (
              <CustomTextField
                {...field}
                fullWidth
                type="tel"
                label="Phone"
                placeholder="Phone"
                error={!!errors.phone}
                helperText={errors.phone?.message}
              />
            )}
          />

          {/* Date of Birth */}
          <Controller
            name="dob"
            control={control}
            render={({ field }) => (
              <CustomTextField
                {...field}
                fullWidth
                type="date"
                label="Date of Birth"
                error={!!errors.dob}
                helperText={errors.dob?.message}
              />
            )}
          />

          {/* Address */}
          <Controller
            name="address"
            control={control}
            render={({ field }) => (
              <CustomTextField
                {...field}
                fullWidth
                label="Address"
                placeholder="Address"
                multiline
                rows={4}
                error={!!errors.address}
                helperText={errors.address?.message}
              />
            )}
          />

          {/* Country */}
          <Controller
            name="country_id"
            control={control}
            render={({ field }) => (
              <CustomTextField
                {...field}
                select
                fullWidth
                label="Select Country"
                error={!!errors.country_id}
                helperText={errors.country_id?.message}
              >
                <MenuItem value="1">India</MenuItem>
                <MenuItem value="2">USA</MenuItem>
                <MenuItem value="3">Canada</MenuItem>
              </CustomTextField>
            )}
          />

          {/* State */}
          <Controller
            name="state_id"
            control={control}
            render={({ field }) => (
              <CustomTextField
                {...field}
                select
                fullWidth
                label="Select State"
                error={!!errors.state_id}
                helperText={errors.state_id?.message}
              >
                <MenuItem value="1">Gujarat</MenuItem>
                <MenuItem value="2">California</MenuItem>
                <MenuItem value="3">Ontario</MenuItem>
              </CustomTextField>
            )}
          />

          {/* City */}
          <Controller
            name="city_id"
            control={control}
            render={({ field }) => (
              <CustomTextField
                {...field}
                select
                fullWidth
                label="Select City"
                error={!!errors.city_id}
                helperText={errors.city_id?.message}
              >
                <MenuItem value="1">Ahmedabad</MenuItem>
                <MenuItem value="2">Los Angeles</MenuItem>
                <MenuItem value="3">Toronto</MenuItem>
              </CustomTextField>
            )}
          />

          {/* Status */}
          <Controller
            name="status"
            control={control}
            render={({ field }) => (
              <CustomTextField
                {...field}
                select
                fullWidth
                label="Select Status"
                error={!!errors.status}
                helperText={errors.status?.message}
              >
                <MenuItem value={true}>Active</MenuItem>
                <MenuItem value={false}>Inactive</MenuItem>
              </CustomTextField>
            )}
          />

          {/* Buttons */}
          <div className="flex items-center gap-4">
            <Button variant="contained" type="submit">Submit</Button>
            <Button variant="tonal" color="error" type="reset" onClick={router}>
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </Drawer>

  )
}

export default AddUserDrawer
