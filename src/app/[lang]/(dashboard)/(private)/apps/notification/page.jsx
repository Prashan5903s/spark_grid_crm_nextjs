'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'

import { useSession } from 'next-auth/react'

import {
    Box,
    TextField,
    Button,
    Dialog,
    Radio,
    DialogTitle,
    RadioGroup,
    MenuItem,
    DialogContent,
    Checkbox,
    FormControlLabel,
    Stack,
    Typography,
    Skeleton,
    Tab,
    Switch,
    Card,
    CardContent
} from '@mui/material'

import Grid from '@mui/material/Grid2'

import { useForm, Controller } from 'react-hook-form'

import { TabContext, TabList, TabPanel } from '@mui/lab'

import { useEditor, EditorContent, } from '@tiptap/react'

import { StarterKit } from '@tiptap/starter-kit'

import { Underline } from '@tiptap/extension-underline'

import { Placeholder } from '@tiptap/extension-placeholder'

import { TextAlign } from '@tiptap/extension-text-align'

import { TextStyle } from '@tiptap/extension-text-style'

import { Color } from '@tiptap/extension-color'

import { Heading } from '@tiptap/extension-heading'

import { valibotResolver } from '@hookform/resolvers/valibot'

import {
    object,
    string,
    pipe,
    minLength,
    maxLength,
    optional,
    boolean,
    instance,
    check,
    union,
    array,
} from 'valibot'

import { toast } from 'react-toastify'

import classnames from 'classnames'

import CustomTextField from '@/@core/components/mui/TextField'
import CustomIconButton from '@/@core/components/mui/IconButton'
import DialogCloseButton from '@/components/dialogs/DialogCloseButton'

const groupByCategory = (notifications) =>
    notifications.reduce((acc, item) => {
        if (!acc[item.category]) acc[item.category] = []
        acc[item.category].push(item)

        return acc
    }, {})

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

