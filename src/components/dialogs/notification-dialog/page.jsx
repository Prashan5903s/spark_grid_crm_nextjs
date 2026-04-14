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
    instance,
    pipe,
    union,
    minLength,
    maxLength,
    optional,
    check
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

    const [createData, setCreateData] = useState(null)
    const [loading, setLoading] = useState(false)
    const [selectOpt, setSelectOpt] = useState('')
    const [selectForm, setSelectForm] = useState(false)
    const [isFooterImage, setIsFooterImage] = useState(false)
    const [isShowFooter, setIsShowFooter] = useState(false)
    const [placeholder, setPlaceholder] = useState()
    const [selectedValue, setSelectedValue] = useState()
    const [selectedVariable, setSelectedVariable] = useState("")
    const [editData, setEditData] = useState()
    const [selectedPlaceholder, setSelectedPlaceholder] = useState("");
    const [activeEditor, setActiveEditor] = useState(null);

    const fileImageSchema = pipe(
        instance(File),
        check(
            file =>
                ['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml'].includes(file.type),
            'Only image files are allowed'
        )
    );

    const stringImageSchema = pipe(string());

    const imageSchema = union([fileImageSchema, stringImageSchema]);

    const schema = useMemo(
        () =>
            pipe(
                object({
                    template_name: pipe(string(), minLength(1, "Template name is required"), maxLength(50)),
                    notification_type: pipe(string(), minLength(1, "Notification type is required")),
                    category_type:
                        selectOpt === '687752877c5f232a7b35c975'
                            ? pipe(string(), minLength(1, "Category type is required"))
                            : optional(string()),
                    subject: pipe(string(), minLength(1, "Subject is required"), maxLength(100)),
                    message: pipe(string(), minLength(1, 'Message is required'), maxLength(5000)),
                    footer: pipe(string(), minLength(1, "Footer is required"), maxLength(500)),
                    default_select: optional(boolean()),
                    header_logo: optional(imageSchema),
                    footer_logo: optional(imageSchema),
                    header_logo_align: pipe(string(), minLength(1, "Header logo alignment is required")),
                    footer_logo_align: optional(string()),
                    show_footer_logo: optional(boolean())
                })
            ),
        [selectOpt, isShowFooter, id, isFooterImage]
    );

    const {
        control,
        watch,
        setValue,
        setError,
        clearErrors,
        handleSubmit,
        formState: { errors }
    } = useForm({
        resolver: valibotResolver(schema),
        defaultValues: {
            template_name: '',
            notification_type: '',
            category_type: '',
            subject: '',
            message: '',
            footer: '',
            default_select: true,
            header_logo: '',
            header_logo_align: '',
            show_footer_logo: false,
            footer_logo: '',
            footer_logo_align: ''
        }
    })

    useEffect(() => {
        if (selectedPlaceholder && selectedVariable) {
            setSelectedValue(`${slugify(selectedPlaceholder)}_${slugify(selectedVariable)}`)
        }
    }, [selectedPlaceholder, selectedVariable])

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

    const fetchCreateData = async () => {
        const res = await fetch(`${API_URL}/company/notification/create`, {
            headers: { Authorization: `Bearer ${token}` }
        })

        const data = await res.json()

        if (!res.ok) throw new Error('create load failed')

        setPlaceholder(data?.data?.placeholder?.placeholder_data)
        setCreateData(data?.data?.notification)
    }

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
            setValue('notification_type', editData?.notification_type || "")
            setSelectOpt(editData?.notification_type)
            setValue('category_type', editData?.category_type || '')
            setValue('subject', editData?.subject || "")
            setValue('message', editData?.message || "")
            setValue("show_footer_logo", editData?.show_footer_logo || false)

            if (editData?.footer_logo) {

                setIsFooterImage(true)
            }

            setValue("header_logo_align", editData?.header_logo_align || "center")
            setValue("footer_logo_align", editData?.footer_logo_align || "center")
            setValue('footer', editData?.footer || "")
            setValue('default_select', !!editData.default_select)

            editor?.commands.setContent(editData.message || '')
            footerEditor?.commands.setContent(editData.footer || '')

        }
    }, [editData])

    useEffect(() => {
        if (!API_URL || !token) return

            ; (async () => {
                try {
                    await fetchCreateData()
                    if (id) await fetchEditData()
                    setLoading(true)
                } catch {
                    toast.error('Failed to load data')
                }
            })()
    }, [API_URL, token, id])

    useEffect(() => {
        if (!createData || !selectOpt || !editor || !footerEditor || !selectForm) return

        const selected = createData?.notification_data?.find((i) => i._id === selectOpt)

        if (!selected) return

        editor.commands.setContent(selected.default_message || '')
        footerEditor.commands.setContent(selected.default_footer || '')
        setValue('message', selected.default_message || '')
        setValue('footer', selected.default_footer || '')
    }, [createData, selectOpt, selectForm, editor, footerEditor])

    const ALLOWED_IMAGE_TYPES = [
        'image/png',
        'image/jpeg',
        'image/webp',
        'image/svg+xml',
    ];

    const isValidImageType = (file) =>
        file && ALLOWED_IMAGE_TYPES.includes(file.type);

    const onSubmit = async (values) => {
        try {

            let hasError = false;

            if (!values.header_logo && !editData?.header_logo) {

                setError("header_logo", {
                    type: "required",
                    message: "Header logo is required",
                });

                hasError = true;

            } else if (values.header_logo && !isValidImageType(values.header_logo)) {

                setError("header_logo", {
                    type: "validate",
                    message: "Only PNG, JPEG, WEBP, or SVG files are allowed",
                });

                hasError = true;

            }

            if (values.show_footer_logo) {

                if (!values.footer_logo && !editData?.footer_logo) {

                    setError("footer_logo", {
                        type: "required",
                        message: "Footer logo is required",
                    });

                    hasError = true;

                } else if ((values?.footer_logo) && !isValidImageType(values.footer_logo)) {

                    setError("footer_logo", {
                        type: "validate",
                        message: "Only PNG, JPEG, WEBP, or SVG files are allowed",
                    });

                    hasError = true;
                }

                if (!values.footer_logo_align) {

                    setError("footer_logo_align", {
                        type: "required",
                        message: "Footer logo align is required",
                    });

                    hasError = true;
                }
            }

            if (hasError) {
                return;
            } else {
                clearErrors();
            }

            const formData = new FormData()

            formData.append('template_name', values.template_name)
            formData.append('notification_type', values.notification_type)
            formData.append('subject', values.subject)
            formData.append('message', values.message)
            formData.append('footer', values.footer)
            formData.append('default_select', values.default_select ? '1' : '0')
            formData.append('header_logo_align', values.header_logo_align)

            if (values.notification_type === '687752877c5f232a7b35c975') {
                formData.append('category_type', values.category_type)
            }

            if (values.header_logo instanceof File) {
                formData.append('header_logo', values.header_logo)
            }

            formData.append('show_footer_logo', values.show_footer_logo ? '1' : '0')

            if (values.show_footer_logo) {

                if (values.footer_logo instanceof File) {

                    formData.append('footer_logo', values.footer_logo)
                }

                formData.append('footer_logo_align', values.footer_logo_align)
            }

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
                                    name="notification_type"
                                    control={control}
                                    render={({ field }) => (
                                        <CustomTextField
                                            {...field}
                                            select
                                            fullWidth
                                            required
                                            label="Notification Type"
                                            onChange={e => {
                                                field.onChange(e)
                                                setSelectOpt(e.target.value)
                                                setSelectForm(true)
                                            }}
                                            error={!!errors.notification_type}
                                            helperText={errors.notification_type?.message}
                                        >
                                            {(createData?.notification_data || []).map((item) => (
                                                <MenuItem key={item._id} value={item._id}>{item.type}</MenuItem>
                                            ))}
                                        </CustomTextField>
                                    )}
                                />
                            </Grid>

                            {selectOpt === '687752877c5f232a7b35c975' && (
                                <Grid size={{ xs: 12 }}>
                                    <Controller
                                        name="category_type"
                                        control={control}
                                        render={({ field }) => (
                                            <CustomTextField {...field} select fullWidth required label="Category Type" error={!!errors.category_type} helperText={errors.category_type?.message}>
                                                {(createData?.notification_data?.find((i) => i._id === selectOpt)?.category || []).map((c) => (
                                                    <MenuItem key={c._id} value={c._id}>{c.name}</MenuItem>
                                                ))}
                                            </CustomTextField>
                                        )}
                                    />
                                </Grid>
                            )}

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
                                    name="default_select"
                                    control={control}
                                    render={({ field }) => (
                                        <FormControlLabel control={<Checkbox {...field} checked={!!field.value} />} label="Default selected" />
                                    )}
                                />
                            </Grid>

                            <Grid container spacing={4} size={{ xs: 12 }}>
                                <Grid size={{ xs: 12, sm: 6 }}>
                                    <Controller
                                        name="header_logo"
                                        control={control}
                                        render={({ field }) => (
                                            <>
                                                <input
                                                    hidden
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={e => field.onChange(e.target.files?.[0])}
                                                />

                                                <CustomTextField
                                                    fullWidth
                                                    required={(!editData?.header_logo)}
                                                    label="Header Logo"
                                                    value={field.value?.name || ''}
                                                    placeholder="Choose file"
                                                    error={!!errors.header_logo}
                                                    helperText={errors.header_logo?.message}
                                                    InputProps={{
                                                        readOnly: true,
                                                        endAdornment: (
                                                            <Button
                                                                component="label"
                                                                variant="outlined"
                                                                size="small"
                                                                sx={{ ml: 1 }}
                                                            >
                                                                Browse
                                                                <input
                                                                    hidden
                                                                    type="file"
                                                                    accept="image/*"
                                                                    onChange={e => field.onChange(e.target.files?.[0])}
                                                                />
                                                            </Button>
                                                        )
                                                    }}
                                                />
                                            </>
                                        )}
                                    />
                                </Grid>

                                <Grid size={{ xs: 12, sm: 6 }}>
                                    <Controller
                                        name="header_logo_align"
                                        control={control}
                                        render={({ field }) => (
                                            <CustomTextField
                                                {...field}
                                                select
                                                fullWidth
                                                required
                                                label="Header Logo Alignment"
                                                error={!!errors.header_logo_align}
                                                helperText={errors.header_logo_align?.message}
                                            >
                                                <MenuItem value="left">Left</MenuItem>
                                                <MenuItem value="center">Center</MenuItem>
                                                <MenuItem value="right">Right</MenuItem>
                                            </CustomTextField>
                                        )}
                                    />
                                </Grid>
                            </Grid>

                            <Grid size={{ xs: 12 }}>
                                <Controller
                                    name="show_footer_logo"
                                    control={control}
                                    render={({ field }) => (
                                        <FormControlLabel
                                            control={
                                                <Checkbox
                                                    checked={!!field.value}
                                                    onChange={(e) => {
                                                        const checked = e.target.checked;

                                                        field.onChange(checked);

                                                        setIsShowFooter(checked)
                                                    }}
                                                />
                                            }
                                            label="Show Footer Logo"
                                        />
                                    )}
                                />
                            </Grid>

                            {watch('show_footer_logo') && (
                                <>
                                    <Grid size={{ xs: 12, sm: 6 }}>
                                        <Controller
                                            name="footer_logo"
                                            control={control}
                                            render={({ field }) => (
                                                <>
                                                    <input
                                                        hidden
                                                        type="file"
                                                        accept="image/*"
                                                        onChange={e => field.onChange(e.target.files?.[0])}
                                                    />

                                                    <CustomTextField
                                                        fullWidth
                                                        required={(!editData?.footer_logo && watch("show_footer_logo"))}
                                                        label="Footer Logo"
                                                        value={field.value?.name || ''}
                                                        placeholder="Choose file"
                                                        error={!!errors.footer_logo}
                                                        helperText={errors.footer_logo?.message}
                                                        InputProps={{
                                                            readOnly: true,
                                                            endAdornment: (
                                                                <Button
                                                                    component="label"
                                                                    variant="outlined"
                                                                    size="small"
                                                                    sx={{ ml: 1 }}
                                                                >
                                                                    Browse
                                                                    <input
                                                                        hidden
                                                                        type="file"
                                                                        accept="image/*"
                                                                        onChange={e => field.onChange(e.target.files?.[0])}
                                                                    />
                                                                </Button>
                                                            )
                                                        }}
                                                    />
                                                </>
                                            )}
                                        />
                                    </Grid>

                                    <Grid size={{ xs: 12, sm: 6 }}>
                                        <Controller
                                            name="footer_logo_align"
                                            control={control}
                                            render={({ field }) => (
                                                <CustomTextField
                                                    {...field}
                                                    select
                                                    fullWidth
                                                    required={(!editData?.footer_logo_align && watch("show_footer_logo"))}
                                                    label="Footer Logo Alignment"
                                                    error={!!errors.footer_logo_align}
                                                    helperText={errors.footer_logo_align?.message}
                                                >
                                                    <MenuItem value="left">Left</MenuItem>
                                                    <MenuItem value="center">Center</MenuItem>
                                                    <MenuItem value="right">Right</MenuItem>
                                                </CustomTextField>
                                            )}
                                        />
                                    </Grid>
                                </>
                            )}

                            {/* Placeholder, Variable and Insert in one row */}
                            <Grid size={{ xs: 12 }}>
                                <Grid container spacing={2}>
                                    {/* Placeholder Dropdown */}
                                    <Grid size={{ xs: 5 }}>
                                        <CustomTextField
                                            select
                                            fullWidth
                                            value={selectedPlaceholder}
                                            onChange={(e) => {
                                                setSelectedPlaceholder(e.target.value);
                                                setSelectedVariable(""); // reset variable on placeholder change
                                            }}
                                        >
                                            {placeholder && placeholder.map((item, index) => (
                                                <MenuItem key={index} value={item.name}>
                                                    {item.name}
                                                </MenuItem>
                                            ))}
                                        </CustomTextField>
                                    </Grid>

                                    {/* Variable Dropdown */}
                                    <Grid size={{ xs: 5 }}>
                                        <CustomTextField
                                            select
                                            fullWidth
                                            value={selectedVariable}
                                            onChange={(e) => setSelectedVariable(e.target.value)}
                                            disabled={!selectedPlaceholder}
                                        >
                                            {(
                                                selectedPlaceholder && placeholder && placeholder.find((p) => p.name === selectedPlaceholder)
                                                    ?.variable || []
                                            ).map((v) => (
                                                <MenuItem key={v.name} value={v.name}>
                                                    {v.name}
                                                </MenuItem>
                                            ))}
                                        </CustomTextField>
                                    </Grid>

                                    {/* Insert Button */}
                                    <Grid size={{ xs: 2 }}>
                                        <Button
                                            fullWidth
                                            variant="outlined"
                                            onClick={() => {
                                                if (!selectedValue) return;

                                                const targetEditor =
                                                    activeEditor === 'footer' ? footerEditor : editor;

                                                if (!targetEditor) return;

                                                console.log("DATA", activeEditor, targetEditor)

                                                targetEditor
                                                    .chain()
                                                    .focus()
                                                    .insertContent(`{{${selectedValue}}}`)
                                                    .run();
                                            }}
                                            disabled={!selectedPlaceholder || !selectedVariable}
                                        >
                                            Insert
                                        </Button>
                                    </Grid>
                                </Grid>
                            </Grid>

                            <Grid size={{ xs: 12 }}>
                                <Typography>Message *</Typography>
                                <EditorToolbar editor={editor} />
                                <EditorContent
                                    editor={editor}
                                    className="border rounded p-2 min-h-[150px]"
                                    onFocus={() => setActiveEditor('message')}
                                />
                                {errors.message && <p className="text-error text-sm">{errors.message.message}</p>}
                            </Grid>

                            <Grid size={{ xs: 12 }}>
                                <Typography>Footer *</Typography>
                                <EditorToolbar editor={footerEditor} />
                                <EditorContent
                                    editor={footerEditor}
                                    className="border rounded p-2 min-h-[150px]"
                                    onFocus={() => setActiveEditor('footer')}
                                />

                                {errors.footer && <p className="text-error text-sm">{errors.footer.message}</p>}
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
