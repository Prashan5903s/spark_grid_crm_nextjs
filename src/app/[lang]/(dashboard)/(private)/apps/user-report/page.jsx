"use client"

import { useEffect, useState, useMemo } from "react"

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

import { LocalizationProvider, DatePicker } from "@mui/x-date-pickers";

import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";

import dayjs from "dayjs"

import DialogCloseButton from "@/components/dialogs/DialogCloseButton"

import { exportToExcel } from "@/utils/exportToExcel"

const API_URL = process.env.NEXT_PUBLIC_API_URL

const ALL_COLUMNS = [
    { label: "Full Name", key: "fullName" },
    { label: "Email", key: "email" },
    { label: "Phone", key: "phone" },
    { label: "DOB", key: "dob" },
    { label: "Employee Code", key: "empCode" },
    { label: "Role Name", key: "roleNames" },
    { label: "Participation Type", key: "particType" },
    { label: "Department", key: "deptName" },
    { label: "Designation", key: "desigName" },
    { label: "Zone", key: "zoneName" },
    { label: "Status", key: "userStatus" },
];

const renderSelect = (label, value, setValue, options, isLocation = false) => {
    const labelId = `${label.replace(/\s+/g, "-")}-label`;

    return (
        <FormControl fullWidth size="small">
            <InputLabel id={labelId} shrink>
                {label}
            </InputLabel>

            <Select
                labelId={labelId}
                value={value}
                label={label}
                onChange={(e) => setValue(e.target.value)}
                renderValue={(selected) => {
                    if (!selected) {
                        return (
                            <span style={{ color: "#9e9e9e" }}>
                                Select {label}
                            </span>
                        );
                    }

                    const item = options.find((o) =>
                        isLocation ? o.state_id === selected : o._id === selected
                    );

                    return isLocation ? item?.state_name : item?.name;
                }}
            >
                {options.map((opt) => (
                    <MenuItem
                        key={isLocation ? opt.state_id : opt._id}
                        value={isLocation ? opt.state_id : opt._id}
                    >
                        {isLocation ? opt.state_name : opt.name}
                    </MenuItem>
                ))}
            </Select>
        </FormControl>
    );
};

const renderRoleSelect = (label, value, setValue, options, isLocation = false) => {
    const labelId = `${label.replace(/\s+/g, "-")}-label`;

    return (
        <FormControl fullWidth size="small">
            <InputLabel id={labelId} shrink>
                {label}
            </InputLabel>

            <Select
                labelId={labelId}
                value={value}
                label={label}
                onChange={(e) => setValue(e.target.value)}
                renderValue={(selected) => {
                    if (!selected) {
                        return (
                            <span style={{ color: "#9e9e9e" }}>
                                Select {label}
                            </span>
                        );
                    }

                    const item = options.find((o) =>
                        isLocation ? o.state_id === selected : o._id === selected
                    );

                    return isLocation ? item?.state_name : item?.name;
                }}
            >
                {options.map((opt) => (
                    <MenuItem
                        key={isLocation ? opt.state_id : opt._id}
                        value={isLocation ? opt.state_id : opt._id}
                    >
                        {isLocation ? opt.state_name : opt.name}
                    </MenuItem>
                ))}
            </Select>
        </FormControl>
    );
};

