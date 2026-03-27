"use client"

import { useEffect, useState } from "react"

import { useRouter, useParams } from "next/navigation"

import { useSession } from "next-auth/react"

import {
    Box,
    Button,
    Chip,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Stack,
    Typography,
    Table,
    Checkbox,
    FormControlLabel,
    FormGroup,
    Skeleton,
    TablePagination,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions
} from "@mui/material"

import Grid from "@mui/material/Grid2"

import { LocalizationProvider, DatePicker } from "@mui/x-date-pickers"

import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs"

import dayjs from "dayjs"

import DialogCloseButton from "@/components/dialogs/DialogCloseButton"

import { exportToExcel } from "@/utils/exportToExcel"

const API_URL = process.env.NEXT_PUBLIC_API_URL

const ALL_COLUMNS = [
    { label: "Full Name", key: "fullName" },
    { label: "User Name", key: "userName" },
    { label: "Program", key: "programName" },
    { label: "Content Folder", key: "contentFolderName" },
    { label: "Module", key: "moduleName" },
    { label: "Activity", key: "moduleTypeName" },
    { label: "Start attempt time", key: "startedTime" },
    { label: "End attempt time", key: "endTime" },
    { label: "Attempt duration", key: "duration" },
    { label: "Current Attempt", key: "current_attempt" },
    { label: "Completion %", key: "completePercent" },
    { label: "Mark %", key: "markPercent" },
    { label: "Passing Status", key: "passedStatus" },
    { label: "Completion Status", key: "completionStatus" },
]

const renderSelect = (
    label,
    value,
    setValue,
    options,
    multiple = false
) => {
    const labelId = `${label.replace(/\s+/g, "-")}-label`

    return (
        <FormControl fullWidth size="small">
            <InputLabel id={labelId} shrink>
                {label}
            </InputLabel>

            <Select
                labelId={labelId}
                multiple={multiple}
                value={value ?? (multiple ? [] : "")}
                label={label}
                onChange={(e) => setValue(e.target.value)}
                renderValue={(selected) => {
                    if (!selected || (Array.isArray(selected) && selected.length === 0)) {

                        return <span style={{ color: "#9e9e9e" }}>Select {label}</span>
                    }

                    if (!multiple) {

                        return options.find(o => o._id === selected)?.title || ""
                    }

                    return options
                        .filter(o => selected.includes(o._id))
                        .map(o => o.title)
                        .join(", ")
                }}
            >
                {options.map(opt => (
                    <MenuItem key={opt._id} value={opt._id}>
                        {opt.title}
                    </MenuItem>
                ))}
            </Select>
        </FormControl>
    )
}

