'use client'

import { useEffect, useMemo, useState } from 'react'

import { useRouter, useParams } from 'next/navigation'

import { useSession } from 'next-auth/react'

import { useForm, Controller } from 'react-hook-form'

import { valibotResolver } from '@hookform/resolvers/valibot'

import {
  object,
  string,
  boolean,
  number,
  minValue,
  maxValue,
  pipe,
  minLength,
  maxLength,
  optional,
} from 'valibot'

import {
  Card,
  Button,
  Divider,
  MenuItem,
  CardHeader,
  Typography,
  CardActions,
  Checkbox,
  CardContent,
  FormControlLabel
} from '@mui/material'

import Grid from '@mui/material/Grid2'
import { toast } from 'react-toastify'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import Placeholder from '@tiptap/extension-placeholder'
import TextAlign from '@tiptap/extension-text-align'
import TextStyle from '@tiptap/extension-text-style'
import Color from '@tiptap/extension-color'
import Heading from '@tiptap/extension-heading'

import classnames from 'classnames'
import '@/libs/styles/tiptapEditor.css'

import CustomTextField from '@core/components/mui/TextField'
import CustomIconButton from '@core/components/mui/IconButton'
import PermissionGuard from '@/hocs/PermissionClientGuard'
import SkeletonFormComponent from '@/components/skeleton/form/page'

function slugify(text) {
  return text
    ?.toString()
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
}

const EditorToolbar = ({ editor }) => {
  if (!editor) return null

  const buttons = [
    { icon: 'tabler-bold', action: () => editor.chain().focus().toggleBold().run(), active: editor.isActive('bold') },
    { icon: 'tabler-underline', action: () => editor.chain().focus().toggleUnderline().run(), active: editor.isActive('underline') },
    { icon: 'tabler-italic', action: () => editor.chain().focus().toggleItalic().run(), active: editor.isActive('italic') },
    { icon: 'tabler-strikethrough', action: () => editor.chain().focus().toggleStrike().run(), active: editor.isActive('strike') },
    { icon: 'tabler-align-left', action: () => editor.chain().focus().setTextAlign('left').run(), active: editor.isActive({ textAlign: 'left' }) },
    { icon: 'tabler-align-center', action: () => editor.chain().focus().setTextAlign('center').run(), active: editor.isActive({ textAlign: 'center' }) },
    { icon: 'tabler-align-right', action: () => editor.chain().focus().setTextAlign('right').run(), active: editor.isActive({ textAlign: 'right' }) },
    { icon: 'tabler-align-justified', action: () => editor.chain().focus().setTextAlign('justify').run(), active: editor.isActive({ textAlign: 'justify' }) }
  ]

  return (
    <div className="flex flex-wrap gap-x-3 gap-y-1 plb-2 pli-4 border-bs items-center">
      {buttons.map((btn, idx) => (
        <CustomIconButton
          key={idx}
          variant="tonal"
          size="small"
          color={btn.active ? 'primary' : undefined}
          onClick={btn.action}
        >
          <i className={classnames(btn.icon, { 'text-textSecondary': !btn.active })} />
        </CustomIconButton>
      ))}
    </div>
  )
}

