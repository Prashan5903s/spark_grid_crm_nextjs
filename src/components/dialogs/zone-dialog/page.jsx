'use client'

// React Imports
import { useEffect, useState } from 'react'

// MUI Imports
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  MenuItem,
  Button,
  CircularProgress,
  IconButton
} from '@mui/material'
import Grid from "@mui/material/Grid2";

// Hook Form + Validation
import { useForm, useFieldArray, Controller } from 'react-hook-form'
import { valibotResolver } from '@hookform/resolvers/valibot'
import {
  object,
  string,
  array,
  pipe,
  minLength,
  maxLength
} from 'valibot'

// Components
import { useSession } from 'next-auth/react'

import { toast } from 'react-toastify'

import CustomTextField from '@core/components/mui/TextField'

import DialogCloseButton from '../DialogCloseButton'

// SIZE={{ XS: 12, }} Schema
const zoneSchema = object({
  name: pipe(string(), minLength(1, 'Zone name is required'), maxLength(50)),
  country_id: pipe(string(), minLength(1, 'Country is required'))
})

const schema = object({
  zones: pipe(array(zoneSchema), minLength(1, 'At least one zone required'))
})

const ZoneDialog = ({
  open,
  setOpen,
  fetchZoneData,
  selectedZone,
  tableData
}) => {

  const { data: session } = useSession()
  const token = session?.user?.token
  const API_URL = process.env.NEXT_PUBLIC_API_URL

  const [createData, setCreateData] = useState()
  const [loading, setLoading] = useState(false)

  const {
    control,
    handleSubmit,
    reset,
    setError,
    formState: { errors }
  } = useForm({
    resolver: valibotResolver(selectedZone ? zoneSchema : schema),
    defaultValues: {
      zones: selectedZone ? { name: '', country_id: '' } : [{ name: '', country_id: '' }]
    }
  })

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'zones'
  })

  // SIZE={{ XS: 12, }} Fetch dropdown data
  const fetchCreateData = async () => {
    try {
      const response = await fetch(`${API_URL}/company/zone/create/data`, {
        headers: { Authorization: `Bearer ${token}` }
      })

      const result = await response.json()
      
      if (response.ok) setCreateData(result?.data)
    } catch (err) {
      console.error(err)
    }
  }

  useEffect(() => {
    if (API_URL && token && open) fetchCreateData()
  }, [API_URL, token, open])

  // SIZE={{ XS: 12, }} Edit mode reset
  useEffect(() => {
    if (open && selectedZone) {
      reset({
        name: selectedZone.name,
        country_id: selectedZone.country_id
      })
    }
  }, [open, selectedZone])

  const handleClose = () => {
    reset()
    setOpen(false)
  }

  // SIZE={{ XS: 12, }} Submit
  const submitData = async (formData) => {

    // SIZE={{ XS: 12, }} Duplicate validation
    if (tableData?.length) {
      let hasError = false;

      if (selectedZone) {
        const exist = tableData.find(item =>
          item.name.toLowerCase() === formData.name.toLowerCase() &&
          item._id !== selectedZone._id &&
          item?.country_id == selectedZone?.country_id
        )

        if (exist) {
          setError('name', { message: 'Zone already exists' })
          
          return
        }
      } else {
        formData.zones.forEach((zone, index) => {
          const name = zone.name?.trim().toLowerCase()
          const countryId = zone?.country_id.trim();

          const exists = tableData.some(
            z => z.name.toLowerCase() === name && z.country_id === countryId
          )

          const duplicate = formData.zones.filter(
            z => z.name?.toLowerCase() === name && z.country_id === countryId
          )

          if (exists || duplicate.length > 1) {
            setError(`zones.${index}.name`, {
              message: 'Zone must be unique'
            })
            hasError = true
          }
        })

        if (hasError) return
      }
    }

    setLoading(true)

    try {
      const url = selectedZone
        ? `${API_URL}/company/zone/${selectedZone._id}`
        : `${API_URL}/company/zone`

      const method = selectedZone ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        toast.success(`Zone ${selectedZone ? 'updated' : 'created'} successfully`)
        fetchZoneData?.()
        handleClose()
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (

    <Dialog
      fullWidth
      maxWidth="md"
      open={open}
      scroll="body"
      sx={{ '& .MuiDialog-paper': { overflow: 'visible' } }}
    >
      <DialogCloseButton onClick={handleClose}>
        <i className="tabler-x" />
      </DialogCloseButton>

      <DialogTitle align="center">
        {selectedZone ? 'Edit Zone' : 'Add Zone'}
      </DialogTitle>

      <form onSubmit={handleSubmit(submitData)}>
        <DialogContent>

          {/*  EDIT MODE */}
          {selectedZone ? (
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, }}>
                <Controller
                  name="name"
                  control={control}
                  render={({ field }) => (
                    <CustomTextField
                      {...field}
                      label="Zone Name"
                      fullWidth
                      error={!!errors.name}
                      helperText={errors.name?.message}
                    />
                  )}
                />
              </Grid>

              <Grid size={{ xs: 12, }}>
                <Controller
                  name="country_id"
                  control={control}
                  render={({ field }) => (
                    <CustomTextField
                      {...field}
                      select
                      label="Country"
                      value={field.value || ''}   //  prevents undefined
                      fullWidth
                      error={!!errors.country_id}
                      helperText={errors.country_id?.message}
                    >
                      {createData?.country?.length > 0 ? (
                        createData.country.map(c => (
                          <MenuItem key={c.country_id} value={String(c.country_id)}>
                            {c.country_name}
                          </MenuItem>
                        ))
                      ) : (
                        <MenuItem disabled value="">
                          No countries available
                        </MenuItem>
                      )}
                    </CustomTextField>
                  )}
                />
              </Grid>
            </Grid>
          ) : (
            <>
              {/* SIZE={{ XS: 12, }} CREATE MODE */}
              {fields.map((item, index) => (
                <Grid container spacing={2} key={item.id}>

                  <Grid size={{ xs: 12, md: 6 }}>
                    <Controller
                      name={`zones.${index}.name`}
                      control={control}
                      render={({ field }) => (
                        <CustomTextField
                          {...field}
                          label="Zone Name"
                          fullWidth
                          error={!!errors.zones?.[index]?.name}
                          helperText={errors.zones?.[index]?.name?.message}
                        />
                      )}
                    />
                  </Grid>

                  <Grid size={{ xs: 12, md: 6 }}>
                    <Controller
                      name={`zones.${index}.country_id`}
                      control={control}
                      render={({ field }) => (
                        <CustomTextField
                          {...field}
                          select
                          label="Country"
                          fullWidth
                          value={field.value || ''}   //  prevents undefined
                          error={!!errors.zones?.[index]?.country_id}
                          helperText={errors.zones?.[index]?.country_id?.message}
                        >
                          {!createData ? (
                            <MenuItem disabled>Loading...</MenuItem>
                          ) : createData.country?.length > 0 ? (
                            createData.country.map(c => (
                              <MenuItem key={c.country_id} value={String(c.country_id)}>
                                {c.country_name}
                              </MenuItem>
                            ))
                          ) : (
                            <MenuItem disabled>No countries found</MenuItem>
                          )}
                        </CustomTextField>
                      )}
                    />
                  </Grid>

                  <Grid size={{ xs: 12, }}>
                    {fields.length > 1 && (
                      <IconButton onClick={() => remove(index)}>
                        ✕
                      </IconButton>
                    )}
                  </Grid>
                </Grid>
              ))}

              <Button
                variant='outlined'
                onClick={() => append({ name: '', country_id: '' })}
              >
                Add More
              </Button>
            </>
          )}
        </DialogContent>

        <DialogActions sx={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
          <Button variant='contained' type="submit" disabled={loading}>
            {loading ? <CircularProgress size={20} /> : 'Submit'}
          </Button>
          <Button variant='outlined' onClick={handleClose}>Cancel</Button>
        </DialogActions>
      </form>
    </Dialog>
  )
}

export default ZoneDialog
