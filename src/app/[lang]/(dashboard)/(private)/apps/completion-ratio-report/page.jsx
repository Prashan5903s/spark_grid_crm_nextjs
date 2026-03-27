"use client"

import { useEffect, useState, useMemo } from "react"

import { useRouter, useParams } from "next/navigation"

import { useSession } from "next-auth/react"

import {
    Box,
    Button,
    Tab,
    Tooltip,
    TextField,
    Typography,
    TablePagination,
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
    </TableRow>
);

const FilterModal = ({ open, onClose, token, setFilterData, tab }) => {

    const [fromTime, setFromTime] = useState(null);
    const [toTime, setToTime] = useState(null);

    const [department, setDepartment] = useState("");
    const [location, setLocation] = useState("");
    const [region, setRegion] = useState("");
    const [designation, setDesignation] = useState("");
    const [userStatus, setUserStatus] = useState("");
    const [group, setGroup] = useState("");

    const [createData, setCreateData] = useState({});
    const [loading, setLoading] = useState(false);

    const handleClear = () => {
        const clearedFilters = {
            fromTime: null,
            toTime: null,
            location: "",
            region: "",
            designation: "",
            department: "",
            group: "",
            userStatus: "",
        };

        setFromTime(null);
        setToTime(null);
        setDepartment("");
        setLocation("");
        setRegion("");
        setGroup("");
        setDesignation("");
        setUserStatus("");

        setFilterData(clearedFilters);
    };

    const handleSearch = () => {
        setFilterData({
            fromTime,
            toTime,
            location,
            region,
            designation,
            department,
            group,
            userStatus,
        });
    };

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

    const SelectSkeleton = () => (
        <Skeleton variant="rectangular" height={40} sx={{ borderRadius: 1 }} />
    );

    const DateTimeSkeleton = () => (
        <Skeleton variant="rectangular" height={40} sx={{ borderRadius: 1 }} />
    );

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

    return (
        <Dialog
            fullWidth
            maxWidth='lg'
            scroll='body'
            open={open}
            onClose={onClose}
            sx={{ '& .MuiDialog-paper': { overflow: 'visible' } }}
            PaperProps={{ sx: { m: 0, inlineSize: "100%", borderRadius: 0 } }}
        >
            <DialogCloseButton onClick={onClose}><i className="tabler-x" /></DialogCloseButton>
            <DialogTitle>Filter</DialogTitle>

            <DialogContent dividers>
                <Grid container spacing={2}>
                    {loading ? (
                        <>
                            <Grid item size={{ xs: 12, md: 4 }}>
                                <DateTimeSkeleton />
                            </Grid>
                            <Grid item size={{ xs: 12, md: 4 }}>
                                <DateTimeSkeleton />
                            </Grid>

                            {[...Array(6)].map((_, i) => (
                                <Grid item size={{ xs: 12, md: 4 }} key={i}>
                                    <SelectSkeleton />
                                </Grid>
                            ))}
                        </>
                    ) : (
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


                            {tab == "by_learner" && (

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
                                            "Location",
                                            location,
                                            setLocation,
                                            createData?.states || [],
                                            true
                                        )}
                                    </Grid>

                                    <Grid item size={{ xs: 12, md: 4 }}>
                                        {renderSelect(
                                            "Region",
                                            region,
                                            setRegion,
                                            createData?.region || []
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

                                    <Grid item size={{ xs: 12, md: 4 }}>
                                        {renderSelect("User Status", userStatus, setUserStatus, [
                                            { _id: "1", name: "Active" },
                                            { _id: "2", name: "Inactive" },
                                        ])}
                                    </Grid>
                                </>
                            )}
                        </>
                    )}
                </Grid>
            </DialogContent>

            <DialogActions sx={{ mt: 4, justifyContent: "center" }}>
                <Button variant="outlined" onClick={handleClear} disabled={loading}>
                    Reset
                </Button>
                <Button variant="contained" onClick={handleSearch} disabled={loading}>
                    Search
                </Button>
            </DialogActions>
        </Dialog>
    );
};

const CompletionProgress = ({ value }) => {
    return (
        <Box position="relative" display="inline-flex">
            <CircularProgress
                variant="determinate"
                value={value}
                size={40}
                thickness={5}
                sx={{
                    color: value > 0 ? "orange" : "#e0e0e0",
                }}
            />
            <Box
                top={0}
                left={0}
                bottom={0}
                right={0}
                position="absolute"
                display="flex"
                alignItems="center"
                justifyContent="center"
            >
                <Typography variant="caption" component="div">
                    {`${value}%`}
                </Typography>
            </Box>
        </Box>
    );
};