const FilterModal = ({ open, onClose, setFilterData, filterData, token }) => {

    const [fromTime, setFromTime] = useState(filterData.fromTime);
    const [toTime, setToTime] = useState(filterData.toTime);
    const [selectedColumns, setSelectedColumns] = useState(filterData.columns);

    const [createData, setCreateData] = useState({});
    const [loading, setLoading] = useState(false);

    const [department, setDepartment] = useState("");
    const [role, setRole] = useState("");
    const [region, setRegion] = useState("");
    const [designation, setDesignation] = useState("");
    const [userStatus, setUserStatus] = useState("");
    const [participationType, setParticipationType] = useState("");

    const fetchCreateData = async () => {
        try {
            setLoading(true);

            const response = await fetch(
                `${API_URL}/company/dashboard/filter/data`,
                {
                    method: "GET",
                    headers: { Authorization: `Bearer ${token}` },
                }
            );

            const value = await response.json();

            if (response.ok) {

                setCreateData(value?.data || {});
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (token) fetchCreateData();
    }, [token]);

    const handleColumnToggle = (key) => {
        setSelectedColumns((prev) =>
            prev.includes(key)
                ? prev.filter((c) => c !== key)
                : [...prev, key]
        );
    };

    const handleClear = () => {
        const allKeys = ALL_COLUMNS.map(c => c.key);

        setFromTime(null);
        setToTime(null);
        setSelectedColumns(allKeys);

        setDepartment("");
        setRole("");
        setDesignation("");
        setParticipationType("");

        setFilterData({
            fromTime: null,
            toTime: null,
            department: "",
            role: "",
            designation: "",
            participationType: "",
            columns: allKeys,
        });
    };


    const handleSearch = () => {
        setFilterData({
            fromTime,
            toTime,
            department,
            role,
            designation,
            participationType,
            columns: selectedColumns,
        });

        onClose();
    };

    return (
        <Dialog fullWidth maxWidth='lg' scroll='body' open={open} onClose={onClose} sx={{ '& .MuiDialog-paper': { overflow: 'visible' } }}>
            <DialogCloseButton onClick={onClose}><i className="tabler-x" /></DialogCloseButton>
            <DialogTitle>Filter</DialogTitle>
            <DialogContent dividers>
                <Grid container spacing={3}>
                    <LocalizationProvider dateAdapter={AdapterDayjs}>
                        <Grid item size={{ xs: 12, md: 6 }}>
                            <DatePicker
                                label="From Date"
                                value={fromTime}
                                onChange={(newValue) => setFromTime(newValue)}
                                maxDate={toTime || undefined}
                                slotProps={{
                                    textField: { fullWidth: true, size: "small" },
                                }}
                            />
                        </Grid>

                        <Grid item size={{ xs: 12, md: 6 }}>
                            <DatePicker
                                label="To Date"
                                value={toTime}
                                onChange={(newValue) => setToTime(newValue)}
                                minDate={fromTime || undefined}
                                slotProps={{
                                    textField: { fullWidth: true, size: "small" },
                                }}
                            />
                        </Grid>
                    </LocalizationProvider>

                    <>

                        <Grid item size={{ xs: 12, md: 4 }}>
                            {renderSelect(
                                "Department",
                                department,
                                setDepartment,
                                createData?.department || []
                            )}
                        </Grid>

                        <Grid item size={{ xs: 12, md: 4 }}>
                            {renderSelect(
                                "Role",
                                role,
                                setRole,
                                createData?.role || [],
                                false
                            )}
                        </Grid>

                        <Grid item size={{ xs: 12, md: 4 }}>
                            {renderSelect(
                                "Participation Type",
                                participationType,
                                setParticipationType,
                                createData?.participationType || []
                            )}
                        </Grid>

                        <Grid item size={{ xs: 12, md: 4 }}>
                            {renderSelect(
                                "Designation",
                                designation,
                                setDesignation,
                                createData?.designation || []
                            )}
                        </Grid>
                    </>

                    <Grid item size={{ xs: 12 }}>
                        <Typography variant="subtitle1" sx={{ mb: 1 }}>
                            Select Columns
                        </Typography>

                        <FormGroup row>
                            {ALL_COLUMNS.map((col) => (
                                <FormControlLabel
                                    key={col.key}
                                    control={
                                        <Checkbox
                                            checked={selectedColumns.includes(col.key)}
                                            onChange={() => handleColumnToggle(col.key)}
                                        />
                                    }
                                    label={col.label}
                                />
                            ))}
                        </FormGroup>
                    </Grid>
                </Grid>
            </DialogContent>

            <DialogActions
                sx={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    mt: 4
                }}>
                <Button variant="outlined" onClick={handleClear}>
                    Reset
                </Button>
                <Button variant="contained" onClick={handleSearch}>
                    Apply
                </Button>
            </DialogActions>
        </Dialog>
    );
};

const ReportHeader = ({
    title,
    onFilterClick,
    onExport,
    back = false,
    setModuleTypeModal,
    setFilterData
}) => (
    <Box className="flex justify-between items-center mb-3">
        <Typography variant="h6">{title}</Typography>
        <Box className="flex gap-2">
            {back && (
                <Button
                    variant="outlined"
                    onClick={() => {
                        setFilterData({
                            fromTime: null,
                            toTime: null,
                        });
                        setModuleTypeModal(false);
                    }}
                >
                    Back
                </Button>
            )}
            <Button variant="outlined" onClick={onFilterClick}>
                Filter
            </Button>
            <Button variant="contained" onClick={onExport}>
                Export To Excel
            </Button>
        </Box>
    </Box>
);

