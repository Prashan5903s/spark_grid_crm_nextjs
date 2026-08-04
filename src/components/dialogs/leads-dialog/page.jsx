'use client'

import { useEffect, useState } from 'react'

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  MenuItem,
  Button,
  CircularProgress,
  FormControlLabel,
  Switch
} from '@mui/material'

import { useForm, Controller } from 'react-hook-form'
import { valibotResolver } from '@hookform/resolvers/valibot'

import {
  object,
  string,
  pipe,
  optional,
  minLength,
  maxLength,
  regex,
  boolean,
  check
} from 'valibot'

import { useSession } from 'next-auth/react'
import { toast } from 'react-toastify'

import DialogCloseButton from '../DialogCloseButton'
import CustomTextField from '@core/components/mui/TextField'

const LeadsDialog = ({
  open,
  isTable = true,
  setOpen,
  selectLeadStatusId,
  selectedLead,
  fetchLeadsData
}) => {

  const { data: session } = useSession()
  const token = session?.user?.token

  const API_URL = process.env.NEXT_PUBLIC_API_URL

  const [createData, setCreateData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [selectedStateId, setSelectedStateId] = useState('')
  const [selectedCity, setSelectedCity] = useState([])
  const [isEnabled, setIsEnabled] = useState(false)

  useEffect(() => {
    if (selectedLead) {
      setIsEnabled(false)
    }
  }, [selectedLead])

  const schema = pipe(
    object({
      company_name: string(),
      name: pipe(string(), minLength(1, 'Name is required')),
      email: pipe(
        string(),
        minLength(1, 'Email is required'),
        regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Invalid email format')
      ),
      phone: pipe(
        string(),
        minLength(10, 'Phone is required'),
        maxLength(15, 'Invalid phone number'),
        regex(/^[0-9]+$/, 'Only numbers allowed')
      ),
      state_id: optional(string()),
      city_id: optional(string()),
      average_monthly_consumption: string(),
      sanctioned_load: string(),
      lead_status_id: optional(string()),
      source_id: string(),
      solution_id: string(),
      branch_id: pipe(string(), minLength(1, 'Branch is required')),
      address: string(),
      pincode: optional(
        pipe(
          string(),
          regex(/^[0-9]*$/, 'Only numbers allowed'),
          maxLength(6, 'Maximum 6 digits allowed')
        )
      ),
      allow_followup: boolean(),
      follow_up_date: isEnabled ? pipe(
        string(),
        minLength(1, 'Follow-up date is required')
      ) : optional(string()),
      follow_up_type: isEnabled ? pipe(
        string(),
        minLength(1, 'Follow-up type is required')
      ) : optional(string()),
      status: isEnabled ? pipe(
        string(),
        minLength(1, 'Status is required')
      ) : optional(string()),
      priority: isEnabled ? pipe(
        string(),
        minLength(1, 'Priority is required')
      ) : optional(string()),
      reminder_before: optional(string()),
      next_follow_up_date: isEnabled ? pipe(
        string(),
        minLength(1, 'Next follow-up date is required')
      ) : optional(string()),
      notes: optional(string())
    }),
    check(
      values =>
        !values.allow_followup ||
        (
          values.follow_up_date &&
          values.follow_up_type &&
          values.status &&
          values.priority &&
          values.next_follow_up_date
        ),
      'Please fill all required follow-up fields'
    )
  )

  const defaultValues = {
    company_name: '',
    name: '',
    email: '',
    phone: '',
    solution_id: '',
    state_id: '',
    city_id: '',
    branch_id: '',
    average_monthly_consumption: '',
    sanctioned_load: '',
    lead_status_id: '',
    source_id: '',
    address: '',
    pincode: '',
    allow_followup: false,
    follow_up_date: '',
    follow_up_type: '',
    status: '',
    priority: '',
    reminder_before: '',
    next_follow_up_date: '',
    notes: ''
  }

  const {
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors }
  } = useForm({
    resolver: valibotResolver(schema),
    defaultValues
  })

  const allowFollowup = watch('allow_followup')
  const followUpDate = watch('follow_up_date')
  const nextFollowUpDate = watch('next_follow_up_date')

  const isCreateMode = !selectedLead

  const today = new Date().toISOString().split('T')[0]

  useEffect(() => {
    if (!selectedStateId || !createData?.states) {
      
      setSelectedCity([])

      return
    }

    const state = createData.states.find(
      item => String(item.state_id) === String(selectedStateId)
    )

    setSelectedCity(state?.cities || [])

  }, [selectedStateId, createData])

  const fetchCreateData = async () => {
    if (!API_URL || !token) return

    try {
      const response = await fetch(
        `${API_URL}/user/leads/create/data`,
        {
          method: 'GET',
          headers: {
            Accept: 'application/json',
            Authorization: `Bearer ${token}`
          }
        }
      )

      const value = await response.json()

      if (!response.ok) {
        console.error('Create Data Error:', value)

        toast.error(value?.message || 'Unable to load lead data')

        return
      }

      setCreateData(value?.data || null)
    } catch (error) {
      console.error('Create Data Error:', error)
      toast.error('Unable to load lead data')
    }
  }

  useEffect(() => {
    if (API_URL && token) {
      fetchCreateData()
    }
  }, [API_URL, token])

  useEffect(() => {
    if (!open) return


    if (selectedLead) {
      const stateId = selectedLead?.state_id
        ? String(selectedLead.state_id)
        : ''

      reset({
        company_name: selectedLead?.company_name || '',
        name: selectedLead?.name || '',
        email: selectedLead?.email || '',
        phone: selectedLead?.phone || '',
        solution_id: selectedLead?.solution_id
          ? String(selectedLead.solution_id)
          : '',
        average_monthly_consumption:
          selectedLead?.average_monthly_consumption !== null &&
            selectedLead?.average_monthly_consumption !== undefined
            ? String(selectedLead.average_monthly_consumption)
            : '',
        sanctioned_load:
          selectedLead?.sanctioned_load !== null &&
            selectedLead?.sanctioned_load !== undefined
            ? String(selectedLead.sanctioned_load)
            : '',
        lead_status_id: selectedLead?.lead_status_id
          ? String(selectedLead.lead_status_id)
          : '',
        state_id: stateId,
        city_id: selectedLead?.city_id
          ? String(selectedLead.city_id)
          : '',
        branch_id: selectedLead?.branch_id
          ? String(selectedLead.branch_id)
          : '',
        source_id: selectedLead?.source_id
          ? String(selectedLead.source_id)
          : '',
        address: selectedLead?.address || '',
        pincode: selectedLead?.pincode
          ? String(selectedLead.pincode)
          : '',
        allow_followup: Boolean(
          selectedLead?.allow_followup ?? selectedLead?.followUp_enabled
        ),
        follow_up_date: selectedLead?.follow_up_date || '',
        follow_up_type: selectedLead?.follow_up_type
          ? String(selectedLead.follow_up_type)
          : '',
        status: selectedLead?.status
          ? String(selectedLead.status)
          : '',
        priority: selectedLead?.priority
          ? String(selectedLead.priority)
          : '',
        reminder_before:
          selectedLead?.reminder_before !== null &&
            selectedLead?.reminder_before !== undefined
            ? String(selectedLead.reminder_before)
            : '',
        next_follow_up_date: selectedLead?.next_follow_up_date || '',
        notes: selectedLead?.notes || ''
      })

      setSelectedStateId(stateId)
    } else {
      reset({
        ...defaultValues,
        lead_status_id: selectLeadStatusId
          ? String(selectLeadStatusId)
          : ''
      })

      setSelectedStateId('')
      setSelectedCity([])
    }


  }, [open, selectedLead, selectLeadStatusId, reset])

  const handleClose = () => {
    setOpen(false)
    reset(defaultValues)
    setSelectedStateId('')
    setSelectedCity([])
  }

  const renderOptions = (data, emptyMessage) => {
    if (!data?.length) {

      return <MenuItem disabled value="">No {emptyMessage} Available</MenuItem>
    }


    return data.map(item => (
      <MenuItem key={item?._id} value={item?._id}>
        {item?.title || item?.name || ''}
      </MenuItem>
    ))


  }

  const submitData = async values => {
    if (!API_URL) {
      toast.error('API URL is missing')

      return
    }

    if (!token) {
      toast.error('Authentication token is missing')

      return
    }

    setLoading(true)

    try {
      const payload = {
        ...values,
        allow_followup: Boolean(values.allow_followup)
      }

      if (!payload.lead_status_id) {
        delete payload.lead_status_id
      }

      const url = selectedLead
        ? `${API_URL}/user/leads/data/${selectedLead._id}`
        : `${API_URL}/user/leads/data`

      const method = selectedLead ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      })

      const data = await res.json()

      if (!res.ok) {

        toast.error(data?.message || 'Something went wrong')

        return
      }

      toast.success(
        `Lead ${selectedLead ? 'updated' : 'created'} successfully`,
        {
          autoClose: 1000
        }
      )

      await fetchLeadsData()
      handleClose()
    } catch (error) {
      console.error('Submit Error:', error)
      toast.error('Server error')
    } finally {
      setLoading(false)
    }
  }



  return (
    <Dialog
      fullWidth
      maxWidth="lg"
      scroll="body"
      open={open}
      closeAfterTransition={false}
      sx={{ '& .MuiDialog-paper': { overflow: 'visible' } }}
    > <DialogCloseButton onClick={handleClose}> <i className="tabler-x" /> </DialogCloseButton>


      < DialogTitle
        variant="h4"
        className="text-center sm:pbs-16 sm:pbe-6 sm:pli-16"
      >
        {selectedLead ? 'Edit Lead' : 'Add Lead'}
      </DialogTitle >

      <form onSubmit={handleSubmit(submitData)} noValidate>
        <DialogContent className="grid grid-cols-2 gap-4">
          <Controller
            name="lead_status_id"
            control={control}
            render={({ field, fieldState }) => (
              <CustomTextField
                select
                {...field}
                disabled={!isTable}
                label="Lead Status"
                fullWidth
                error={!!fieldState.error}
                helperText={fieldState.error?.message}
              >
                {(createData?.statusData?.length ?? 0) > 0 ? (
                  createData.statusData.map(item => (
                    <MenuItem key={item._id} value={item._id}>
                      {item?.title || ''}
                    </MenuItem>
                  ))
                ) : (
                  <MenuItem disabled value="">
                    No Status Available
                  </MenuItem>
                )}
              </CustomTextField>
            )}
          />

          <Controller
            name="company_name"
            control={control}
            render={({ field, fieldState }) => (
              <CustomTextField
                {...field}
                label="Company Name"
                fullWidth
                error={!!fieldState.error}
                helperText={fieldState.error?.message}
              />
            )}
          />

          <Controller
            name="name"
            control={control}
            render={({ field, fieldState }) => (
              <CustomTextField
                {...field}
                label="Name"
                required
                fullWidth
                error={!!fieldState.error}
                helperText={fieldState.error?.message}
              />
            )}
          />

          <Controller
            name="email"
            control={control}
            render={({ field, fieldState }) => (
              <CustomTextField
                {...field}
                label="Email"
                required
                fullWidth
                error={!!fieldState.error}
                helperText={fieldState.error?.message}
              />
            )}
          />

          <Controller
            name="phone"
            control={control}
            render={({ field, fieldState }) => (
              <CustomTextField
                {...field}
                label="Phone"
                required
                fullWidth
                inputProps={{
                  inputMode: 'numeric',
                  maxLength: 15
                }}
                onChange={event => {
                  const value = event.target.value.replace(/\D/g, '')
                  
                  field.onChange(value)
                }}
                error={!!fieldState.error}
                helperText={fieldState.error?.message}
              />
            )}
          />

          <Controller
            name="average_monthly_consumption"
            control={control}
            render={({ field, fieldState }) => (
              <CustomTextField
                {...field}
                label="Monthly Consumption (kWh)"
                fullWidth
                inputProps={{
                  inputMode: 'numeric'
                }}
                onChange={event => {
                  const value = event.target.value.replace(/\D/g, '')
                  
                  field.onChange(value)
                }}
                error={!!fieldState.error}
                helperText={fieldState.error?.message}
              />
            )}
          />

          <Controller
            name="sanctioned_load"
            control={control}
            render={({ field, fieldState }) => (
              <CustomTextField
                {...field}
                label="Sanctioned Load (kW)"
                fullWidth
                inputProps={{
                  inputMode: 'decimal'
                }}
                onChange={event => {
                  let value = event.target.value.replace(/[^0-9.]/g, '')

                  const parts = value.split('.')

                  if (parts.length > 2) {
                    value = `${parts[0]}.${parts.slice(1).join('')} `
                  }

                  field.onChange(value)
                }}
                error={!!fieldState.error}
                helperText={fieldState.error?.message}
              />
            )}
          />

          <Controller
            name="source_id"
            control={control}
            render={({ field, fieldState }) => (
              <CustomTextField
                select
                {...field}
                label="Source"
                fullWidth
                error={!!fieldState.error}
                helperText={fieldState.error?.message}
              >
                {renderOptions(createData?.sourceData, 'Source')}
              </CustomTextField>
            )}
          />

          <Controller
            name="solution_id"
            control={control}
            render={({ field, fieldState }) => (
              <CustomTextField
                select
                {...field}
                label="Solution"
                fullWidth
                error={!!fieldState.error}
                helperText={fieldState.error?.message}
              >
                {renderOptions(createData?.solutionData, 'Solution')}
              </CustomTextField>
            )}
          />

          <Controller
            name="branch_id"
            control={control}
            render={({ field, fieldState }) => (
              <CustomTextField
                select
                {...field}
                label="Branch"
                required
                fullWidth
                error={!!fieldState.error}
                helperText={fieldState.error?.message}
              >
                {renderOptions(createData?.branchData, 'Branch')}
              </CustomTextField>
            )}
          />

          <Controller
            name="state_id"
            control={control}
            render={({ field, fieldState }) => (
              <CustomTextField
                select
                {...field}
                label="State"
                fullWidth
                error={!!fieldState.error}
                helperText={fieldState.error?.message}
                onChange={event => {
                  const value = event.target.value

                  field.onChange(value)
                  setSelectedStateId(value)
                  setSelectedCity([])
                  setValue('city_id', '')
                }}
              >
                {(createData?.states?.length ?? 0) > 0 ? (
                  createData.states.map(item => (
                    <MenuItem
                      key={item._id}
                      value={String(item.state_id)}
                    >
                      {item?.state_name || ''}
                    </MenuItem>
                  ))
                ) : (
                  <MenuItem disabled value="">
                    No State Available
                  </MenuItem>
                )}
              </CustomTextField>
            )}
          />

          <Controller
            name="city_id"
            control={control}
            render={({ field, fieldState }) => (
              <CustomTextField
                select
                {...field}
                label="City"
                fullWidth
                disabled={!selectedStateId}
                error={!!fieldState.error}
                helperText={fieldState.error?.message}
              >
                {selectedCity?.length > 0 ? (
                  selectedCity.map(item => (
                    <MenuItem
                      key={item._id}
                      value={String(item.city_id)}
                    >
                      {item?.city_name || ''}
                    </MenuItem>
                  ))
                ) : (
                  <MenuItem disabled value="">
                    No City Available
                  </MenuItem>
                )}
              </CustomTextField>
            )}
          />

          <Controller
            name="pincode"
            control={control}
            render={({ field, fieldState }) => (
              <CustomTextField
                {...field}
                label="Pincode"
                fullWidth
                inputProps={{
                  maxLength: 6,
                  inputMode: 'numeric'
                }}
                onChange={event => {
                  const value = event.target.value
                    .replace(/\D/g, '')
                    .slice(0, 6)

                  field.onChange(value)
                }}
                error={!!fieldState.error}
                helperText={fieldState.error?.message}
              />
            )}
          />

          <Controller
            name="address"
            control={control}
            render={({ field, fieldState }) => (
              <CustomTextField
                {...field}
                label="Address"
                fullWidth
                multiline
                rows={3}
                error={!!fieldState.error}
                helperText={fieldState.error?.message}
              />
            )}
          />

          {isCreateMode && (
            <Controller
              name="allow_followup"
              control={control}
              render={({ field }) => (
                <FormControlLabel
                  control={
                    <Switch
                      checked={Boolean(isEnabled || field.value)}
                      onChange={event => {
                        setIsEnabled(event.target.checked)
                        field.onChange(event.target.checked)
                      }}
                    />
                  }
                  label="Allow Followup"
                />
              )}
            />

          )}

          {allowFollowup && (
            <>
              <Controller
                name="follow_up_date"
                control={control}
                render={({ field, fieldState }) => (
                  <CustomTextField
                    {...field}
                    fullWidth
                    required
                    type="date"
                    label="Follow Up Date"
                    InputLabelProps={{ shrink: true }}
                    inputProps={{
                      min: today,
                      max: nextFollowUpDate
                        ? nextFollowUpDate.split('T')[0]
                        : undefined
                    }}
                    error={!!fieldState.error}
                    helperText={fieldState.error?.message}
                  />
                )}
              />

              <Controller
                name="follow_up_type"
                control={control}
                render={({ field, fieldState }) => (
                  <CustomTextField
                    {...field}
                    fullWidth
                    required
                    select
                    label="Follow Up Type"
                    error={!!fieldState.error}
                    helperText={fieldState.error?.message}
                  >
                    {renderOptions(
                      createData?.followUpType,
                      'Follow Up Type'
                    )}
                  </CustomTextField>
                )}
              />

              <Controller
                name="status"
                control={control}
                render={({ field, fieldState }) => (
                  <CustomTextField
                    {...field}
                    fullWidth
                    required
                    select
                    label="Follow Up Status"
                    error={!!fieldState.error}
                    helperText={fieldState.error?.message}
                  >
                    {renderOptions(
                      createData?.followUpStatus,
                      'Follow Up Status'
                    )}
                  </CustomTextField>
                )}
              />

              <Controller
                name="priority"
                control={control}
                render={({ field, fieldState }) => (
                  <CustomTextField
                    {...field}
                    fullWidth
                    required
                    select
                    label="Priority"
                    error={!!fieldState.error}
                    helperText={fieldState.error?.message}
                  >
                    {renderOptions(
                      createData?.followUpPriority,
                      'Priority'
                    )}
                  </CustomTextField>
                )}
              />

              <Controller
                name="reminder_before"
                control={control}
                render={({ field, fieldState }) => (
                  <CustomTextField
                    {...field}
                    fullWidth
                    type="number"
                    label="Reminder (minutes)"
                    inputProps={{
                      min: 0
                    }}
                    error={!!fieldState.error}
                    helperText={fieldState.error?.message}
                  />
                )}
              />

              <Controller
                name="next_follow_up_date"
                control={control}
                render={({ field, fieldState }) => (
                  <CustomTextField
                    {...field}
                    fullWidth
                    required
                    type="datetime-local"
                    label="Next Follow Up Date & Time"
                    InputLabelProps={{ shrink: true }}
                    inputProps={{
                      min: followUpDate
                        ? `${followUpDate} T00:00`
                        : today
                          ? `${today} T00:00`
                          : undefined
                    }}
                    error={!!fieldState.error}
                    helperText={fieldState.error?.message}
                  />
                )}
              />

              <Controller
                name="notes"
                control={control}
                render={({ field, fieldState }) => (
                  <CustomTextField
                    {...field}
                    fullWidth
                    label="Notes"
                    multiline
                    rows={3}
                    error={!!fieldState.error}
                    helperText={fieldState.error?.message}
                  />
                )}
              />
            </>
          )}
        </DialogContent>

        <DialogActions className="justify-center">
          <Button
            type="submit"
            variant="contained"
            disabled={loading}
          >
            {loading ? (
              <CircularProgress size={24} sx={{ color: 'white' }} />
            ) : (
              'Submit'
            )}
          </Button>

          <Button
            variant="outlined"
            onClick={handleClose}
            disabled={loading}
          >
            Cancel
          </Button>
        </DialogActions>
      </form>
    </Dialog >

  )
}

export default LeadsDialog