const ProgressLegend = () => {
    const Item = ({ color, label }) => (
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Box
                sx={{
                    width: 12,
                    height: 12,
                    borderRadius: "50%",
                    backgroundColor: color,
                }}
            />
            <Typography variant="body2">{label}</Typography>
        </Box>
    );

    return (
        <Box sx={{ display: "flex", gap: 3 }}>
            <Item color="#D32F2F" label="Not Started Report" />
            <Item color="#FB8C00" label="In Progress Report" />
            <Item color="#2E7D32" label="Completed Report" />
        </Box>
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
                            location: "",
                            region: "",
                            designation: "",
                            department: "",
                            group: "",
                            userStatus: "",
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

const LearnerProgressBar = ({
    notStarted = 0,
    inProgress = 0,
    completed = 0,
    onNotStartedClick,
    onInProgressClick,
    onCompletedClick,
}) => {
    const total = notStarted + inProgress + completed;

    const getPercent = (value) =>
        total === 0 ? 0 : (value / total) * 100;

    return (
        <Box
            sx={{
                display: "flex",
                width: "260px",
                height: 10,
                borderRadius: 5,
                overflow: "hidden",
                backgroundColor: "#eee",
            }}
        >
            <Tooltip
                title={
                    <span>
                        Not Started: {Number(notStarted).toFixed(1)}%
                    </span>
                }
            >
                <Box
                    component="span"
                    onClick={onNotStartedClick}
                    sx={{
                        width: `${getPercent(notStarted)}%`,
                        backgroundColor: "#D32F2F",
                        cursor: "pointer",
                    }}
                />
            </Tooltip>

            <Tooltip
                title={
                    <span>
                        In Progress: {Number(inProgress).toFixed(1)}%
                    </span>
                }
            >
                <Box
                    component="span"
                    onClick={onInProgressClick}
                    sx={{
                        width: `${getPercent(inProgress)}%`,
                        backgroundColor: "#FB8C00",
                        cursor: "pointer",
                    }}
                />
            </Tooltip>

            <Tooltip
                title={
                    <span>
                        Completed: {Number(completed).toFixed(1)}%
                    </span>
                }
            >
                <Box
                    component="span"
                    onClick={onCompletedClick}
                    sx={{
                        width: `${getPercent(completed)}%`,
                        backgroundColor: "#2E7D32",
                        cursor: "pointer",
                    }}
                />
            </Tooltip>
        </Box>
    );
};

const ModuleTypeData = ({
    mTyId,
    status,
    token,
    filterData,
    onFilterClick,
    setFilterData,
    setModuleTypeModal
}) => {

    const [dashboardData, setDashboardData] = useState([]);
    const [loading, setLoading] = useState(true);

    const headers = [
        { label: "User Name", key: "full_name" },
        { label: "Email", key: "email" },
        { label: "Phone", key: "phone" },
        { label: "Module Name", key: "module_title" },
        { label: "Module Status", key: "progress_status" },
        { label: "Address", key: "address" },
        { label: "User ID", key: "latest_code" },
        { label: "Department", key: "department" },
        { label: "Designation", key: "designation" },
        { label: "Status", key: "status" },
    ];

    const handleExport = () => {
        exportToExcel({
            headers,
            rows: dashboardData,
            fileName: "Module_Type_Report.xlsx",
        });
    };

    const fetchDashboardReport = async () => {
        try {
            setLoading(true);

            // Build query string from filterData
            let queryString = "";

            if (filterData && Object.keys(filterData).length > 0) {
                queryString = "?" + new URLSearchParams(filterData).toString();
            }

            const response = await fetch(
                `${API_URL}/company/dashboard/module/type/data/${mTyId}/${status}${queryString}`,
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

    const progreStatus = {
        "1": "Not Started",
        "2": "In Progress",
        "3": "Completed"
    }

    return (
        <>
            <ReportHeader title="Modules" onFilterClick={onFilterClick} back={true} setModuleTypeModal={setModuleTypeModal} setFilterData={setFilterData} onExport={handleExport} />

            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>User Name</TableCell>
                            <TableCell>Email</TableCell>
                            <TableCell> Phone</TableCell>
                            <TableCell>Module name</TableCell>
                            <TableCell>Module status</TableCell>
                            <TableCell>Address</TableCell>
                            <TableCell>User ID</TableCell>
                            <TableCell>Department</TableCell>
                            <TableCell>Designation</TableCell>
                            <TableCell>Status</TableCell>
                        </TableRow>
                    </TableHead>

                    <TableBody>
                        {loading ? (
                            Array.from({ length: 3 }).map((_, index) => (
                                <TableSkeletonRow key={index} />
                            ))
                        ) : dashboardData.length > 0 ? (
                            dashboardData.map((item, index) => (
                                <TableRow key={index}>
                                    <TableCell>{item?.full_name || ""}</TableCell>
                                    <TableCell>{item?.email || ""}</TableCell>
                                    <TableCell>{item?.phone || 0}</TableCell>
                                    <TableCell>{item?.module_title || ""}</TableCell>
                                    <TableCell>{progreStatus?.[item?.progress_status] || "Not started"}</TableCell>
                                    <TableCell>{item?.address || ""}</TableCell>
                                    <TableCell>{item?.latest_code || ""}</TableCell>
                                    <TableCell>{item?.department || ""}</TableCell>
                                    <TableCell>{item?.designation || ""}</TableCell>
                                    <TableCell>{item?.status ? "Active" : "Inactive"}</TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={10} align="center">
                                    No data found
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </TableContainer>
        </>
    )
}

const DashboardTab = ({ onFilterClick, token, filterData, setFilterData }) => {

    const router = useRouter();

    const { lang } = useParams();

    const [dashboardData, setDashboardData] = useState([]);
    const [loading, setLoading] = useState(true);

    const [moduleTypeModal, setModuleTypeModal] = useState(false);
    const [selectedModuleTypeId, setSelectModuleTypeId] = useState()
    const [progressStatus, setProgressStatus] = useState();

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
        { label: "Module Type", key: "moduleTypeName" },
        { label: "Not Started %", key: "notStartedPercent" },
        { label: "In Progress %", key: "inProgressPercent" },
        { label: "Completed %", key: "completedPercent" },
        { label: "Total Modules", key: "totalModules" },
        { label: "Total Enrolled Modules", key: "totalEnrolledModules" },
        { label: "Module Enrollments", key: "moduleEnrollment" },
    ];

    const handleExport = async () => {

        if (dashboardData.length <= 2000) {

            exportToExcel({
                headers: dashboardHeaders,
                rows: dashboardData,
                fileName: "Dashboard_Report.xlsx",
            });
        } else {

            const res = await fetch(`${API_URL}/company/export/center/create`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    reportType: "Dashboard Training Report",
                    visibleColumns: dashboardData.map(row =>
                        Object.fromEntries(
                            dashboardHeaders.map(c => [c.key, row[c.key] ?? ""])
                        )
                    )
                })
            })

            if (res.ok) {

                router.push(`/${lang}/apps/download-center`)

            }

        }
    };


    const fetchDashboardReport = async () => {
        try {
            setLoading(true);

            // Build query string from filterData
            let queryString = "";

            if (filterData && Object.keys(filterData).length > 0) {
                queryString = "?" + new URLSearchParams(filterData).toString();
            }

            const response = await fetch(
                `${API_URL}/company/dashboard/completion/report${queryString}`,
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

    const paginatedData = dashboardData.slice(
        page * rowsPerPage,
        page * rowsPerPage + rowsPerPage
    );

    useEffect(() => {
        if (API_URL && token && !moduleTypeModal) fetchDashboardReport();
    }, [API_URL, token, filterData, moduleTypeModal]);

    if (moduleTypeModal) {

        return (
            <>
                <ModuleTypeData
                    mTyId={selectedModuleTypeId}
                    status={progressStatus}
                    token={token}
                    filterData={filterData}
                    setFilterData={setFilterData}
                    onFilterClick={onFilterClick}
                    setModuleTypeModal={setModuleTypeModal}
                />
            </>
        )
    }

    return (
        <>
            <ReportHeader title="Modules" onFilterClick={onFilterClick} onExport={handleExport} />

            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Module Type</TableCell>
                            <TableCell>
                                Learner Progress Level <ProgressLegend />
                            </TableCell>
                            <TableCell>Total Modules</TableCell>
                            <TableCell>Total Enrolled Modules</TableCell>
                            <TableCell>Module Enrollments</TableCell>
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
                                    <TableCell>{item?.moduleTypeName || "-"}</TableCell>
                                    <TableCell>
                                        <LearnerProgressBar
                                            notStarted={Number(item?.notStartedPercent || 0)}
                                            inProgress={Number(item?.inProgressPercent || 0)}
                                            completed={Number(item?.completedPercent || 0)}
                                            onNotStartedClick={() => {
                                                setProgressStatus("1");
                                                setSelectModuleTypeId(item?.moduleTypeId);
                                                setModuleTypeModal(true);
                                            }}
                                            onInProgressClick={() => {
                                                setProgressStatus("2");
                                                setSelectModuleTypeId(item?.moduleTypeId);
                                                setModuleTypeModal(true);
                                            }}
                                            onCompletedClick={() => {
                                                setProgressStatus("3");
                                                setSelectModuleTypeId(item?.moduleTypeId);
                                                setModuleTypeModal(true);
                                            }}
                                        />
                                    </TableCell>
                                    <TableCell>{item?.totalModules || 0}</TableCell>
                                    <TableCell>{item?.totalEnrolledModules || 0}</TableCell>
                                    <TableCell>{item?.moduleEnrollment || 0}</TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={5} align="center">
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

const ByLearningProgramTab = ({ onFilterClick, token, filterData }) => {

    const router = useRouter();

    const { lang } = useParams();

    const [programData, setProgramData] = useState([]);
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

    const headers = [
        { label: "Program", key: "programTitle" },
        { label: "Total Modules", key: "totalModules" },
        { label: "Completion %", key: "completionPercentage" },
    ];

    const handleExport = async () => {

        if (programData.length <= 2000) {

            exportToExcel({
                headers,
                rows: programData,
                fileName: "Learning_Program_Report.xlsx",
            });
        } else {

            const res = await fetch(`${API_URL}/company/export/center/create`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    reportType: "Learning Program Report",
                    visibleColumns: programData.map(row =>
                        Object.fromEntries(
                            headers.map(c => [c.key, row[c.key] ?? ""])
                        )
                    )
                })
            })

            if (res.ok) {

                router.push(`/${lang}/apps/download-center`)

            }

        }
    };

    const fetchProgramReport = async () => {
        try {
            setLoading(true);

            let queryString = "";

            if (filterData && Object.keys(filterData).length > 0) {
                queryString = "?" + new URLSearchParams(filterData).toString();
            }


            const response = await fetch(
                `${API_URL}/company/dashboard/program/report${queryString}`,
                {
                    method: "GET",
                    headers: { Authorization: `Bearer ${token}` }
                }
            );

            const value = await response.json();

            if (response.ok) {

                setProgramData(value?.data || []);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (API_URL && token) {

            fetchProgramReport();
        }
    }, [API_URL, token, filterData]);

    const paginatedData = programData.slice(
        page * rowsPerPage,
        page * rowsPerPage + rowsPerPage
    );

    return (

        <>
            <ReportHeader
                title="Completion Ratio By Learning Programs"
                onFilterClick={onFilterClick}
                onExport={handleExport}
            />
            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Program</TableCell>
                            <TableCell># Modules</TableCell>
                            <TableCell>Completion Ratio</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {paginatedData && paginatedData.length > 0 ? (
                            paginatedData.map((item, index) => (
                                <TableRow key={index}>
                                    <TableCell>{item?.programTitle || ""}</TableCell>
                                    <TableCell>{item?.totalModules || 0}</TableCell>
                                    <TableCell>
                                        <CompletionProgress value={parseFloat(item?.completionPercentage || 0).toFixed(1)} />
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={3} align="center">
                                    <Typography>No data found</Typography>
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>

                <TablePagination
                    component="div"
                    count={programData.length}
                    page={page}
                    onPageChange={handleChangePage}
                    rowsPerPage={rowsPerPage}
                    onRowsPerPageChange={handleChangeRowsPerPage}
                    rowsPerPageOptions={[5, 10, 25, 50]}
                />

            </TableContainer>
        </>
    )
}

const ByLearnerTab = ({ onFilterClick, token, filterData }) => {

    const router = useRouter();

    const { lang } = useParams();

    const [learnerData, setLearnerData] = useState([]);
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

    const headers = [
        { label: "User Name", key: "fullName" },
        { label: "Email", key: "email" },
        { label: "Status", key: "userStatus" },
        { label: "Total Modules", key: "totalModule" },
        { label: "Completion %", key: "completionPercentage" },
        { label: "Location", key: "countryName" },
    ];

    const handleExport = async () => {

        if (learnerData.length <= 2000) {

            exportToExcel({
                headers,
                rows: learnerData,
                fileName: "Learner_Report.xlsx",
            });
        } else {

            const res = await fetch(`${API_URL}/company/export/center/create`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    reportType: "Learner Report",
                    visibleColumns: learnerData.map(row =>
                        Object.fromEntries(
                            headers.map(c => [c.key, row[c.key] ?? ""])
                        )
                    )
                })
            })

            if (res.ok) {

                router.push(`/${lang}/apps/download-center`)

            }

        }
    };


    const fetchProgramReport = async () => {
        try {
            setLoading(true);

            let queryString = "";

            if (filterData && Object.keys(filterData).length > 0) {
                queryString = "?" + new URLSearchParams(filterData).toString();
            }

            const response = await fetch(
                `${API_URL}/company/dashboard/learner/report${queryString}`,
                {
                    method: "GET",
                    headers: { Authorization: `Bearer ${token}` }
                }
            );

            const value = await response.json();

            if (response.ok) {

                setLearnerData(value?.data || []);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (API_URL && token) {

            fetchProgramReport();
        }
    }, [API_URL, token, filterData]);


    const paginatedData = learnerData.slice(
        page * rowsPerPage,
        page * rowsPerPage + rowsPerPage
    );


    return (

        <>
            <ReportHeader
                title="Completion Data For All Learners"
                onFilterClick={onFilterClick}
                onExport={handleExport}
            />
            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>User Name</TableCell>
                            <TableCell>Email</TableCell>
                            <TableCell>Status</TableCell>
                            <TableCell># Modules</TableCell>
                            <TableCell>Completion</TableCell>
                            <TableCell>Location</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {(paginatedData && paginatedData.length > 0)
                            ?
                            paginatedData.map((item, index) => (
                                <TableRow key={index}>
                                    <TableCell>{item?.fullName || ""}</TableCell>
                                    <TableCell>{item?.email}</TableCell>
                                    <TableCell>{item?.userStatus || "Active"}</TableCell>
                                    <TableCell>{item?.totalModule || 0}</TableCell>
                                    <TableCell><CompletionProgress value={(item?.completionPercentage || 0) == 0 ? 0 : Number(item?.completionPercentage || 0).toFixed(1)} /></TableCell>
                                    <TableCell>{item?.countryName || ""}</TableCell>
                                </TableRow>
                            ))
                            : (
                                <TableRow>
                                    <TableCell colSpan={6} align="center">
                                        No data found
                                    </TableCell>
                                </TableRow>
                            )
                        }
                    </TableBody>
                </Table>

                <TablePagination
                    component="div"
                    count={learnerData.length}
                    page={page}
                    onPageChange={handleChangePage}
                    rowsPerPage={rowsPerPage}
                    onRowsPerPageChange={handleChangeRowsPerPage}
                    rowsPerPageOptions={[5, 10, 25, 50]}
                />

            </TableContainer>
        </>
    )
}

const GenericTableSkeletonRow = ({ columns = 4 }) => (
    <TableRow>
        {Array.from({ length: columns }).map((_, i) => (
            <TableCell key={i}>
                <Skeleton variant="text" width="80%" />
            </TableCell>
        ))}
    </TableRow>
);

const ByModuleTab = ({ onFilterClick, token, filterData }) => {

    const router = useRouter();

    const { lang } = useParams();

    const [moduleReportData, setModuleReportData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");

    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);

    const handleChangePage = (event, newPage) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    const headers = [
        { label: "Module Name", key: "module_name" },
        { label: "Module Type", key: "module_type_name" },
        { label: "Enrollments", key: "enrolledCount" },
        { label: "Status", key: "status" },
    ];

    const handleExport = async () => {

        if (filteredModules.length <= 2000) {

            exportToExcel({
                headers,
                rows: filteredModules,
                fileName: "Module_Report.xlsx",
            });

        } else {

            const res = await fetch(`${API_URL}/company/export/center/create`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    reportType: "Module Training Report",
                    visibleColumns: filteredModules.map(row =>
                        Object.fromEntries(
                            headers.map(c => [c.key, row[c.key] ?? ""])
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

    const fetchModuleReport = async () => {
        try {
            setLoading(true);

            let queryString = "";

            if (filterData && Object.keys(filterData).length > 0) {
                queryString = "?" + new URLSearchParams(filterData).toString();
            }

            const response = await fetch(
                `${API_URL}/company/dashboard/module/report${queryString}`,
                {
                    method: "GET",
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            const value = await response.json();

            if (response.ok) {

                setModuleReportData(value?.data || []);
            }
        } catch (error) {
            console.error("Module report fetch error:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (API_URL && token) {
            fetchModuleReport();
        }
    }, [API_URL, token, filterData]);

    const paginatedData = moduleReportData.slice(
        page * rowsPerPage,
        page * rowsPerPage + rowsPerPage
    );

    const filteredModules = useMemo(() => {
        if (!search) return moduleReportData;

        const keyword = search.toLowerCase();

        return moduleReportData.filter((item) =>
            [
                item?.module_name,
                item?.module_type_name,
                item?.status,
            ]
                .filter(Boolean)
                .some((field) => field.toLowerCase().includes(keyword))
        );
    }, [search, moduleReportData]);

    return (
        <>
            {/* Header */}
            <Box className="flex justify-between items-center mb-4">
                <Box className="flex gap-2 items-center">
                    <i className="tabler-report" />
                    <TextField
                        size="small"
                        placeholder="Search for Modules"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </Box>

                <Box sx={{ display: "flex", gap: 2 }}>
                    <Button variant="outlined" onClick={onFilterClick}>
                        Filter
                    </Button>
                    <Button variant="contained" onClick={handleExport}>
                        Export To Excel
                    </Button>
                </Box>
            </Box>

            {/* Table */}
            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Module Name</TableCell>
                            <TableCell>Type</TableCell>
                            <TableCell>Enrollments</TableCell>
                            <TableCell>Status</TableCell>
                        </TableRow>
                    </TableHead>

                    <TableBody>
                        {loading ? (
                            Array.from({ length: 5 }).map((_, index) => (
                                <GenericTableSkeletonRow key={index} columns={4} />
                            ))
                        ) : paginatedData.length > 0 ? (
                            paginatedData.map((item, index) => (
                                <TableRow key={index}>
                                    <TableCell>{item?.module_name || "-"}</TableCell>
                                    <TableCell>{item?.module_type_name || "-"}</TableCell>
                                    <TableCell>{item?.enrolledCount ?? 0}</TableCell>
                                    <TableCell>{item?.status || "Not Started"}</TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={4} align="center">
                                    No data found
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
                <TablePagination
                    component="div"
                    count={moduleReportData.length}
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

    const [tab, setTab] = useState("dashboard")
    const [openFilter, setOpenFilter] = useState(false)

    const [filterData, setFilterData] = useState({
        fromTime: "",
        toTime: "",
        timePeriod: "",
        location: "",
        region: "",
        designation: "",
        department: "",
        group: "",
        userStatus: ""
    })

    return (
        <>
            <TabContext value={tab}>
                <TabList onChange={(e, v) => setTab(v)} variant="scrollable">
                    <Tab label="Dashboard" value="dashboard" />
                    <Tab label="By Learning Programs" value="by_learning_program" />
                    <Tab label="By Learner" value="by_learner" />
                    <Tab label="By Modules" value="by_module" />
                </TabList>

                <Box className="mt-4">
                    <TabPanel value="dashboard" className="p-0">
                        <DashboardTab
                            onFilterClick={() => setOpenFilter(true)}
                            token={token}
                            filterData={filterData}
                            setFilterData={setFilterData}
                        />
                    </TabPanel>

                    <TabPanel value="by_learning_program" className="p-0">
                        <ByLearningProgramTab
                            onFilterClick={() => setOpenFilter(true)}
                            token={token}
                            filterData={filterData}
                        />
                    </TabPanel>

                    <TabPanel value="by_learner" className="p-0">
                        <ByLearnerTab
                            onFilterClick={() => setOpenFilter(true)}
                            token={token}
                            filterData={filterData}
                        />
                    </TabPanel>

                    <TabPanel value="by_module" className="p-0">
                        <ByModuleTab
                            onFilterClick={() => setOpenFilter(true)}
                            token={token}
                            filterData={filterData}
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