const FilterModal = ({ open, onClose, setFilterData, filterData, token }) => {
    const [fromTime, setFromTime] = useState(filterData.fromTime)
    const [toTime, setToTime] = useState(filterData.toTime)
    const [selectedColumns, setSelectedColumns] = useState(filterData.columns)

    const [program, setProgram] = useState(filterData.programs)
    const [contentFolders, setContentFolders] = useState(filterData.contentFolders)
    const [modules, setModules] = useState(filterData.modules)
    const [moduleTypes, setModuleTypes] = useState(filterData.moduleTypes)
    const [attemptType, setAttemptType] = useState(filterData.attemptType)

    const [createData, setCreateData] = useState({})
    const [loading, setLoading] = useState(false)

    useEffect(() => {

        if (!token) return

        const fetchData = async () => {
            setLoading(true)

            try {
                const res = await fetch(`${API_URL}/company/dashboard/filter/data`, {
                    headers: { Authorization: `Bearer ${token}` }
                })

                const json = await res.json()

                console.log("JSON", json.data);


                setCreateData(json?.data || {})
            } finally {

                setLoading(false)
            }
        }

        fetchData()
    }, [token])

    const programOptions = createData.program || []

    const contentFolderOptions = (createData.contentFolder || []).filter(
        cf => cf.program_id === program
    )

    const moduleOptions = (createData.module || []).filter(
        m => contentFolders.includes(m.content_folder_id)
    )

    const moduleTypeOptions = moduleOptions.length > 0 ? createData.moduleType : [];

    useEffect(() => {

        setContentFolders([])
        setModules([])
        setModuleTypes([])
    }, [program])

    useEffect(() => {

        setModules([])
        setModuleTypes([])
    }, [contentFolders])

    const toggleColumn = (key) => {
        setSelectedColumns(prev =>
            prev.includes(key) ? prev.filter(c => c !== key) : [...prev, key]
        )
    }

    const handleApply = () => {
        setFilterData({
            fromTime,
            toTime,
            programs: program,
            contentFolders,
            modules,
            moduleTypes,
            attemptType,
            columns: selectedColumns
        })
        onClose()
    }

    const handleReset = () => {
        const allKeys = ALL_COLUMNS.map(c => c.key)

        setFromTime(null)
        setToTime(null)
        setProgram(null)
        setContentFolders([])
        setModules([])
        setModuleTypes([])
        setSelectedColumns(allKeys)

        setFilterData({
            fromTime: null,
            toTime: null,
            programs: null,
            contentFolders: [],
            modules: [],
            moduleTypes: [],
            attemptType: null,
            columns: allKeys
        })
    }

    return (
        <Dialog fullWidth maxWidth="lg" open={open} onClose={onClose} sx={{ '& .MuiDialog-paper': { overflow: 'visible' } }}>
            <DialogCloseButton onClick={onClose}>
                <i className="tabler-x" />
            </DialogCloseButton>
            <DialogTitle>Filter</DialogTitle>

            <DialogContent dividers>
                <Grid container spacing={3}>
                    <LocalizationProvider dateAdapter={AdapterDayjs}>
                        <Grid size={{ xs: 12, md: 6 }}>
                            <DatePicker
                                label="From Date"
                                value={fromTime}
                                onChange={setFromTime}
                                maxDate={toTime || undefined}
                                slotProps={{ textField: { fullWidth: true, size: "small" } }}
                            />
                        </Grid>

                        <Grid size={{ xs: 12, md: 6 }}>
                            <DatePicker
                                label="To Date"
                                value={toTime}
                                onChange={setToTime}
                                minDate={fromTime || undefined}
                                slotProps={{ textField: { fullWidth: true, size: "small" } }}
                            />
                        </Grid>
                    </LocalizationProvider>

                    <Grid size={{ xs: 12, md: 4 }}>
                        {renderSelect("Program", program, setProgram, programOptions)}
                    </Grid>

                    <Grid size={{ xs: 12, md: 4 }}>
                        {renderSelect("Content Folder", contentFolders, setContentFolders, contentFolderOptions, true)}
                    </Grid>

                    <Grid size={{ xs: 12, md: 4 }}>
                        {renderSelect("Module", modules, setModules, moduleOptions, true)}
                    </Grid>

                    <Grid size={{ xs: 12, md: 4 }}>
                        {renderSelect("Activity", moduleTypes, setModuleTypes, moduleTypeOptions, true)}
                    </Grid>

                    <Grid size={{ xs: 12, md: 4 }}>
                        {renderSelect("Attempt Type", attemptType, setAttemptType, (createData.attemptType || []), false)}
                    </Grid>

                    <Grid size={{ xs: 12 }}>
                        <Typography variant="subtitle1">Select Columns</Typography>
                        <FormGroup row>
                            {ALL_COLUMNS.map(col => (
                                <FormControlLabel
                                    key={col.key}
                                    control={
                                        <Checkbox
                                            checked={selectedColumns.includes(col.key)}
                                            onChange={() => toggleColumn(col.key)}
                                        />
                                    }
                                    label={col.label}
                                />
                            ))}
                        </FormGroup>
                    </Grid>
                </Grid>
            </DialogContent>

            <DialogActions sx={{ justifyContent: "center", mt: 5 }}>
                <Button variant="outlined" onClick={handleReset}>Reset</Button>
                <Button variant="contained" onClick={handleApply}>Apply</Button>
            </DialogActions>
        </Dialog>
    )
}