const DashboardTab = ({ onFilterClick, token, filterData }) => {

    const router = useRouter();

    const { lang } = useParams();

    const [dashboardData, setDashboardData] = useState([]);
    const [loading, setLoading] = useState(true);

    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);

    const visibleColumns = ALL_COLUMNS.filter((c) =>
        filterData.columns.includes(c.key)
    );

    const handleChangePage = (event, newPage) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    const paginatedData = dashboardData.slice(
        page * rowsPerPage,
        page * rowsPerPage + rowsPerPage
    );

    const handleExport = async () => {

        const visibleColumns = ALL_COLUMNS.filter(col =>
            filterData.columns.includes(col.key)
        );

        const filteredRows = dashboardData.map(row => {
            const obj = {};

            visibleColumns.forEach(col => {
                obj[col.key] =
                    col.key === "userStatus"
                        ? row[col.key] ? "Active" : "Inactive"
                        : row[col.key] ?? "";
            });

            return obj;
        });

        if (filteredRows.length <= 2000) {

            exportToExcel({
                headers: visibleColumns,
                rows: filteredRows,
                fileName: "user_report.xlsx",
            });
        } else {

            const res = await fetch(`${API_URL}/company/export/center/create`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    reportType: "User Report",
                    visibleColumns: filteredRows.map(row =>
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
    };


    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);

            const params = new URLSearchParams();

            if (filterData.fromTime)
                params.append("fromTime", dayjs(filterData.fromTime).toISOString());

            if (filterData.toTime)
                params.append("toTime", dayjs(filterData.toTime).toISOString());

            if (filterData.department)
                params.append("department", filterData.department);

            if (filterData.role)
                params.append("role", filterData.role);

            if (filterData.designation)
                params.append("designation", filterData.designation);

            if (filterData.participationType)
                params.append("participationType", filterData.participationType);

            const res = await fetch(
                `${API_URL}/company/user/report/data?${params.toString()}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            const json = await res.json();

            setDashboardData(json?.data || []);
            setLoading(false);
        };

        if (token) fetchData();
    }, [token, filterData]);

    return (
        <>
            <ReportHeader
                title="User Report"
                onFilterClick={onFilterClick}
                onExport={handleExport}
            />

            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            {visibleColumns.map((col) => (
                                <TableCell key={col.key}>
                                    {col.label}
                                </TableCell>
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
                        ) : paginatedData.length > 0 ? (
                            paginatedData.map((row, rowIndex) => (
                                <TableRow key={rowIndex}>
                                    {visibleColumns.map((col) => (
                                        <TableCell key={col.key}>
                                            {col.key === "userStatus" ? (
                                                row[col.key] ? "Active" : "Inactive"
                                            ) : col.key === "dob" ? (
                                                row[col.key]
                                                    ? dayjs(row[col.key]).format("DD MMM YYYY")
                                                    : ""
                                            ) : col.key === "roleNames" &&
                                                Array.isArray(row[col.key]) ? (
                                                <Stack
                                                    direction="row"
                                                    flexWrap="wrap"
                                                    gap={1}
                                                >
                                                    {row[col.key].map((role, idx) => (
                                                        <Chip
                                                            key={idx}
                                                            label={role}
                                                            size="small"
                                                            variant="outlined"
                                                            sx={{
                                                                backgroundColor: "#f5f7fa",
                                                                borderColor: "#d0d7e2",
                                                                color: "#3a3a3a",
                                                                fontWeight: 500,
                                                            }}
                                                        />
                                                    ))}
                                                </Stack>
                                            ) : (
                                                row[col.key] || ""
                                            )}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell
                                    colSpan={visibleColumns.length}
                                    align="center"
                                >
                                    No data found
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>

                <TablePagination
                    component="div"
                    count={dashboardData.length}
                    page={page}
                    onPageChange={handleChangePage}
                    rowsPerPage={rowsPerPage}
                    onRowsPerPageChange={handleChangeRowsPerPage}
                    rowsPerPageOptions={[5, 10, 25, 50]}
                />
            </TableContainer>
        </>

    );
};

const CompletionRatioReport = () => {
    const { data: session } = useSession();
    const token = session?.user?.token;

    const [openFilter, setOpenFilter] = useState(false);

    const [filterData, setFilterData] = useState({
        fromTime: null,
        toTime: null,
        department: "",
        role: "",
        designation: "",
        participationType: "",
        columns: ALL_COLUMNS.map(c => c.key),
    });

    return (
        <>
            <DashboardTab
                onFilterClick={() => setOpenFilter(true)}
                token={token}
                filterData={filterData}
            />

            <FilterModal
                token={token}
                open={openFilter}
                onClose={() => setOpenFilter(false)}
                filterData={filterData}
                setFilterData={setFilterData}
            />
        </>
    );
};

export default CompletionRatioReport
