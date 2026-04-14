"use client"

import { useEffect, useState } from "react"

import { useRouter, useParams } from "next/navigation"

import { useSession } from "next-auth/react"

import {
    Box,
    Button,
    Tab,
    TablePagination,
    TextField,
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

const FilterModal = ({ open, onClose, setFilterData, tab }) => {

    const [fromTime, setFromTime] = useState(null);
    const [toTime, setToTime] = useState(null);

    const handleClear = () => {
        const clearedFilters = {
            fromTime: null,
            toTime: null,
        };

        setFromTime(null);
        setToTime(null);

        setFilterData(clearedFilters);
    };

    const handleSearch = () => {
        setFilterData({
            fromTime,
            toTime,
        });
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
        { label: "Quiz Name", key: "quizName" },
        { label: "Module Name", key: "moduleName" },
        { label: "Assigned Learner Count", key: "allowerUserCount" },
        { label: "Completed Learner Count", key: "completedPercent" },
        { label: "Passing %", key: "passingPercentage" },
        { label: "Passed Learner Count", key: "passedLearnerCount" },
        { label: "Allowed Re-attempt", key: "attempt" },
        { label: "Lowest %", key: "lowestPercentage" },
        { label: "Highest %", key: "highestPercentage" },
        { label: "Average %", key: "averagePercentage" },
        { label: "Module Type Name", key: "moduleTypeName" },
        { label: "Content Folder Name", key: "contentFolderName" },
        { label: "Program Name", key: "programName" },
    ];

    const handleExport = async () => {

        if (dashboardData?.length <= 2000) {

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
                    reportType: "Quiz Assessment Report",
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
                `${API_URL}/company/quiz/assessment/report${queryString}`,
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
            <ReportHeader title="Quiz Assessment Report" onFilterClick={onFilterClick} onExport={handleExport} />

            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Quiz Name</TableCell>
                            <TableCell>Module Name</TableCell>
                            <TableCell>Assigned Learner Count</TableCell>
                            <TableCell>Completed Learner Count</TableCell>
                            <TableCell>Passing %</TableCell>
                            <TableCell>Passing Learner Count</TableCell>
                            <TableCell>Allowed Re-attempts</TableCell>
                            <TableCell>Lowest %</TableCell>
                            <TableCell>Highes %</TableCell>
                            <TableCell>Average %</TableCell>
                            <TableCell>Module Type Name</TableCell>
                            <TableCell>Content Folder Name</TableCell>
                            <TableCell>ProgramName</TableCell>
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
                                    <TableCell>{item?.quizName || "Objective Quiz"}</TableCell>
                                    <TableCell>{item?.moduleName || ""}</TableCell>
                                    <TableCell>{item?.allowerUserCount || 0}</TableCell>
                                    <TableCell>{item?.completedLearnerCount || 0}</TableCell>
                                    <TableCell>{item?.passingPercentage || 0}</TableCell>
                                    <TableCell>{item?.passedLearnerCount || 0}</TableCell>
                                    <TableCell>{item?.attempt || 0}</TableCell>
                                    <TableCell>{Number(item?.lowestPercentage || 0).toFixed(1)}</TableCell>
                                    <TableCell>{Number(item?.highestPercentage || 0).toFixed(1)}</TableCell>
                                    <TableCell>{Number(item?.averagePercentage || 0).toFixed(1)}</TableCell>
                                    <TableCell>{item?.moduleTypeName || ""}</TableCell>
                                    <TableCell>{item?.contentFolderName || ""}</TableCell>
                                    <TableCell>{item?.programName || ""}</TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={13} align="center">
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

    const [tab, setTab] = useState("objective_quiz")
    const [openFilter, setOpenFilter] = useState(false)

    const [filterData, setFilterData] = useState({
        fromTime: "",
        toTime: "",
    })

    return (
        <>
            <TabContext value={tab}>
                <TabList onChange={(e, v) => setTab(v)} variant="scrollable">
                    <Tab label="Objective Quiz" value="objective_quiz" />
                </TabList>

                <Box className="mt-4">
                    <TabPanel value="objective_quiz" className="p-0">
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