const DashboardTab = ({ token, filterData, onFilterClick }) => {

    const [data, setData] = useState([])
    const [loading, setLoading] = useState(true)
    const [page, setPage] = useState(0)
    const [rowsPerPage, setRowsPerPage] = useState(10)

    const visibleColumns = ALL_COLUMNS.filter(c =>
        filterData.columns.includes(c.key)
    )

    const router = useRouter();

    const { lang } = useParams();

    useEffect(() => {
        if (!token) return

        const params = new URLSearchParams()

        if (filterData.fromTime)
            params.append("fromTime", dayjs(filterData.fromTime).toISOString())

        if (filterData.toTime)
            params.append("toTime", dayjs(filterData.toTime).toISOString())

        if (filterData.programs)
            params.append("programs", filterData.programs)

        if (filterData.attemptType)
            params.append("attemptType", filterData.attemptType)

        filterData.contentFolders.forEach(id =>
            params.append("contentFolders", id)
        )
        filterData.modules.forEach(id =>
            params.append("modules", id)
        )
        filterData.moduleTypes.forEach(id =>
            params.append("moduleType", id)
        )

        const fetchData = async () => {
            setLoading(true)

            const res = await fetch(
                `${API_URL}/company/dashboard/advance/training/report?${params.toString()}`,
                { headers: { Authorization: `Bearer ${token}` } }
            )

            const json = await res.json()

            setData(json?.data || [])
            setLoading(false)
        }

        fetchData()
    }, [token, filterData])

    const handleExport = async () => {

        if (data.length <= 2000) {

            exportToExcel({
                headers: visibleColumns,
                rows: data.map(row =>
                    Object.fromEntries(
                        visibleColumns.map(c => [c.key, row[c.key] ?? ""])
                    )
                ),
                fileName: "advance_training_report.xlsx"
            })
        } else {

            const res = await fetch(`${API_URL}/company/export/center/create`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    reportType: "Advance Training Report",
                    visibleColumns: data.map(row =>
                        Object.fromEntries(
                            visibleColumns.map(c => [c.key, row[c.key] ?? ""])
                        )
                    )
                })
            })

            const json = await res.json()

            if (res.ok) {

                router.push(`/${lang}/apps/download-center`)

            }

        }
    }


    const userStatusObj = {
        "Completed": 'success',
        "In progress": 'info',
        "Not started": 'secondary'
    }

    return (
        <>
            <Box className="flex justify-between mb-3">
                <Typography variant="h6">Advance Training Report</Typography>
                <Box className="flex gap-2">
                    <Button variant="outlined" onClick={onFilterClick}>Filter</Button>
                    <Button variant="contained" onClick={handleExport}>Export</Button>
                </Box>
            </Box>

            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            {visibleColumns.map(col => (
                                <TableCell key={col.key}>{col.label}</TableCell>
                            ))}
                        </TableRow>
                    </TableHead>

                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={visibleColumns.length}>
                                    <Skeleton height={40} />
                                </TableCell>
                            </TableRow>
                        ) : data.length ? (
                            data
                                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                                .map((row, i) => (
                                    <TableRow key={i}>
                                        {visibleColumns.map(col => (
                                            <TableCell key={col.key}>
                                                {
                                                    col.key == "completionStatus" ?

                                                        <Chip
                                                            variant='tonal'
                                                            label={row[col.key]}
                                                            size='small'
                                                            color={userStatusObj[row[col.key]]}
                                                            className='capitalize'
                                                        />
                                                        :
                                                        row[col.key] ?? ""
                                                }
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={visibleColumns.length} align="center">
                                    No data found
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>

                <TablePagination
                    component="div"
                    count={data.length}
                    page={page}
                    onPageChange={(_, p) => setPage(p)}
                    rowsPerPage={rowsPerPage}
                    onRowsPerPageChange={e => {
                        setRowsPerPage(+e.target.value)
                        setPage(0)
                    }}
                />
            </TableContainer>
        </>
    )
}

export default function AdvanceTrainingReport() {

    const { data: session } = useSession()

    const token = session?.user?.token

    const [openFilter, setOpenFilter] = useState(false)

    const [filterData, setFilterData] = useState({
        fromTime: null,
        toTime: null,
        programs: null,
        contentFolders: [],
        modules: [],
        moduleTypes: [],
        attemptType: null,
        columns: ALL_COLUMNS.map(c => c.key)
    })

    return (
        <>
            <DashboardTab
                token={token}
                filterData={filterData}
                onFilterClick={() => setOpenFilter(true)}
            />

            <FilterModal
                token={token}
                open={openFilter}
                onClose={() => setOpenFilter(false)}
                filterData={filterData}
                setFilterData={setFilterData}
            />
        </>
    )
}
