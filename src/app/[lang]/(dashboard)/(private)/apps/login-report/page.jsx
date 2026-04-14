"use client"

import { useEffect, useState, useMemo } from "react"

import { useRouter, useParams } from "next/navigation"

import { useSession } from "next-auth/react"

import {
    Box,
    Button,
    Tab,
    TablePagination,
    Typography,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Table,
    Skeleton,
    TableBody,
    TableCell,
    CircularProgress,
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

import { LocalizationProvider, DateTimePicker } from "@mui/x-date-pickers";

import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";

import { TabContext, TabList, TabPanel } from "@mui/lab"

import DialogCloseButton from "@/components/dialogs/DialogCloseButton"

import { exportToExcel } from "@/utils/exportToExcel"

const API_URL = process.env.NEXT_PUBLIC_API_URL

const TableSkeletonRow = () => (
    <TableRow>
        <TableCell>
            <Skeleton width="60%" />
        </TableCell>
        <TableCell>
            <Skeleton variant="rectangular" height={20} />
        </TableCell>
        <TableCell>
            <Skeleton width="40%" />
        </TableCell>
        <TableCell>
            <Skeleton width="40%" />
        </TableCell>
        <TableCell>
            <Skeleton width="40%" />
        </TableCell>
        <TableCell>
            <Skeleton width="40%" />
        </TableCell>
        <TableCell>
            <Skeleton width="40%" />
        </TableCell>
        <TableCell>
            <Skeleton width="40%" />
        </TableCell>
    </TableRow>
);

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

const FilterModal = ({ open, onClose, setFilterData, tab, token }) => {

    const [fromTime, setFromTime] = useState(null);
    const [toTime, setToTime] = useState(null);

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

    const handleClear = () => {

        setFromTime(null);
        setToTime(null);

        // setSelectedColumns(allKeys);

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
            columns: [],
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
        });

        onClose();
    };

    const handleFromTimeChange = (newValue) => {

        setFromTime(newValue);

        if (toTime && newValue && newValue.isAfter(toTime)) {
            setToTime(null);
        }
    };

    const handleToTimeChange = (newValue) => {

        if (fromTime && newValue && newValue.isBefore(fromTime)) {
            return;
        }

        setToTime(newValue);
    };

    return (
        <Dialog
            fullWidth maxWidth='lg' scroll='body' open={open} onClose={onClose} sx={{ '& .MuiDialog-paper': { overflow: 'visible' } }}
            PaperProps={{ sx: { m: 0, inlineSize: "100%", borderRadius: 0 } }}
        >
            <DialogCloseButton onClick={onClose}><i className="tabler-x" /></DialogCloseButton>
            <DialogTitle>Filter</DialogTitle>

            <DialogContent dividers>
                <Grid container spacing={2}>
                    {(
                        <>
                            <LocalizationProvider dateAdapter={AdapterDayjs}>
                                <Grid item size={{ xs: 12, md: 4 }}>
                                    <DateTimePicker
                                        label="From Date & Time"
                                        value={fromTime}
                                        onChange={handleFromTimeChange}
                                        maxDateTime={toTime || undefined}
                                        slotProps={{
                                            textField: { fullWidth: true, size: "small" },
                                        }}
                                    />
                                </Grid>

                                <Grid item size={{ xs: 12, md: 4 }}>
                                    <DateTimePicker
                                        label="To Date & Time"
                                        value={toTime}
                                        onChange={handleToTimeChange}
                                        minDateTime={fromTime || undefined}
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
                        </>
                    )}
                </Grid>
            </DialogContent>

            <DialogActions sx={{ mt: 4, justifyContent: "center" }}>
                <Button variant="outlined" onClick={handleClear} >
                    Reset
                </Button>
                <Button variant="contained" onClick={handleSearch}>
                    Search
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

const DashboardTab = ({ onFilterClick, token, filterData, setFilterData }) => {

    const router = useRouter();

    const { lang } = useParams();

    const [dashboardData, setDashboardData] = useState([]);
    const [loading, setLoading] = useState(true);

    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);

    const handleChangePage = (event, newPage) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    const dashboardHeaders = [
        { label: "Full Name", key: "fullName" },
        { label: "Email", key: "email" },
        { label: "User Id", key: "lastestCode" },
        { label: "Phone", key: "phone" },
        { label: "Type", key: "sessionType" },
        { label: "Activity Time", key: "activity_time" },
        { label: "Department", key: "department" },
        { label: "Designation", key: "designation" },
    ];

    const handleExport = async () => {

        if (dashboardData.length <= 2000) {

            exportToExcel({
                headers: dashboardHeaders,
                rows: dashboardData,
                fileName: "quiz_assessment_Report.xlsx",
            });
        } else {

            const res = await fetch(`${API_URL}/company/export/center/create`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    reportType: "Login Report",
                    visibleColumns: dashboardData.map(row =>
                        Object.fromEntries(
                            dashboardHeaders.map(c => [c.key, row[c.key] ?? ""])
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


    const fetchDashboardReport = async () => {
        try {
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

            const response = await fetch(
                `${API_URL}/company/login/report/data?${params.toString()}`,
                {
                    method: "GET",
                    headers: { Authorization: `Bearer ${token}` }
                }
            );

            const value = await response.json();

            if (response.ok) {

                setDashboardData(value?.data || []);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (API_URL && token) fetchDashboardReport();
    }, [API_URL, token, filterData]);

    const paginatedData = dashboardData.slice(
        page * rowsPerPage,
        page * rowsPerPage + rowsPerPage
    );


    return (
        <>
            <ReportHeader title="Login Report" onFilterClick={onFilterClick} onExport={handleExport} />

            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>User Name</TableCell>
                            <TableCell>Email</TableCell>
                            <TableCell>User Id</TableCell>
                            <TableCell>Phone</TableCell>
                            <TableCell>Type</TableCell>
                            <TableCell>Login/LogOut time</TableCell>
                            <TableCell>Department</TableCell>
                            <TableCell>Designation</TableCell>
                        </TableRow>
                    </TableHead>

                    <TableBody>
                        {loading ? (
                            Array.from({ length: 3 }).map((_, index) => (
                                <TableSkeletonRow key={index} />
                            ))
                        ) : paginatedData.length > 0 ? (
                            paginatedData.map((item, index) => (
                                <TableRow key={index}>
                                    <TableCell>{item?.fullName || ""}</TableCell>
                                    <TableCell>{item?.email || ""}</TableCell>
                                    <TableCell>{item?.lastestCode || ""}</TableCell>
                                    <TableCell>{item?.phone || ""}</TableCell>
                                    <TableCell>{item?.sessionType || "LogIn"}</TableCell>
                                    <TableCell>{item?.activity_time ? new Date(item?.activity_time).toLocaleString() : ""}</TableCell>
                                    <TableCell>{item?.department || ""}</TableCell>
                                    <TableCell>{item?.designation || ""}</TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={8} align="center">
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

    const { data: session } = useSession()
    const token = session?.user?.token

    const [tab, setTab] = useState("login")
    const [openFilter, setOpenFilter] = useState(false)

    const [filterData, setFilterData] = useState({
        fromTime: null,
        toTime: null,
        department: "",
        role: "",
        designation: "",
        participationType: "",
    });

    return (
        <>
            <TabContext value={tab}>
                <TabList onChange={(e, v) => setTab(v)} variant="scrollable">
                    <Tab label="LogIn Report" value="login" />
                </TabList>

                <Box className="mt-4">
                    <TabPanel value="login" className="p-0">
                        <DashboardTab
                            onFilterClick={() => setOpenFilter(true)}
                            token={token}
                            filterData={filterData}
                            setFilterData={setFilterData}
                        />
                    </TabPanel>
                </Box>
            </TabContext>
            <FilterModal
                tab={tab}
                open={openFilter}
                token={token}
                setFilterData={setFilterData}
                onClose={() => setOpenFilter(false)}
            />
        </>
    )
}

export default CompletionRatioReport
