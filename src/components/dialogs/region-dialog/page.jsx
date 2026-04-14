'use client'

import { useEffect, useState } from 'react'

import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, MenuItem, CircularProgress, IconButton
} from '@mui/material'

import Grid from "@mui/material/Grid2";

import { useForm, useFieldArray, Controller } from 'react-hook-form'

import { valibotResolver } from '@hookform/resolvers/valibot'

import { object, string, array, pipe, minLength, maxLength, regex } from 'valibot'

import { useSession } from 'next-auth/react'

import { toast } from 'react-toastify'

import CustomTextField from '@core/components/mui/TextField'
import DialogCloseButton from '../DialogCloseButton'

const regionSchema = object({
  name: pipe(
    string(),
    minLength(1, 'Region name is required'),
    maxLength(50, 'Region name can be a maximum of 50 characters'),
    regex(/^[A-Za-z\s]+$/, 'Only alphabets and spaces are allowed')
  ),
  zoneId: pipe(
    string(),
    minLength(1, 'Zone ID is required')
  )
})

const multiRegionSchema = object({
  zone_id: pipe(string(), minLength(1, 'Zone ID is required')),
  region: pipe(array(regionSchema), minLength(1, 'At least one region must be added'), maxLength(50, 'Region name can be a maximum of 50 characters'))
})

