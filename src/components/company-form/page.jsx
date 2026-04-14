'use client'

// React Imports
import { useState, useEffect } from 'react'

// MUI Imports

import { useRouter, useParams } from 'next/navigation'

import Card from '@mui/material/Card'
import Button from '@mui/material/Button'
import Grid from '@mui/material/Grid2'
import Divider from '@mui/material/Divider'
import { useSession } from 'next-auth/react'
import MenuItem from '@mui/material/MenuItem'
import CardHeader from '@mui/material/CardHeader'
import Typography from '@mui/material/Typography'
import { useForm, Controller } from 'react-hook-form'
import CardContent from '@mui/material/CardContent'
import InputAdornment from '@mui/material/InputAdornment'
import IconButton from '@mui/material/IconButton'

import { valibotResolver } from '@hookform/resolvers/valibot';

// Components Imports

import CardActions from '@mui/material/CardActions'

import { toast } from 'react-toastify'

import {
  object,
  string,
  minLength,
  maxLength,
  pipe,
  boolean,
  check,
  optional,
  email,
  custom
} from 'valibot';

import CustomTextField from '@core/components/mui/TextField'

import SkeletonFormComponent from '../skeleton/form/page'

import PermissionGuard from '@/hocs/PermissionClientGuard';

// Third-party Imports