const NotificationForm = () => {

  const router = useRouter()

  const { lang: locale, id } = useParams()
  const { data: session } = useSession()

  const token = session?.user?.token
  const API_URL = process.env.NEXT_PUBLIC_API_URL

  const [loading, setLoading] = useState(false)
  const [editData, setEditData] = useState()


  // Schema issue

  const schema = useMemo(
    () =>
      pipe(
        object({
          template_name: pipe(string(), minLength(1, "Template name is required"), maxLength(255)),
          subject: pipe(string(), minLength(1, "Subject is required"), maxLength(100)),
          schedule_days: pipe(string(), minValue(0, "Schedule days cannot be less than 0"), maxValue(365, "Schedule days cannot be greater than 365"), minLength(1, "Schedule days is required")),
          message: pipe(string(), minLength(1, 'Message is required'), maxLength(5000)),
          default_select: optional(boolean()),
        })
      ),
    []
  );

  const {
    control,
    setValue,
    clearErrors,
    handleSubmit,
    formState: { errors }
  } = useForm({
    resolver: valibotResolver(schema),
    defaultValues: {
      template_name: '',
      subject: '',
      message: '',
      schedule_days: '',
      default_select: true,
    }
  })

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: false }),
      Heading.configure({ levels: [1, 2, 3] }),
      Underline,
      TextStyle,
      Color,
      Placeholder.configure({ placeholder: 'Message' }),
      TextAlign.configure({ types: ['heading', 'paragraph'] })
    ],
    onUpdate: ({ editor }) => setValue('message', editor.getHTML())
  })

  const footerEditor = useEditor({
    extensions: [
      StarterKit.configure({ heading: false }),
      Heading.configure({ levels: [1, 2, 3] }),
      Underline,
      TextStyle,
      Color,
      Placeholder.configure({ placeholder: 'Footer' }),
      TextAlign.configure({ types: ['heading', 'paragraph'] })
    ],
    onUpdate: ({ editor }) => setValue('footer', editor.getHTML())
  })

  const fetchEditData = async () => {
    const res = await fetch(`${API_URL}/company/notification/edit/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    })

    if (!res.ok) throw new Error('edit load failed')

    const data = await res.json()

    if (res.ok) {

      const result = data?.data

      setEditData(result);


    }

  }

  useEffect(() => {
    if (editData) {

      setValue('template_name', editData?.template_name || "")
      setValue('subject', editData?.subject || "")
      setValue('message', editData?.message || "")
      setValue('schedule_days', editData?.schedule_days || "")
      setValue('default_select', !!editData.default_select)

      editor?.commands.setContent(editData.message || '')
      footerEditor?.commands.setContent(editData.footer || '')

    }
  }, [editData])

  useEffect(() => {
    if (!API_URL || !token) return

      ; (async () => {
        try {

          if (id) await fetchEditData()
          setLoading(true)
        } catch {
          toast.error('Failed to load data')
        }
      })()
  }, [API_URL, token, id])

  const onSubmit = async (values) => {
    try {

      let hasError = false;

      if (!hasError) {

        clearErrors();
      }

      const formData = new FormData()

      formData.append('template_name', values.template_name)
      formData.append('subject', values.subject)
      formData.append('message', values.message)
      formData.append('default_select', values.default_select ? '1' : '0')
      formData.append('schedule_days', values.schedule_days)

      const res = await fetch(
        id
          ? `${API_URL}/company/notification/update/${id}`
          : `${API_URL}/company/notification`,
        {
          method: id ? 'PUT' : 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData
        }
      )

      const result = await res.json()

      if (!res.ok) throw new Error(result.message)

      toast.success(`Notification ${id ? 'updated' : 'created'} successfully`)
      router.push(`/${locale}/apps/admin/notification`)
    } catch (e) {
      toast.error(e.message || 'Submission failed')
    }
  }

  if (!loading) return <SkeletonFormComponent />

  return (
    <PermissionGuard locale={locale} element="isSuperAdmin">
      <Card>
        <CardHeader title="Notification Template" />
        <Divider />

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <CardContent>
            <Grid container spacing={6}>
              <Grid size={{ xs: 12 }}>
                <Controller
                  name="template_name"
                  control={control}
                  render={({ field }) => (
                    <CustomTextField {...field} fullWidth required label="Template Name" error={!!errors.template_name} helperText={errors.template_name?.message} />
                  )}
                />
              </Grid>

              <Grid size={{ xs: 12 }}>
                <Controller
                  name="subject"
                  control={control}
                  render={({ field }) => (
                    <CustomTextField {...field} fullWidth required label="Subject" error={!!errors.subject} helperText={errors.subject?.message} />
                  )}
                />
              </Grid>

              <Grid size={{ xs: 12 }}>
                <Controller
                  name="schedule_days"
                  control={control}
                  render={({ field }) => (
                    <CustomTextField {...field} fullWidth required label="Schedule Days" error={!!errors.schedule_days} helperText={errors.schedule_days?.message} />
                  )}
                />
              </Grid>

              <Grid size={{ xs: 12 }}>
                <Controller
                  name="default_select"
                  control={control}
                  render={({ field }) => (
                    <FormControlLabel control={<Checkbox {...field} checked={!!field.value} />} label="Default selected" />
                  )}
                />
              </Grid>

              <Grid size={{ xs: 12 }}>
                <Typography>Message *</Typography>
                <EditorToolbar editor={editor} />
                <EditorContent
                  editor={editor}
                  className="border rounded p-2 min-h-[150px]"
                />
                {errors.message && <p className="text-error text-sm">{errors.message.message}</p>}
              </Grid>

            </Grid>
          </CardContent>

          <Divider />
          <CardActions>
            <Button type="submit" variant="contained">Submit</Button>
            <Button type="button" variant="tonal" color="error" onClick={() => router.push(`/${locale}/apps/admin/notification`)}>Cancel</Button>
          </CardActions>
        </form>
      </Card>
    </PermissionGuard>
  )
}

export default NotificationForm