const RegionDialog = ({
  open, setOpen, title = '', fetchRegionData,
  selectedRegion, typeForm, selectedRegionData,
  tableData
}) => {
  const { data: session } = useSession()
  const token = session?.user?.token
  const API_URL = process.env.NEXT_PUBLIC_API_URL

  const isEdit = Boolean(selectedRegion || selectedRegionData)

  const {
    control,
    handleSubmit,
    reset,
    setError,
    clearErrors,
    formState: { errors }
  } = useForm({
    resolver: valibotResolver(selectedRegion ? multiRegionSchema : regionSchema),
    defaultValues: {
      region: [{ name: '' }],
      zone_id: '',
      name: '',
      zoneId: ''
    }
  })

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'region'
  })

  const [loading, setLoading] = useState(false)
  const [zoneOptions, setZoneOptions] = useState([])

  const handleClose = () => {
    reset()
    setOpen(false)
  }

  const loadZoneData = async () => {
    try {
      const response = await fetch(`${API_URL}/company/region/create`, {
        method: "GET",
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      })

      const data = await response.json()

      if (response.ok) {
        setZoneOptions(data?.data || [])
      }
    } catch (error) {
      console.error("Error loading zones:", error)
    }
  }

  useEffect(() => {
    if (API_URL && token && !selectedRegion) {
      loadZoneData()
    }
  }, [API_URL, token])

  useEffect(() => {

    if (typeForm && selectedRegion) {
      reset({
        zone_id: selectedRegion._id || '',
        region: selectedRegion.region?.map(r => ({ name: r.name, zoneId: selectedRegion._id })) || [{ name: '', zoneId: selectedRegion._id }]
      })
    } else if (typeForm && selectedRegionData) {
      reset({
        name: selectedRegionData.data.name || '',
        zoneId: selectedRegionData.zoneId || ''
      })
    }
  }, [typeForm, selectedRegion, selectedRegionData])

  const submitData = async (formData) => {
    setLoading(true)

    const isEdit = Boolean((selectedRegion || selectedRegionData))

    if (selectedRegion) {
      const regions = formData['region'];

      const nameIndexMap = {};
      const duplicateIndexes = [];

      regions.forEach((region, index) => {
        const name = region.name;

        if (nameIndexMap[name]) {
          if (nameIndexMap[name].length === 1) {
            duplicateIndexes.push(nameIndexMap[name][0]);
          }

          duplicateIndexes.push(index);
          nameIndexMap[name].push(index);
        } else {
          nameIndexMap[name] = [index];
        }
      });

      // Clear previous errors before setting new ones
      clearErrors("region");

      if (duplicateIndexes.length > 0) {

        duplicateIndexes.forEach((idx) => {
          setError(`region.${idx}.name`, {
            type: "manual",
            message: "Duplicate region name not allowed",
          });
        });


        setLoading(false);

        return;

      }
    }

    if (tableData) {
      if (selectedRegionData) {
        const region_id = selectedRegionData.data._id;
        const filteredData = tableData.filter(item => item.data._id !== region_id);
        const region_name = formData.name;
        const isDuplicate = filteredData.some(item => item.data.name.trim().toLowerCase() === region_name.trim().toLowerCase());

        if (isDuplicate) {
          setError("name", {
            type: "manual",
            message: "Region name already exists",
          });
          setLoading(false);

          return; // stop submission
        }
      } else {
        const region_name = formData.name;
        const isDuplicate = tableData.some(item => item.data.name.trim().toLowerCase() === region_name.trim().toLowerCase());

        if (isDuplicate) {
          setError("name", {
            type: "manual",
            message: "Region name already exists",
          });
          setLoading(false);

          return; // stop submission
        }

      }
    }

    const url = selectedRegion ? `${API_URL}/company/region` : (
      selectedRegionData ?
        `${API_URL}/company/data/region/${selectedRegionData.data._id}`
        :
        `${API_URL}/company/data/region`
    );

    const method = selectedRegionData ? 'PUT' : 'POST'

    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      })

      const data = await response.json()

      if (response.ok) {
        toast.success(`Region ${isEdit ? 'updated' : 'added'} successfully!`, {
          autoClose: 1000
        });
        window.location.reload();
      } else {
        toast.error(data?.message || 'Server error')
      }
    } catch (err) {
      toast.error('Network or server error')
      console.log("Error", err);

      console.error('Submit error:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog fullWidth maxWidth="md" open={open} scroll="body"
      sx={{ '& .MuiDialog-paper': { overflow: 'visible' } }}
    >
      <DialogCloseButton onClick={handleClose}>
        <i className="tabler-x" />
      </DialogCloseButton>

      <DialogTitle variant="h4" className="text-center sm:pbs-16 sm:pbe-6 sm:pli-16">
        {isEdit ? 'Edit Region' : 'Add Region'}
      </DialogTitle>

      <form onSubmit={handleSubmit(submitData)} noValidate>
        {selectedRegion ? (
          <DialogContent className="overflow-visible flex flex-col gap-6 sm:pli-16">
            {
              fields.map((field, index) => (
                <Grid container spacing={2} key={field.id} alignItems="center">
                  <Grid item size={{ xs: 12, }}>
                    <Controller
                      name={`region.${index}.name`}
                      control={control}
                      rules={{
                        required: 'Region name is required',
                        validate: (value) => {
                          const values = getValues("region");
                          const duplicates = values.filter((v, i) => v.name === value && i !== index);

                          return duplicates.length === 0 || "Duplicate region name not allowed";
                        },
                      }}
                      render={({ field }) => (
                        <CustomTextField
                          {...field}
                          required
                          label="Region Name"
                          placeholder="Enter region name"
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
                          error={!!errors.region?.[index]?.name}
                          helperText={errors.region?.[index]?.name?.message}
                        />
                      )}
                    />

                  </Grid>
                  <Grid item size={{ xs: 12, }} className="flex justify-end">
                    {fields.length > 1 && (
                      <IconButton
                        color="error"
                        onClick={() => remove(index)}
                        sx={{ mt: 1 }}
                        aria-label="Remove region"
                      >
                        <i className="tabler-x" />
                      </IconButton>
                    )}
                  </Grid>
                </Grid>
              ))}

            <Button
              size="small"
              variant="contained"
              onClick={() => append({ name: '', zoneId: selectedRegion._id })}
              startIcon={<i className="tabler-plus" />}
              sx={{ mt: 2, alignSelf: 'flex-start' }}
            >
              Add more
            </Button>
          </DialogContent>
        ) : (
          <div className="ml-9 mr-9">
            <Grid container spacing={2} direction={"column"}>
              <Grid item size={{ xs: 12, }}>
                <Controller
                  name="name"
                  control={control}
                  render={({ field }) => (
                    <CustomTextField
                      {...field}
                      required
                      label="Region Name"
                      placeholder="Enter region name"
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
              </Grid>

              <Grid item size={{ xs: 12, }}>
                <Controller
                  name="zoneId"
                  control={control}
                  render={({ field }) => (
                    <CustomTextField
                      {...field}
                      required
                      select
                      fullWidth
                      label="Zone"
                      value={field.value ?? ''}
                      onChange={field.onChange}
                      error={!!errors.zoneId}
                      helperText={errors.zoneId?.message}
                    >
                      {zoneOptions.length > 0 ? (
                        zoneOptions.map((item) => (
                          <MenuItem key={item._id} value={item._id}>
                            {item.name}
                          </MenuItem>
                        ))
                      ) : (
                        <MenuItem disabled>No data</MenuItem>
                      )}
                    </CustomTextField>
                  )}
                />
              </Grid>
            </Grid>
          </div>
        )}

        <DialogActions className="justify-center sm:pbe-16 sm:pli-16">
          <Button variant="contained" type="submit" disabled={loading}>
            {loading ? (
              <CircularProgress size={24} sx={{
                color: 'white', position: 'absolute',
                top: '50%', left: '50%', mt: '-12px', ml: '-12px'
              }} />
            ) : isEdit ? 'Update' : 'Submit'}
          </Button>
          <Button variant="tonal" color="secondary" onClick={handleClose}>
            Cancel
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  )
}

export default RegionDialog