const UserFormLayout = () => {

  const URL = process.env.NEXT_PUBLIC_API_URL
  const public_url = process.env.NEXT_PUBLIC_ASSETS_URL;
  const { data: session } = useSession() || {}
  const token = session?.user?.token
  const [createData, setCreateData] = useState();
  const [countryId, setCountryId] = useState();
  const [stateData, setStateData] = useState();
  const [stateId, setStateId] = useState();
  const [cityData, setCityData] = useState();
  const [editData, setEditData] = useState();

  const router = useRouter();

  const { lang: locale, id: id } = useParams()

  const schema = object({
    company_name: pipe(
      string(),
      minLength(1, "Company name is required"),
      maxLength(255, "Company name is required")
    ),
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
    password: id
      ? optional(string())
      : pipe(
        string(),
        minLength(6, 'Password min length should be 6'),
        maxLength(255, 'Password can be a maximum of 255 characters')
      ),
    package_id: pipe(
      string(),
      minLength(1, 'Package is required')
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
    pincode: pipe(
      string(),
      minLength(6, 'Pincode should have a minimum length of 6 digits'),
      maxLength(10, 'Pincode can have a maximum length of 10 digits'),
      custom((value) => /^\d+$/.test(value), 'Pincode must contain digits only')
    ),

    phone: pipe(
      string(),
      minLength(7, 'Phone number must be at least 7 digits'),
      maxLength(15, 'Phone number can be a maximum of 15 digits'),
      custom((value) => /^\d+$/.test(value), 'Phone number must contain digits only')
    ),
    gst_no: optional(
      string([
        check(
          (value) =>
            value === '' ||
            (
              value.length === 15 &&
              /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][A-Z1-9]Z[0-9A-Z]$/.test(value)
            ),
          'GST number must be 15 characters and follow the correct format (e.g., 12ABCDE3456F1Z7)'
        ),
      ])
    ),

    pan_no: optional(
      string([
        check(
          (value) =>
            value === '' || /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(value),
          'Invalid PAN number format'
        ),
      ])
    ),

    website: optional(
      string([
        check(
          (value) =>
            value === '' ||
            (
              value.length >= 8 &&
              value.length <= 50 &&
              /^(https?:\/\/)?([\w\-]+\.)+[\w\-]{2,}(\/[\w\-./?%&=]*)?$/.test(value)
            ),
          'Please enter a valid website URL (e.g., https://example.com) between 8 and 50 characters'
        ),
      ])
    ),
    photo: optional(string()), // Optional field or could validate file type
    status: boolean() // or optional(boolean()) if not required
  });

  // States
  const [formData, setFormData] = useState({
    company_name: '',
    first_name: '',
    last_name: '',
    email: '',
    password: '',
    package_id: '',
    country_id: '',
    state_id: '',
    city_id: '',
    address: '',
    pincode: '',
    dob: '',
    phone: '',
    photo: '',
    gst_no: '',
    pan_no: '',
    website: '',
    status: false
  })

  const handleClickShowPassword = () => setFormData(show => ({ ...show, isPasswordShown: !show.isPasswordShown }))

  const handleClickShowConfirmPassword = () =>
    setFormData(show => ({ ...show, isConfirmPasswordShown: !show.isConfirmPasswordShown }))

  // const [formData, setFormData] = useState(initialData)
  const [imgSrc, setImgSrc] = useState('/images/avatars/11.png');

  // Hooks
  const {
    control,
    reset,
    handleSubmit,
    setError,
    setValue,
    formState: { errors }
  } = useForm({
    resolver: valibotResolver(schema),
    defaultValues: {
      company_name: '',
      first_name: '',
      last_name: '',
      email: '',
      password: '',
      package_id: '',
      country_id: '',
      state_id: '',
      city_id: '',
      address: '',
      pincode: '',
      dob: '',
      phone: '',
      photo: '',
      gst_no: '',
      pan_no: '',
      website: '',
      status: false
    }
  });

  const checkEmailCompany = async (email, id) => {
    try {
      const safeId = id || 'null'; // fallback to 'null' when id is undefined

      const response = await fetch(`${URL}/admin/company/email/check/${email}/${safeId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (response.ok) {
        return data.exists;
      } else {
        console.error('Failed to check email:', data);

        return false;
      }
    } catch (error) {
      console.error('Error occurred while checking email:', error);

      return false;
    }
  };

  const editFormData = async () => {
    try {
      const response = await fetch(`${URL}/admin/company/${id}/edit`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      const result = await response.json();

      if (!response.ok) {
        // If server responded with an error status, handle it explicitly
        console.error('Failed to fetch company data:', result.message || result);

        return;
      }

      if (result?.data) {
        setEditData(result.data);
      } else {
        console.warn('No data found in response:', result);
      }

    } catch (error) {
      console.error('Network or parsing error:', error);
    }
  };

  const createFormData = async () => {
    try {

      const response = await fetch(`${URL}/admin/company/create`, {
        method: "GET",
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (response.ok) {
        setCreateData(data?.data)
      }

    } catch (error) {
      console.log("Error", error);

    }

  }

  useEffect(() => {
    if (URL && token) {
      createFormData();

      if (id) {
        editFormData();
      }
    }
  }, [URL, token, id])

  useEffect(() => {
    if (id && editData) {

      reset({
        first_name: editData?.first_name || "",
        last_name: editData?.last_name || "",
        company_name: editData?.company_name || "",
        email: editData?.email || "",
        phone: editData?.phone || "",
        address: editData?.address || "",
        pincode: editData?.pincode || "",
        country_id: editData?.country_id || "",
        state_id: editData?.state_id || "",
        city_id: editData?.city_id || "",
        status: editData?.status || "",
        gst_no: editData?.gst_no || "",
        pan_no: editData?.pan_no || "",
        website: editData?.website || "",
        package_id: editData?.package_id || ""
      });

      if (editData.photo) {
        setImgSrc(`${public_url}/uploads/images/${editData?.photo}`);
      }

      setCountryId(editData?.country_id);
      setStateId(editData?.state_id);

    }
  }, [id, editData])

  useEffect(() => {
    if (countryId && createData) {
      const data = createData && createData['country'].find(item => item.country_id == countryId);
      const states = data['states'];

      setStateData(states);
    }
  }, [countryId, createData])

  const submitFormData = async (values) => {
    try {
      const formData = new FormData();

      // Append file first — must match multer field name
      if (values.photo) {
        formData.append('photo', values.photo);
      }

      // Append all other fields
      Object.entries(values).forEach(([key, value]) => {
        if (key !== 'photo') {
          formData.append(key, value);
        }
      });

      const response = await fetch(id ? `${URL}/admin/company/${id}` : `${URL}/admin/company`, {
        method: id ? "PUT" : "POST",
        headers: {
          Authorization: `Bearer ${token}` // ✅ No content-type here
        },
        body: formData
      });

      const data = await response.json();

      if (response.ok) {
        router.push(`/${locale}/apps/company/list`)
        toast.success(`Company ${id ? "updated" : "added"} successfully!`, {
          autoClose: 700, // in milliseconds
        });
      } else {
        console.error("Error", data);
      }
    } catch (error) {
      console.error("Error occurred", error);
    }
  };

  const onSubmit = async (data) => {

    const newUser = {
      photo: file,
      company_name: data.company_name,
      first_name: data.first_name,
      last_name: data.last_name,
      email: data.email,
      password: data.password,
      phone: data.phone,
      dob: data.dob,
      address: data.address,
      pincode: data.pincode,
      status: data.status,
      package_id: data.package_id,
      country_id: data.country_id,
      state_id: data.state_id,
      city_id: data.city_id,
      gst_no: data.gst_no,
      pan_no: data.pan_no,
      website: data.website
    };

    const exist = await checkEmailCompany(data?.email, id);

    if (exist) {
      setError('email', {
        type: 'manual',
        message: 'This email is already in use.'
      });

      return;
    }


    submitFormData(newUser);
  };

  const [file, setFile] = useState(null);

  const handleFileInputChange = (event) => {
    const selectedFile = event.target.files[0];

    if (!selectedFile) return;

    const validTypes = ['image/jpeg', 'image/gif', 'image/png'];

    if (!validTypes.includes(selectedFile.type)) {
      setError('photo', {
        type: 'manual',
        message: 'Invalid file type. Only JPG, GIF, or PNG are allowed.'
      });

      return;
    }

    if (selectedFile.size > 800 * 1024) {
      setError('photo', {
        type: 'manual',
        message: 'File size exceeds 800KB.'
      });

      return;
    }

    setFile(selectedFile); // Save the actual File object

    const reader = new FileReader();

    reader.onload = () => setImgSrc(reader.result);
    reader.readAsDataURL(selectedFile);
  };

  const handleFileInputReset = () => {
    setFile('')
    setImgSrc('/images/avatars/11.png')
  }

  useEffect(() => {
    if (stateId && stateData) {
      const data = stateData && stateData.find(item => item.state_id == stateId);
      const city = data['cities'];

      setCityData(city);
    }
  }, [stateId, stateData])

  if (!createData) {

    return <SkeletonFormComponent />
  }

  return (
    <PermissionGuard locale={locale} element={'isSuperAdmin'}>

      <Card>
        <CardHeader title='Company Form' />
        <Divider />
        <form onSubmit={handleSubmit(onSubmit)} noValidate encType="multipart/form-data">
          <CardContent>
            <Grid container spacing={6}>
              <Grid size={{ xs: 12 }}>
                <Typography variant='body2' className='font-medium'>
                  1. Account Details
                </Typography>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Controller
                  name="company_name"
                  control={control}
                  render={({ field }) => (
                    <CustomTextField
                      {...field}
                      fullWidth
                      label="Company Name"
                      placeholder="Company Name"
                      error={!!errors.company_name}
                      helperText={errors.company_name?.message}
                      onKeyDown={(e) => {
                        const key = e.key;

                        // Allow: letters, space, backspace, tab, arrows

                        if (
                          !/^[a-zA-Z\s]$/.test(key) &&
                          !['Backspace', 'Tab', 'ArrowLeft', 'ArrowRight', 'Delete'].includes(key)
                        ) {
                          e.preventDefault();
                        }
                      }}
                    />
                  )}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                {/* Email */}
                <Controller
                  name="email"
                  control={control}
                  render={({ field }) => (
                    <CustomTextField
                      {...field}
                      fullWidth
                      required
                      type="email"
                      label="Email"
                      placeholder="Email"
                      error={!!errors.email}
                      helperText={errors.email?.message}
                    />
                  )}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Controller
                  name="first_name"
                  control={control}
                  render={({ field }) => (
                    <CustomTextField
                      {...field}
                      fullWidth
                      required
                      label="First Name"
                      placeholder="First Name"
                      onKeyDown={(e) => {
                        const key = e.key;

                        // Allow: letters, space, backspace, tab, arrows

                        if (
                          !/^[a-zA-Z\s]$/.test(key) &&
                          !['Backspace', 'Tab', 'ArrowLeft', 'ArrowRight', 'Delete'].includes(key)
                        ) {
                          e.preventDefault();
                        }
                      }}
                      error={!!errors.first_name}
                      helperText={errors.first_name?.message}
                    />
                  )}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                {/* Last Name */}
                <Controller
                  name="last_name"
                  control={control}
                  render={({ field }) => (
                    <CustomTextField
                      {...field}
                      fullWidth
                      required
                      type="text"
                      label="Last Name"
                      placeholder="Last Name"
                      onKeyDown={(e) => {
                        const key = e.key;

                        // Allow: letters, space, backspace, tab, arrows

                        if (
                          !/^[a-zA-Z\s]$/.test(key) &&
                          !['Backspace', 'Tab', 'ArrowLeft', 'ArrowRight', 'Delete'].includes(key)
                        ) {
                          e.preventDefault();
                        }
                      }}
                      error={!!errors.last_name}
                      helperText={errors.last_name?.message}
                    />
                  )}
                />
              </Grid>
              {!id && (
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Controller
                    name="password"
                    control={control}
                    render={({ field }) => (
                      <CustomTextField
                        fullWidth
                        required
                        label="Password"
                        placeholder="············"
                        id="form-layout-separator-password"
                        type={formData.isPasswordShown ? 'text' : 'password'}
                        {...field}
                        InputProps={{
                          endAdornment: (
                            <InputAdornment position="end">
                              <IconButton
                                edge="end"
                                onClick={handleClickShowPassword}
                                onMouseDown={(e) => e.preventDefault()}
                                aria-label="toggle password visibility"
                              >
                                <i className={formData.isPasswordShown ? 'tabler-eye-off' : 'tabler-eye'} />
                              </IconButton>
                            </InputAdornment>
                          )
                        }}
                        error={!!errors.password}
                        helperText={errors.password?.message}
                      />
                    )}
                  />
                </Grid>
              )}
              <Grid size={{ xs: 12, sm: 6 }}>
                {/* Phone */}
                <Controller
                  name="phone"
                  control={control}
                  render={({ field }) => (
                    <CustomTextField
                      {...field}
                      fullWidth
                      required
                      type="tel"
                      label="Phone"
                      placeholder="Phone"
                      error={!!errors.phone}
                      helperText={errors.phone?.message}
                      inputProps={{ inputMode: 'numeric' }} // mobile keyboard hint
                      onKeyDown={(e) => {
                        const allowedKeys = ['Backspace', 'Tab', 'ArrowLeft', 'ArrowRight', 'Delete'];

                        if (!/^[0-9]$/.test(e.key) && !allowedKeys.includes(e.key)) {
                          e.preventDefault();
                        }
                      }}
                      onPaste={(e) => {
                        const paste = e.clipboardData.getData('text');

                        if (!/^[0-9]+$/.test(paste)) {
                          e.preventDefault();
                        }
                      }}
                    />
                  )}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                {/* <Card className="p-4"> */}
                <Typography variant="h6" className="mb-4">Profile Photo</Typography>
                <CardContent className="flex flex-col sm:flex-row items-start gap-6 p-0">
                  <img
                    src={imgSrc}
                    alt="Profile"
                    className="rounded-full object-cover border"
                    style={{ inlineSize: 100, blockSize: 100 }}
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
                {/* </Card> */}
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Controller
                  name="package_id"
                  control={control}
                  render={({ field }) => (
                    <CustomTextField
                      {...field}
                      select
                      required
                      fullWidth
                      label="Select Package"
                      error={!!errors.package_id}
                      helperText={errors.package_id?.message}
                    >
                      {createData?.allPackages?.length > 0 &&
                        createData.allPackages.map((item, index) => (
                          <MenuItem key={index} value={item._id}>
                            {item.name}
                          </MenuItem>
                        ))}
                    </CustomTextField>
                  )}
                />
              </Grid>

              <Grid size={{ xs: 12 }}>
                <Divider />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <Typography variant='body2' className='font-medium'>
                  2. Personal Info
                </Typography>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Controller
                  name="pincode"
                  control={control}
                  render={({ field }) => (
                    <CustomTextField
                      {...field}
                      fullWidth
                      type="number"
                      required
                      label="Pincode"
                      placeholder="Pincode"
                      onKeyDown={(e) => {
                        const allowedKeys = ['Backspace', 'Tab', 'ArrowLeft', 'ArrowRight', 'Delete'];

                        if (!/^[0-9]$/.test(e.key) && !allowedKeys.includes(e.key)) {
                          e.preventDefault();
                        }
                      }}
                      onPaste={(e) => {
                        const paste = e.clipboardData.getData('text');

                        if (!/^[0-9]+$/.test(paste)) {
                          e.preventDefault();
                        }
                      }}
                      error={!!errors.pincode}
                      helperText={errors.pincode?.message}
                    />
                  )}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Controller
                  name="address"
                  control={control}
                  render={({ field }) => (
                    <CustomTextField
                      {...field}
                      fullWidth
                      required
                      label="Address"
                      placeholder="Address"
                      multiline
                      rows={4}
                      error={!!errors.address}
                      helperText={errors.address?.message}
                    />
                  )}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Controller
                  name="country_id"
                  control={control}
                  render={({ field }) => (
                    <CustomTextField
                      {...field}
                      select
                      required
                      fullWidth
                      label="Select Country"
                      onChange={(e) => {
                        const selectedCountryId = e.target.value;

                        field.onChange(selectedCountryId); // update form value
                        setCountryId(selectedCountryId);   // update local state or trigger other actions
                      }}
                      error={!!errors.country_id}
                      helperText={errors.country_id?.message}
                    >
                      {createData?.country?.length > 0 &&
                        createData.country.map((item, index) => (
                          <MenuItem key={index} value={`${item.country_id}`}>
                            {item.country_name}
                          </MenuItem>
                        ))}
                    </CustomTextField>
                  )}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                {/* State */}
                <Controller
                  name="state_id"
                  control={control}
                  render={({ field }) => (
                    <CustomTextField
                      {...field}
                      select
                      required
                      fullWidth
                      label="Select State"
                      onChange={(e) => {
                        const selectStateId = e.target.value;

                        field.onChange(selectStateId);

                        setStateId(selectStateId);
                      }}
                      error={!!errors.state_id}
                      helperText={errors.state_id?.message}
                    >
                      <MenuItem disabled value="1">Select state</MenuItem>
                      {stateData && stateData.length > 0 && stateData.map((item, index) => (
                        <MenuItem key={index} value={`${item.state_id}`}>{item.state_name}</MenuItem>
                      ))}
                    </CustomTextField>
                  )}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                {/* City */}
                <Controller
                  name="city_id"
                  control={control}
                  render={({ field }) => (
                    <CustomTextField
                      {...field}
                      select
                      required
                      fullWidth
                      label="Select City"
                      error={!!errors.city_id}
                      helperText={errors.city_id?.message}
                    >
                      <MenuItem disabled value="1">Select city</MenuItem>
                      {cityData && cityData.length > 0 && cityData.map((item, index) => (
                        <MenuItem key={index} value={`${item.city_id}`}>{item.city_name}</MenuItem>
                      ))}
                    </CustomTextField>
                  )}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Controller
                  name="gst_no"
                  control={control}
                  render={({ field }) => (
                    <CustomTextField
                      {...field}
                      fullWidth
                      type="text"
                      label="GST NO"
                      placeholder="GST NO"
                      error={!!errors.gst_no}
                      helperText={errors.gst_no?.message}
                    />
                  )}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Controller
                  name="pan_no"
                  control={control}
                  render={({ field }) => (
                    <CustomTextField
                      {...field}
                      fullWidth
                      type="text"
                      label="PAN NO"
                      placeholder="PAN NO"
                      error={!!errors.pan_no}
                      helperText={errors.pan_no?.message}
                    />
                  )}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Controller
                  name="website"
                  control={control}
                  render={({ field }) => (
                    <CustomTextField
                      {...field}
                      fullWidth
                      type="text"
                      label="Website"
                      placeholder="Website"
                      error={!!errors.website}
                      helperText={errors.website?.message}
                    />
                  )}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>


                {/* Status */}
                <Controller
                  name="status"
                  control={control}
                  render={({ field }) => (
                    <CustomTextField
                      {...field}
                      select
                      required
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
              </Grid>
            </Grid>
          </CardContent>
          <Divider />
          <CardActions>
            <Button variant="contained" type="submit">Submit</Button>
            <Button variant="tonal" color="error" type="reset" onClick={() => router.push(`/${locale}/apps/company/list`)}>
              Cancel
            </Button>
          </CardActions>
        </form>

      </Card>
    </PermissionGuard>
  )
}

export default UserFormLayout