const EmailDialog = ({ isOpen, setIsOpen, editData, setEditData, updateNotificationAPI }) => {

    const handleClose = () => {
        setIsOpen(false)
        setEditData(null);
    };

    const stringImageSchema = pipe(string());

    const fileImageSchema = pipe(
        instance(File),
        check(
            file =>
                ['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml'].includes(file.type),
            'Only image files are allowed'
        )
    );

    const imageSchema = union([fileImageSchema, stringImageSchema]);

    const schema = pipe(
        object({
            subject: pipe(string(), minLength(1, 'Subject is required'), maxLength(100)),
            message: pipe(string(), minLength(1, 'Message is required')),
            footer: pipe(string(), minLength(1, 'Footer is required')),
            header_logo: optional(imageSchema),
            header_logo_align: pipe(string(), minLength(1, 'Header logo alignment is required')),
            show_footer_logo: optional(boolean()),
            footer_logo: optional(imageSchema),
            footer_logo_align: optional(pipe(string())),
        }))

    const {
        control,
        handleSubmit,
        watch,
        setValue,
        clearErrors,
        setError,
        formState: { errors },
        reset
    } = useForm({
        resolver: valibotResolver(schema),
    });

    const editor = useEditor({
        extensions: [StarterKit.configure({ heading: false }), Heading.configure({ levels: [1, 2, 3] }), Underline, TextStyle, Color, Placeholder.configure({ placeholder: 'Message' }), TextAlign.configure({ types: ['heading', 'paragraph'] })],
        content: editData?.message || '',
        immediatelyRender: false
    });

    const footerEditor = useEditor({
        extensions: [StarterKit.configure({ heading: false }), Heading.configure({ levels: [1, 2, 3] }), Underline, TextStyle, Color, Placeholder.configure({ placeholder: 'Footer' }), TextAlign.configure({ types: ['heading', 'paragraph'] })],
        content: editData?.footer || '',
        immediatelyRender: false
    });

    useEffect(() => {

        if (!editor) return;

        const updateHandler = () => {
            setValue('message', editor.getHTML(), { shouldValidate: true });
        };

        editor.on('update', updateHandler);

        return () => {
            editor.off('update', updateHandler);
        };
    }, [editor, setValue]);


    useEffect(() => {
        if (!footerEditor) return;
        footerEditor.on('update', () => {
            setValue('footer', footerEditor.getHTML(), { shouldValidate: true });
        });
    }, [footerEditor, setValue]);

    useEffect(() => {

        if (!editData) return;

        reset({
            subject: editData.subject || '',
            message: editData.message || '',
            footer: editData.footer || '',
            default_select: editData.default_select ?? true,
            header_logo_align: editData.header_logo_align || '',
            show_footer_logo: editData.show_footer_logo || false,
            footer_logo_align: editData.footer_logo_align || ''
        });

        editor?.commands.setContent(editData.message || '');
        footerEditor?.commands.setContent(editData.footer || '');

    }, [editData]);

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

            const formData = new FormData();

            formData.append('template_name', values.template_name);
            formData.append('notification_type', values.notification_type);
            formData.append('subject', values.subject);
            formData.append('message', editor?.getHTML() || '');
            formData.append('footer', footerEditor?.getHTML() || '');
            formData.append('default_select', editData?.default_select ? "1" : "0");
            formData.append('header_logo_align', values.header_logo_align);

            if (values.notification_type === '687752877c5f232a7b35c975') {
                formData.append('category_type', values.category_type);
            }

            if (values.header_logo instanceof File) formData.append('header_logo', values.header_logo);
            else if (typeof values.header_logo === 'string' && values.header_logo) formData.append('header_logo', values.header_logo);

            formData.append('show_footer_logo', values.show_footer_logo ? '1' : '0');

            if (values.show_footer_logo) {
                if (values.footer_logo instanceof File) formData.append('footer_logo', values.footer_logo);
                else if (typeof values.footer_logo === 'string' && values.footer_logo) formData.append('footer_logo', values.footer_logo);
                formData.append('footer_logo_align', values.footer_logo_align);
            }

            await updateNotificationAPI(formData, editData._id);
        } catch (err) {
            console.error("Error submitting notification:", err);
        }
    };

    return (
        <Dialog open={isOpen} fullWidth maxWidth="lg" sx={{ '& .MuiDialog-paper': { overflow: 'visible' } }}>
            <DialogCloseButton onClick={handleClose}><i className='tabler-x' /></DialogCloseButton>
            <DialogTitle variant='h4' className='text-center'>Edit Email Notification</DialogTitle>
            <form onSubmit={handleSubmit(onSubmit)} noValidate>
                <DialogContent sx={{ maxBlockSize: '80vh', overflowY: 'auto' }}>
                    <Grid container spacing={4}>
                        {/* Subject */}
                        <Grid size={{ xs: 12 }}>
                            <Controller
                                name="subject"
                                control={control}
                                render={({ field }) => (
                                    <CustomTextField {...field} fullWidth size="small" label="Subject" required error={!!errors.subject} helperText={errors.subject?.message} />
                                )}
                            />
                        </Grid>

                        {/* Message */}
                        <Grid size={{ xs: 12 }}>
                            <Typography>Message <span>*</span></Typography>
                            <EditorToolbar editor={editor} />
                            <Box sx={{ border: '1px solid #ccc', borderRadius: 0, p: 2, fontSize: '0.875rem', lineHeight: 1.5, minHeight: 150, '&:focus-within': { borderColor: 'primary.main' }, '& .ProseMirror': { outline: 'none' } }} onClick={() => editor?.chain().focus().run()}>
                                <EditorContent editor={editor} spellCheck={false} />
                            </Box>
                            {errors.message && <Typography color="error" variant="body2" mt={1}>{errors.message.message}</Typography>}
                        </Grid>

                        {/* Header Logo / Align */}
                        <Grid container spacing={4} size={{ xs: 12 }}>
                            <Grid size={{ xs: 12, sm: 6 }}>
                                <Controller
                                    name="header_logo"
                                    control={control}
                                    render={({ field }) => (
                                        <>
                                            <input hidden type="file" accept="image/*" onChange={e => field.onChange(e.target.files?.[0])} />
                                            <CustomTextField
                                                fullWidth
                                                required={!editData?.header_logo}
                                                label="Header Logo"
                                                value={
                                                    field.value instanceof File
                                                        ? field.value.name
                                                        : typeof field.value === 'string'
                                                            ? field.value.split('/').pop()
                                                            : ''
                                                }
                                                placeholder="Choose file"
                                                error={!!errors.header_logo}
                                                helperText={errors.header_logo?.message}
                                                InputProps={{
                                                    readOnly: true,
                                                    endAdornment: (
                                                        <Button type="button" component="label" variant="outlined" size="small" sx={{ ml: 1 }}>
                                                            Browse
                                                            <input hidden type="file" accept="image/*" onChange={e => field.onChange(e.target.files?.[0])} />
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
                                        <CustomTextField {...field} select fullWidth required value={field.value ?? ''} label="Header Logo Alignment" error={!!errors.header_logo_align} helperText={errors.header_logo_align?.message}>
                                            <MenuItem value="left">Left</MenuItem>
                                            <MenuItem value="center">Center</MenuItem>
                                            <MenuItem value="right">Right</MenuItem>
                                        </CustomTextField>
                                    )}
                                />
                            </Grid>
                        </Grid>

                        {/* Show Footer Logo */}
                        <Grid item size={{ xs: 12 }}>
                            <Controller
                                name="show_footer_logo"
                                control={control}
                                render={({ field }) => (
                                    <FormControlLabel
                                        control={<Checkbox {...field} checked={!!field.value} onChange={e => field.onChange(e.target.checked)} />}
                                        label="Show Footer Logo"
                                    />
                                )}
                            />
                        </Grid>

                        {/* Footer Logo + Align */}
                        {watch('show_footer_logo') && (
                            <>
                                <Grid item size={{ xs: 12, sm: 6 }}>
                                    <Controller
                                        name="footer_logo"
                                        control={control}
                                        render={({ field }) => (
                                            <>
                                                <input hidden type="file" accept="image/*" onChange={e => field.onChange(e.target.files?.[0])} />
                                                <CustomTextField
                                                    fullWidth
                                                    required={watch('show_footer_logo') && !editData?.footer_logo}
                                                    label="Footer Logo"
                                                    value={
                                                        field.value instanceof File
                                                            ? field.value.name
                                                            : typeof field.value === 'string'
                                                                ? field.value.split('/').pop()
                                                                : ''
                                                    }
                                                    placeholder="Choose file"
                                                    error={!!errors.footer_logo}
                                                    helperText={errors.footer_logo?.message}
                                                    InputProps={{
                                                        readOnly: true,
                                                        endAdornment: (
                                                            <Button type="button" component="label" variant="outlined" size="small" sx={{ ml: 1 }}>
                                                                Browse
                                                                <input hidden type="file" accept="image/*" onChange={e => field.onChange(e.target.files?.[0])} />
                                                            </Button>
                                                        )
                                                    }}
                                                />
                                            </>
                                        )}
                                    />
                                </Grid>

                                <Grid item size={{ xs: 12, sm: 6 }}>
                                    <Controller
                                        name="footer_logo_align"
                                        control={control}
                                        render={({ field }) => (
                                            <CustomTextField {...field} select fullWidth required value={field.value ?? ''} label="Footer Logo Alignment" error={!!errors.footer_logo_align} helperText={errors.footer_logo_align?.message}>
                                                <MenuItem value="left">Left</MenuItem>
                                                <MenuItem value="center">Center</MenuItem>
                                                <MenuItem value="right">Right</MenuItem>
                                            </CustomTextField>
                                        )}
                                    />
                                </Grid>
                            </>
                        )}

                        {/* Footer Editor */}
                        <Grid size={{ xs: 12 }}>
                            <Typography>Footer <span>*</span></Typography>
                            <EditorToolbar editor={footerEditor} />
                            <Box sx={{ border: '1px solid #ccc', borderRadius: 0, p: 2, fontSize: '0.875rem', lineHeight: 1.5, minHeight: 150, '&:focus-within': { borderColor: 'primary.main' }, '& .ProseMirror': { outline: 'none' } }} onClick={() => footerEditor?.chain().focus().run()}>
                                <EditorContent editor={footerEditor} spellCheck={false} />
                            </Box>
                            {errors.footer && <Typography color="error" variant="body2" mt={1}>{errors.footer.message}</Typography>}
                        </Grid>

                        <Grid size={{ xs: 12 }} display="flex" justifyContent="center" gap={2}>
                            <Button variant="contained" type="submit">Submit</Button>
                            <Button type="button" variant="tonal" color="error" onClick={handleClose}>Cancel</Button>
                        </Grid>
                    </Grid>
                </DialogContent>
            </form>
        </Dialog>
    );
};

const ScheduleDialog = ({
    createData,
    isScheduleOpen,
    searchLoading,
    setIsScheduleOpen,
    URL,
    editData,
    token,
    users,
    setUsers,
    userSearch,
    setUserSearch
}) => {

    const [scheduleTypes, setScheduleTypes] = useState()
    const [days, setDays] = useState(1);
    const [scheduleEditData, setScheduleEditData] = useState();
    const [userCount, setUserCount] = useState(0);

    const handleDaysChange = (type) => {
        setDays((prev) => {
            if (type === "inc") return Number(prev) + 1;
            if (type === "dec") return Number(prev) > 1 ? Number(prev) - 1 : 1;

            return prev;
        });
    };

    const [selectScheduleTarget, setSelectScheduleTarget] = useState(null);

    const scheduleSchema = pipe(
        object({
            title: pipe(string(), minLength(1, "Title is required")),
            module_id: (editData?._id === "6878cd0351dcbae6759e8912") ?
                optional(array(string()))
                :
                pipe(array(string()), minLength(1, "Module is required")),
            schedule_target: pipe(
                string("Assigned to is required"),
                minLength(1, "Assigned to is required")
            ),
            audience:
                selectScheduleTarget === "user"
                    ? pipe(array(string()), minLength(1, "Audience is required"))
                    : pipe(string(), minLength(1, "Audience is required")),
            repeat_type: pipe(string(), minLength(1, "Repeat type is required")),
            schedule_type: optional(string()),
            schedule_days: scheduleTypes ? pipe(string(), minLength(1, "Schedule day is required")) : optional(string())
        })
    );

    const fetchEditData = async () => {
        try {

            const res = await fetch(`${URL}/company/schedule/notification/edit/data/${editData?._id}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            )

            const value = await res.json()

            if (res.ok) {

                setScheduleEditData(value?.data)
            }

        } catch (error) {

            throw new Error(error)
        }
    }

    const isSpecialTemplate = editData?._id === "6878cd0351dcbae6759e8912";

    const {
        control,
        handleSubmit,
        watch,
        setValue,
        reset,
        setError,
        formState: { errors }
    } = useForm({
        resolver: valibotResolver(scheduleSchema),
        defaultValues: {
            schedule_type: "module_enrollment",
            repeat_type: "1",
            schedule_target: "",
            start_date: "",
            end_date: "",
            time: "",
            audience: selectScheduleTarget === "user" ? [] : "",
            title: "",
            module_id: isSpecialTemplate ? "" : [],
            schedule_days: ""
        }
    });

    const repeatType = watch("repeat_type");

    useEffect(() => {
        if (scheduleTypes) {
            setValue("schedule_days", String(days));
        } else {
            setValue("schedule_days", "");
        }
    }, [days, scheduleTypes, setValue]);

    const moduleTypeData = {
        "module_enrollement": "module enrollment",
        "module_expiry": "module expiry",
        "module_completion": "module completion"
    }

    useEffect(() => {
        if (!scheduleEditData) return;

        const selectedItem = createData?.assignedData?.find(
            (i) => i._id === String(scheduleEditData.schedule_target)
        );

        const targetType = selectedItem?.type || null;

        setSelectScheduleTarget(targetType);

        if (targetType === "user") {
            const selectedUsers =
                scheduleEditData.users?.length ||
                scheduleEditData.audience?.length ||
                0;

            setUserCount(selectedUsers);
        }

        reset({
            title: scheduleEditData.title || "",
            module_id: isSpecialTemplate
                ? (scheduleEditData.module_id || [])
                : (Array.isArray(scheduleEditData.module_id)
                    ? scheduleEditData.module_id
                    : []),

            schedule_target: String(scheduleEditData.schedule_target) || "",
            audience:
                targetType === "user"
                    ? (
                        scheduleEditData.audience?.length
                            ? scheduleEditData.audience
                            : scheduleEditData.users?.map(u => u._id) || []
                    )
                    : (scheduleEditData.audience || ""),

            repeat_type: String(scheduleEditData.repeat_type ?? "1"),
            schedule_type: scheduleEditData.schedule_type || "module_enrollment",
            start_date: scheduleEditData.start_date || "",
            end_date: scheduleEditData.end_date || "",
            time: scheduleEditData.time || "",
            schedule_days: scheduleEditData?.schedule_days || 1
        });

        setDays(scheduleEditData?.schedule_days || 1);
        setScheduleTypes(moduleTypeData?.[scheduleEditData?.schedule_type] || "");

    }, [scheduleEditData]);

    const saveNotificationSchedule = async (data) => {
        try {

            const response = await fetch(`${URL}/company/schedule/notification/data`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(data)
            })


            if (response.ok) {

                toast.success("Notification schedule completed successfully", {
                    autoClose: 1000
                })

                fetchEditData();

                setIsScheduleOpen(false)
            }


        } catch (error) {

            throw new Error(error)
        }
    }

    const onSubmit = async (values) => {
        try {

            if (values.repeat_type === "2" && !values.schedule_type) {
                setError("schedule_type", {
                    type: "manual",
                    message: "Schedule type is required"
                });

                return;
            }

            if (!values.schedule_target) {

                setError("schedule_target", {
                    type: "manual",
                    message: "Schedule target is required"
                });

                return;
            }

            values.template_id = editData._id;
            values.notification_type = editData.notification_type;

            await saveNotificationSchedule(values);

        } catch (err) {
            console.error(err);
        }
    };

    const handleSchedClose = () => {

        reset({
            schedule_type: "",
            repeat_type: "1",
            schedule_days: "",
            schedule_target: "",
            start_date: "",
            end_date: "",
            time: "",
            audience: selectScheduleTarget === "user" ? [] : "",
            title: "",
            module_id: isSpecialTemplate ? "" : [],
        })

        setScheduleTypes();

        setValue("title", "")

        setSelectScheduleTarget()

        setIsScheduleOpen(false)
    }

    useEffect(() => {

        if (URL && token && editData && isScheduleOpen) {

            fetchEditData()
        }
    }, [URL, token, editData, isScheduleOpen])

    return (
        <Dialog open={isScheduleOpen} fullWidth maxWidth="lg"
            sx={{ '& .MuiDialog-paper': { overflow: 'visible' } }}>

            <DialogCloseButton onClick={handleSchedClose}>
                <i className='tabler-x' />
            </DialogCloseButton>

            <DialogTitle className="text-center">
                Edit Notification Schedule
            </DialogTitle>

            <form onSubmit={handleSubmit(onSubmit)} noValidate>
                <DialogContent sx={{ maxHeight: "80vh", overflowY: "auto" }}>
                    <Grid container spacing={3}>

                        {/* TITLE */}
                        <Grid item size={{ xs: 12 }}>
                            <Controller
                                name="title"
                                control={control}
                                render={({ field }) => (
                                    <CustomTextField
                                        {...field}
                                        required
                                        label="Title"
                                        fullWidth
                                        size="small"
                                        error={!!errors.title}
                                        helperText={errors.title?.message}
                                    />
                                )}
                            />
                        </Grid>

                        {/* MODULE */}

                        {editData?._id !== "6878cd0351dcbae6759e8912" && (

                            <Grid item size={{ xs: 12 }}>
                                <Controller
                                    name="module_id"
                                    control={control}
                                    render={({ field }) => (
                                        <CustomTextField
                                            select
                                            fullWidth
                                            label="Module"
                                            size="small"
                                            value={field.value || []}
                                            SelectProps={{ multiple: true }}
                                            onChange={(e) => field.onChange(e.target.value)}   // ⭐ IMPORTANT
                                            error={!!errors.module_id}
                                            helperText={errors.module_id?.message}
                                        >
                                            {createData?.module?.map((item) => (
                                                <MenuItem key={item._id} value={item._id}>
                                                    <Checkbox checked={field.value?.includes(item._id)} />
                                                    {item.title}
                                                </MenuItem>
                                            ))}
                                        </CustomTextField>
                                    )}
                                />
                            </Grid>

                        )}

                        {/* ASSIGNED TO */}
                        <Grid item size={{ xs: 12 }}>
                            <Controller
                                name="schedule_target"
                                rules={{ required: "Assigned to is required" }}
                                control={control}
                                render={({ field }) => (
                                    <CustomTextField
                                        {...field}
                                        select={Boolean(createData?.assignedData?.length)}
                                        required
                                        fullWidth
                                        label="Assigned To"
                                        size="small"
                                        error={!!errors.schedule_target}
                                        helperText={errors.schedule_target?.message}
                                        onChange={(e) => {

                                            const selectedId = e.target.value;

                                            field.onChange(selectedId);
                                            setValue("schedule_target", selectedId, { shouldValidate: true });

                                            const selectedItem = createData?.assignedData?.find(
                                                (i) => i._id === String(selectedId)
                                            );

                                            setUserCount(0);

                                            setSelectScheduleTarget(selectedItem?.type || null);

                                            if (selectedItem?.type === "user") {

                                                setValue("audience", []);
                                            } else {

                                                setValue("audience", "");
                                            }

                                        }}
                                    >
                                        {createData?.assignedData?.length ? (
                                            createData.assignedData.map((item) => (
                                                <MenuItem key={item._id} value={item._id}>
                                                    {item.title}
                                                </MenuItem>
                                            ))
                                        ) : (
                                            <MenuItem disabled>No options</MenuItem>
                                        )}
                                    </CustomTextField>
                                )}
                            />
                        </Grid>

                        {selectScheduleTarget && (
                            <Grid item size={{ xs: 12 }}>
                                <Controller
                                    name="audience"
                                    control={control}
                                    render={({ field }) => {

                                        /* ⭐ FIX: keep selected users visible */
                                        const selectedUsers = users.filter(u =>
                                            field.value?.includes(u._id)
                                        );

                                        const filteredUsers = users.filter(u =>
                                            `${u.first_name ?? ""} ${u.last_name ?? ""} ${u.name ?? ""}`
                                                .toLowerCase()
                                                .includes(userSearch.toLowerCase())
                                        );

                                        const visibleUsers = [
                                            ...selectedUsers,
                                            ...filteredUsers.filter(
                                                u => !field.value?.includes(u._id)
                                            )
                                        ];

                                        return (
                                            <CustomTextField
                                                select
                                                fullWidth
                                                label="Target Audience"
                                                size="small"
                                                SelectProps={{
                                                    multiple: selectScheduleTarget === "user",
                                                    MenuProps: {
                                                        PaperProps: {
                                                            style: { maxHeight: 300 }
                                                        }
                                                    }
                                                }}
                                                value={
                                                    selectScheduleTarget === "user"
                                                        ? field.value || []
                                                        : field.value || ""
                                                }
                                                onChange={(e) => {
                                                    const value = e.target.value;

                                                    field.onChange(value);

                                                    if (selectScheduleTarget === "user") {

                                                        const selectedUsers = users.filter(u =>
                                                            value.includes(u._id)
                                                        );

                                                        setUserCount(selectedUsers.length);
                                                    } else {
                                                        const selectedItem = createData?.[selectScheduleTarget]
                                                            ?.find(i => i._id === value);

                                                        setUserCount(selectedItem?.userCount || 0);
                                                    }
                                                }}
                                                error={!!errors.audience}
                                                helperText={errors.audience?.message}
                                            >
                                                {selectScheduleTarget === "user" && (
                                                    <MenuItem disableRipple disableTouchRipple
                                                        sx={{
                                                            position: "sticky",
                                                            insetBlockStart: 0,
                                                            zIndex: 1,
                                                            backgroundColor: "background.paper",
                                                            cursor: "default",
                                                            "&:hover": { backgroundColor: "background.paper" }
                                                        }}
                                                    >
                                                        <TextField
                                                            size="small"
                                                            placeholder="Search user..."
                                                            fullWidth
                                                            autoFocus
                                                            value={userSearch}
                                                            onChange={(e) => setUserSearch(e.target.value)}
                                                            onKeyDown={(e) => e.stopPropagation()}
                                                            onClick={(e) => e.stopPropagation()}
                                                        />
                                                    </MenuItem>
                                                )}

                                                {(selectScheduleTarget === "user"
                                                    ? visibleUsers   /* ⭐ ONLY CHANGE */
                                                    : createData?.[selectScheduleTarget]
                                                )?.map((item) => (
                                                    <MenuItem key={item._id} value={item._id}>
                                                        {selectScheduleTarget === "user" && (
                                                            <Checkbox checked={field.value?.includes(item._id)} />
                                                        )}
                                                        {item.name ??
                                                            `${item.first_name ?? ""} ${item.last_name ?? ""} ${item.empCode}`}
                                                    </MenuItem>
                                                ))}
                                            </CustomTextField>
                                        )
                                    }}
                                />
                            </Grid>
                        )}

                        <Grid size={{ xs: 12 }}>
                            <Typography variant='body2'>Total User count: {userCount}</Typography>
                        </Grid>

                        {/* REPEAT TYPE */}
                        <Grid item size={{ xs: 12 }}>
                            <Typography variant="subtitle2">
                                Repeat type *
                            </Typography>

                            <Controller
                                name="repeat_type"
                                control={control}
                                render={({ field }) => (
                                    <RadioGroup row {...field}>
                                        {createData?.occuranceData?.map((item) => (
                                            <FormControlLabel
                                                key={item._id}
                                                value={String(item._id)}
                                                control={<Radio />}
                                                label={item.title}
                                            />
                                        ))}
                                    </RadioGroup>
                                )}
                            />
                            {errors.repeat_type && (
                                <Typography color="var(--mui-palette-error-main)" variant="body2">
                                    {errors.repeat_type.message}
                                </Typography>
                            )}
                        </Grid>

                        {/* SCHEDULE TYPE */}
                        {repeatType === "2" && (
                            <Grid item size={{ xs: 12 }}>
                                <Typography variant="subtitle2">
                                    Schedule Type *
                                </Typography>
                                <Controller
                                    name="schedule_type"
                                    control={control}
                                    render={({ field }) => (
                                        <RadioGroup row {...field}>
                                            <FormControlLabel value="module_enrollement" onClick={() => setScheduleTypes("Module Enrollement")} control={<Radio />} label="Module Enrollement" />
                                            <FormControlLabel value="module_expiry" onClick={() => setScheduleTypes("Module Expiry")} control={<Radio />} label="Module Expiry" />
                                        </RadioGroup>
                                    )}
                                />
                                {errors?.schedule_type && <Typography color="var(--mui-palette-error-main)" variant="body2">{errors?.schedule_type?.message}</Typography>}
                            </Grid>
                        )}

                        {scheduleTypes && (

                            <Grid item size={{ xs: 12 }}>
                                <Typography variant="subtitle2" mb={1}>
                                    Starts (Select event for email trigger)
                                </Typography>

                                {/* Inner box */}
                                <Box
                                    mt={2}
                                    p={2}
                                    borderRadius={2}
                                    display="flex"
                                    alignItems="center"
                                    gap={2}
                                    flexWrap="wrap"
                                >

                                    {/* Stepper */}
                                    <Grid
                                        display="flex"
                                        alignItems="center"
                                        border="1px solid #ddd"
                                        borderRadius={1}
                                        overflow="hidden"
                                    >
                                        <Button
                                            size="small"
                                            onClick={() => handleDaysChange("dec")}
                                            sx={{ minWidth: 36 }}
                                        >
                                            –
                                        </Button>

                                        <Box px={2}>{days}</Box>

                                        <Button
                                            size="small"
                                            variant="text"
                                            onClick={() => handleDaysChange("inc")}
                                            sx={{
                                                minWidth: 36,
                                                borderRadius: 0,
                                                "&:hover": {
                                                    backgroundColor: "primary.main",
                                                    color: "primary.contrastText"
                                                }
                                            }}
                                        >
                                            +
                                        </Button>
                                    </Grid>

                                    <Typography>Days {scheduleTypes === "Module Expiry" ? "before" : "after"} {scheduleTypes.toLowerCase()}</Typography>
                                </Box>
                                {errors?.schedule_days && (
                                    <Typography color="var(--mui-palette-error-main)" variant="body2">
                                        {errors?.schedule_days?.message}
                                    </Typography>
                                )}
                            </Grid>

                        )}

                        {/* ACTIONS */}
                        <Grid item size={{ xs: 12 }} display="flex" justifyContent="center" gap={2} mt={4}>
                            <Button variant="contained" type="submit">
                                Submit
                            </Button>
                            <Button variant="outlined" onClick={handleSchedClose}>
                                Cancel
                            </Button>
                        </Grid>

                    </Grid>
                </DialogContent>
            </form>
        </Dialog>
    );
};

const EmailNotificationTab = ({
    formData,
    searchLoading,
    createData,
    handleCheckboxChange,
    updateNotificationAPI,
    isOpen,
    setIsOpen,
    isScheduleOpen,
    setIsScheduleOpen,
    editData,
    setEditData,
    URL,
    token,
    users,
    setUsers,
    userSearch,
    setUserSearch
}) => {

    const grouped = groupByCategory(formData);

    return (
        <Box>
            {Object.entries(grouped).map(([category, items]) => (
                <Box key={category} mb={4}>
                    <Typography variant="subtitle1" fontWeight={800} mb={2}>{category}</Typography>
                    <Stack spacing={2}>
                        {items.map(item => (
                            <Box key={item._id} display="flex" justifyContent="space-between" alignItems="center" border="1px solid #ddd" borderRadius={2} p={2}>
                                <FormControlLabel control={<Checkbox checked={!!item?.default_select} onChange={handleCheckboxChange(category, item._id, item)} color="primary" />} label={item.template_name} />
                                <Grid size={{ xs: 12 }}>
                                    <Button type="button" onClick={() => {
                                        setEditData(item);
                                        setIsScheduleOpen(true);
                                    }}>
                                        <i className='tabler-settings'></i>
                                    </Button>
                                    <Button type="button" onClick={() => {
                                        setEditData(item);
                                        setIsOpen(true);
                                    }}>
                                        <i className='tabler-edit'></i>
                                    </Button>
                                </Grid>
                            </Box>
                        ))}
                    </Stack>
                </Box>
            ))}
            <EmailDialog
                isOpen={isOpen}
                setIsOpen={setIsOpen}
                editData={editData}
                setEditData={setEditData}
                updateNotificationAPI={updateNotificationAPI}
            />
            <ScheduleDialog
                URL={URL}
                token={token}
                createData={createData}
                searchLoading={searchLoading}
                isScheduleOpen={isScheduleOpen}
                setIsScheduleOpen={setIsScheduleOpen}
                editData={editData}
                updateNotificationAPI={updateNotificationAPI}
                users={users}
                setUsers={setUsers}
                userSearch={userSearch}
                setUserSearch={setUserSearch}
            />
        </Box>
    );
};

const AppPushNotificationTab = ({ formData, createData, handleCheckboxChange, updateNotificationAPI }) => (
    <Box>
        <Typography variant="h6" mb={2}>In-App & Push Notifications</Typography>
        <Stack spacing={2}>
            {formData?.map(item => (
                <Box key={item._id} display="flex" justifyContent="space-between" alignItems="center" border="1px solid #ddd" borderRadius={2} p={2}>
                    <Typography flex={1}>{item.template_name}</Typography>
                    <Switch onChange={handleCheckboxChange(null, item._id, item)} checked={!!item?.default_select} color="primary" />
                </Box>
            ))}
        </Stack>
    </Box>
);

const SMSNotificationTab = ({ formData, createData, handleCheckboxChange, updateNotificationAPI }) => (
    <Box>
        <Typography variant="h6" mb={2}>SMS Notifications</Typography>
        <Stack spacing={2}>
            {formData?.map(item => (
                <Box key={item._id} display="flex" justifyContent="space-between" alignItems="center" border="1px solid #ddd" borderRadius={2} p={2}>
                    <Typography flex={1}>{item.template_name}</Typography>
                    <Switch onChange={handleCheckboxChange(null, item._id, item)} checked={!!item?.default_select} color="primary" />
                </Box>
            ))}
        </Stack>
    </Box>
);

const renderTabContent = ({
    fetchNotificationFormData,
    createData,
    token,
    searchLoading,
    URL,
    formData,
    tabValue,
    editData,
    setEditData,
    isOpen,
    setIsOpen,
    isScheduleOpen,
    setIsScheduleOpen,
    userSearch,
    setUserSearch,
    users,
    setUsers
}) => {

    if (!formData) return <Box>Loading data...</Box>;

    const updateNotificationAPI = async (formData, id) => {

        try {
            const response = await fetch(`${URL}/company/notification/form/update/${id}`, {
                method: "PUT",
                headers: { Authorization: `Bearer ${token}` },
                body: formData
            });

            const data = await response.json();

            if (!response?.ok) throw new Error(data?.message || "Failed to update notification");
            await fetchNotificationFormData(tabValue);
            toast.success('Notification updated successfully', { autoClose: 1000 });
            setIsOpen(false);
            setEditData(null);
        } catch (err) {
            console.error("Update Notification Error:", err);
            throw err;
        }
    };

    const updateCheckNotificationAPI = async (formData, id) => {

        try {
            const response = await fetch(`${URL}/company/notification/check/select/${id}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            });

            const data = await response.json();

            if (!response?.ok) throw new Error(data?.message || "Failed to update notification");
            await fetchNotificationFormData(tabValue);
            toast.success('Notification updated successfully', { autoClose: 1000 });
            setIsOpen(false);
            setEditData(null);
        } catch (err) {
            console.error("Update Notification Error:", err);
            throw err;
        }
    };

    const handleCheckboxChange = (category, id, val) => async (event) => {
        const updatedDefault = event.target.checked;

        const payload = {
            template_name: val?.template_name,
            notification_type: val?.notification_type,
            category_type: val?.category_type,
            subject: val.subject,
            message: val.message,
            header_logo: val.header_logo,
            footer_logo: val.footer_logo,
            footer_logo_align: val?.footer_logo_align,
            header_logo_align: val?.header_logo_align,
            show_footer_logo: val?.show_footer_logo,
            footer: val.footer,
            default_select: updatedDefault
        };

        try { await updateCheckNotificationAPI(payload, val._id); } catch (e) { console.error(e); }
    };

    switch (tabValue) {
        case '687752877c5f232a7b35c975': return <EmailNotificationTab
            formData={formData}
            searchLoading={searchLoading}
            URL={URL}
            token={token}
            createData={createData}
            handleCheckboxChange={handleCheckboxChange}
            updateNotificationAPI={updateNotificationAPI}
            isOpen={isOpen}
            users={users}
            setUsers={setUsers}
            userSearch={userSearch}
            setUserSearch={setUserSearch}
            setIsOpen={setIsOpen}
            isScheduleOpen={isScheduleOpen}
            setIsScheduleOpen={setIsScheduleOpen}
            editData={editData}
            setEditData={setEditData}
        />;
        case '687752877c5f232a7b35c97a': return <AppPushNotificationTab createData={createData} formData={formData} updateNotificationAPI={updateNotificationAPI} handleCheckboxChange={handleCheckboxChange} />;
        case '687752877c5f232a7b35c97b': return <SMSNotificationTab createData={createData} formData={formData} handleCheckboxChange={handleCheckboxChange} updateNotificationAPI={updateNotificationAPI} />;
        default: return <Box>No tab selected</Box>;
    }
};

const SkeletonComponent = () => {
    return (
        <Card>
            <CardContent>
                {/* Skeleton for Tabs */}
                <Stack direction="row" spacing={2} sx={{ overflowX: 'auto' }}>
                    {[...Array(4)].map((_, idx) => (
                        <Skeleton key={idx} variant="rectangular" width={100} height={40} />
                    ))}
                </Stack>

                {/* Skeleton for Tab Panel Content */}
                <Box mt={4}>
                    <Skeleton variant="text" height={40} width="60%" />
                    <Skeleton variant="text" height={30} width="40%" />
                    <Skeleton variant="rectangular" height={200} sx={{ mt: 2 }} />
                </Box>
            </CardContent>
        </Card>
    )
}

const NotificationTabs = () => {

    const { data: session } = useSession();
    const token = session?.user?.token;
    const URL = process.env.NEXT_PUBLIC_API_URL;

    const [tabValue, setTabValue] = useState(null);
    const [data, setData] = useState(null);
    const [formData, setFormData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [editData, setEditData] = useState(null);

    const [isOpen, setIsOpen] = useState(false)
    const [isScheduleOpen, setIsScheduleOpen] = useState(false)

    const fetchCreate = useCallback(async () => {
        try {
            const res = await fetch(`${URL}/company/notification/create`, { headers: { Authorization: `Bearer ${token}` } });
            const json = await res.json();
            const result = json?.data?.notification;

            setData(result);
            setTabValue(result?.notification_data?.[0]?._id?.toString());
        } catch (err) {
            console.error('Fetch error:', err);
        } finally {
            setLoading(false);
        }
    }, [URL, token]);

    const fetchNotificationFormData = async (tabId) => {
        setLoading(true);

        try {
            const res = await fetch(`${URL}/company/notification/form/${tabId}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            const json = await res.json();

            setFormData(json?.data || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };


    const [userSearch, setUserSearch] = useState("");
    const [users, setUsers] = useState([]);

    const [createData, setCreateData] = useState(null);
    const [searchLoading, setSearchLoading] = useState(false);

    useEffect(() => {

        if (!token) return;

        const delay = setTimeout(async () => {
            setSearchLoading(true);

            try {
                const res = await fetch(
                    `${URL}/company/schedule/notification/create/data?search=${userSearch}`,
                    { headers: { Authorization: `Bearer ${token}` } }
                );

                const data = await res.json();

                if (res.ok) {

                    setCreateData(data?.data);
                    setUsers(data?.data?.user || []);
                }
            } catch (err) {
                console.error(err);
            } finally {
                setSearchLoading(false);
            }
        }, userSearch.length < 2 ? 0 : 350);

        return () => clearTimeout(delay);
    }, [userSearch, token]);

    // const fetchNotificationCreateData = async (search = "") => {
    //     try {
    //         setSearchLoading(true);

    //         const res = await fetch(
    //             `${URL}/company/schedule/notification/create/data?search=${search}`,
    //             {
    //                 headers: {
    //                     Authorization: `Bearer ${token}`
    //                 }
    //             }
    //         );

    //         const data = await res.json();

    //         if (res.ok) {


    //             setUsers(data?.data?.user || []);

    //             setSearchLoading(false)
    //         }
    //     } catch (err) {
    //         console.error(err);
    //     } finally {

    //         setSearchLoading(false);
    //     }
    // };

    useEffect(() => {
        if (token && URL) {

            fetchCreate();

        }
    }, [token, URL]);

    useEffect(() => {
        if (isScheduleOpen) {
            setUserSearch("");
        }
    }, [isScheduleOpen]);

    useEffect(() => {
        if (tabValue) fetchNotificationFormData(tabValue);
    }, [tabValue]);

    if (loading && !tabValue) return <SkeletonComponent />;

    return (
        <Card>
            <CardContent>
                <TabContext value={tabValue}>
                    <TabList onChange={(_, newVal) => setTabValue(newVal)} variant="scrollable" className="border-b">
                        {data?.notification_data?.map(item => <Tab key={item._id} label={item.type} value={item._id.toString()} />)}
                    </TabList>
                    <Box mt={4}>
                        <TabPanel value={tabValue} className="p-0">{renderTabContent({
                            fetchNotificationFormData,
                            formData,
                            createData,
                            tabValue,
                            searchLoading,
                            editData,
                            setUserSearch,
                            userSearch,
                            users,
                            setUsers,
                            setEditData,
                            isOpen,
                            setIsOpen,
                            isScheduleOpen,
                            setIsScheduleOpen,
                            token,
                            URL
                        })}
                        </TabPanel>
                    </Box>
                </TabContext>
            </CardContent>
        </Card>
    );
};

export default NotificationTabs
