'use client'

import { useEffect, useState } from 'react'

import { useParams, useRouter } from 'next/navigation'

import {
  Card,
  CardHeader,
  Button,
  Divider,
  MenuItem,
  Typography,
  CardActions,
  Avatar,
  CardContent,
  CircularProgress
} from '@mui/material'

import Grid from '@mui/material/Grid2'

import { Controller, useForm } from 'react-hook-form'

import {
  object,
  string,
  pipe,
  maxLength,
  minLength,
  regex
} from 'valibot'

import { useDropzone } from 'react-dropzone'

import { valibotResolver } from '@hookform/resolvers/valibot'

import { toast } from 'react-toastify'

import { getLocalizedUrl } from '@/utils/i18n'

import CustomTextField from '@/@core/components/mui/TextField'

import DirectionalIcon from '../DirectionalIcon'

import SkeletonFormComponent from '../skeleton/form/page'

import AppReactDropzone from '@/libs/styles/AppReactDropzone'

const FormComponent = ({
  stage,
  id,
  editData,
  loading,
  createData,
  addURL,
  editURL,
  token,
  backURL,
  backPageName
}) => {

  const schema = object({
    title: pipe(
      string(),
      minLength(1, 'Title is required'),
      maxLength(100, 'Title can be max of 100 length'),
      regex(/^[A-Za-z0-9 \s]+$/, 'Only alphabet and number allowed')
    ),
    description: pipe(
      string(),
      minLength(1, 'Description is required'),
      maxLength(1000, 'Description can be of max 1000 length'),
      regex(/^[A-Za-z0-9 \s]+$/, 'Description can only contain alphabets, numbers, and spaces')
    ),
    live_session_type: (stage == 'Live Session')
      ?
      pipe(
        string(),
        minLength(1, "Live session type is required")
      ) :
      pipe(
      )
  })

  const params = useParams()
  const locale = params.lang

  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [imageError, setImageError] = useState('');

  const router = useRouter()

  const ASSET_URL = process.env.NEXT_PUBLIC_ASSETS_URL

  const { getRootProps, getInputProps } = useDropzone({
    multiple: false,
    maxSize: 2097152, // 2MB
    accept: {
      'image/jpeg': ['.jpeg', '.jpg'],
      'image/png': ['.png'],
      'image/gif': ['.gif'],
      'image/webp': ['.webp'],
      'image/svg+xml': ['.svg'],
      'image/bmp': ['.bmp'],
      'image/tiff': ['.tif', '.tiff'],
      'image/x-icon': ['.ico']
    },
    onDrop: (acceptedFiles) => {
      if (!acceptedFiles.length) return
      const selectedFile = acceptedFiles[0]

      setFile(selectedFile)
      setImageError('') // Clear any previous error
      const reader = new FileReader()

      reader.onload = (e) => {
        setPreview(e.target.result)
      }

      reader.readAsDataURL(selectedFile)
    },
    onDropRejected: (rejectedFiles) => {
      rejectedFiles.forEach(file => {
        file.errors.forEach(error => {
          let msg = ''

          switch (error.code) {
            case 'file-invalid-type':
              msg = `Invalid file type. Allowed types: JPG, PNG, GIF, WebP, SVG, BMP, TIFF, ICO`
              break
            case 'file-too-large':
              msg = `File is too large. Max allowed size is 2MB.`
              break
            case 'too-many-files':
              msg = `Only one image can be uploaded.`
              break
            default:
              msg = `There was an issue with the uploaded file.`

          }

          toast.error(msg, { hideProgressBar: false })
          setImageError(msg)
        })
      })
    }
  })

  const { handleSubmit, control, setValue, formState: { errors } } = useForm({
    resolver: valibotResolver(schema),
    defaultValues: {
      title: '',
      description: '',
      live_session_type: ''
    }
  })

  useEffect(() => {
    if (editData) {
      setValue('title', editData?.title)
      setValue('description', editData?.description)
      setValue('live_session_type', editData?.live_session_id)
    }
  }, [editData])

  const onSubmit = async (value) => {

    if (!file && !editData?.image_url) {
      setImageError('Image is required');

      return;
    } else {
      setImageError(''); // Clear error
    }

    const formData = new FormData()

    if (file) formData.append('image_url', file)

    formData.append('title', value.title)
    formData.append('description', value.description)
    formData.append('live_session_type', value?.live_session_type)

    try {
      const response = await fetch(id ? `${editURL}/${id}` : `${addURL}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: formData
      })

      const result = await response.json()

      if (response.ok) {
        toast.success(`${stage} ${id ? "edit" : "add"} successfully`, { autoClose: 1000 })
        router.push(backURL)
      }
    } catch (error) {
      console.error(error)
      toast.error('Submission failed due to an error')
    }
  }

  if (!loading) {
    return (
      <>
        <SkeletonFormComponent />
      </>
    )
  }

  return (
    <Card>
      <CardHeader
        title={id ? `Edit ${stage}` : `Add ${stage}`}
        action={
          <Button
            variant='outlined'
            startIcon={<DirectionalIcon ltrIconClass='tabler-arrow-left' rtlIconClass='tabler-arrow-right' />}
            onClick={() => router.push(getLocalizedUrl(backURL, locale))}
          >
            Back to {backPageName}
          </Button>
        }
      />
      <Divider />
      <form onSubmit={handleSubmit(onSubmit)} noValidate encType="multipart/form-data">
        <CardContent>
          <Grid container spacing={5}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Controller
                name="title"
                control={control}
                render={({ field }) => (
                  <CustomTextField
                    {...field}
                    fullWidth
                    label="Title*"
                    placeholder="Title"
                    error={!!errors.title}
                    helperText={errors.title?.message}
                  />
                )}
              />
            </Grid>
            {stage === "Live Session" && (
              <Grid item size={{ xs: 12, sm: 6 }}>
                <Controller
                  fullWidth
                  name="live_session_type"
                  control={control}
                  render={({ field }) => (
                    <CustomTextField
                      {...field}
                      select
                      required
                      fullWidth
                      label="Select Live Session Type"
                      error={!!errors.live_session_type}
                      helperText={errors.live_session_type?.message}
                    >
                      <MenuItem disabled>All</MenuItem>
                      {createData?.live_session?.length > 0 &&
                        createData.live_session.map((item, index) => (
                          <MenuItem key={index} value={item._id}>
                            {item.title}
                          </MenuItem>
                        ))}
                    </CustomTextField>
                  )}
                />
              </Grid>
            )}

            <Grid size={{ xs: 12, sm: 6 }}>
              <Controller
                name="description"
                control={control}
                render={({ field }) => (
                  <CustomTextField
                    {...field}
                    fullWidth
                    label="Description*"
                    placeholder="Enter Description"
                    multiline
                    rows={6}
                    error={!!errors.description}
                    helperText={errors.description?.message}
                  />
                )}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <Typography variant="body1" gutterBottom>Image <span>*</span></Typography>
              <AppReactDropzone>
                <div {...getRootProps({ className: 'dropzone' })} style={{ minHeight: '150px' }}>
                  <input {...getInputProps()} />
                  <div className='flex items-center flex-col'>
                    <Avatar variant='rounded' className='bs-12 is-12 mbe-1'>
                      <i className='tabler-upload' />
                    </Avatar>
                    <Typography>
                      Allowed *.jpg, *.jpeg, *.png, *.gif, *.webp, *.svg, *.bmp, *.tif, *.tiff, *.ico (Max 2MB)
                    </Typography>
                  </div>

                  {preview && (
                    <div className='mt-4'>
                      <img
                        src={preview}
                        alt='Preview'
                        style={{
                          inlineSize: '150px',
                          blockSize: '150px',
                          objectFit: 'cover',
                          borderRadius: '10%',
                        }}
                      />
                    </div>
                  )}

                  {editData?.image_url && !preview && (
                    <div className='mt-4'>
                      <img
                        src={`${ASSET_URL}/program_module/${editData.image_url}`}
                        alt='Preview'
                        style={{
                          inlineSize: '150px',
                          blockSize: '150px',
                          objectFit: 'cover',
                          borderRadius: '10%',
                        }}
                      />
                    </div>
                  )}


                </div>
              </AppReactDropzone>
              {imageError && (
                <Typography variant="caption" color="var(--mui-palette-error-main)" sx={{ mt: 1 }}>
                  {imageError}
                </Typography>
              )}
            </Grid>
          </Grid>
        </CardContent>
        <Divider />
        <CardActions>
          <Button
            type='submit'
            variant='contained'
            disabled={!loading}
            sx={{ blockSize: 40, position: 'relative' }}
          >
            {!loading ? (
              <CircularProgress
                size={24}
                sx={{
                  color: 'white',
                  position: 'absolute',
                  insetBlockStart: '50%',
                  insetInlineStart: '50%',
                  marginTop: '-12px',
                  marginLeft: '-12px',
                }}
              />
            ) : (
              'Submit'
            )}
          </Button>
          <Button
            variant='tonal'
            color='error'
            type='button'
            onClick={() => router.push(backURL)}
          >
            Cancel
          </Button>
        </CardActions>
      </form>
    </Card>
  )
}

export default FormComponent
