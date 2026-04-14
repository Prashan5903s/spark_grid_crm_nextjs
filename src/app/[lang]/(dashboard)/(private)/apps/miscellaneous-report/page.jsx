'use client'

import { useState, useEffect, useMemo } from "react";

import { useRouter, useParams } from "next/navigation"

import { useSession } from "next-auth/react";

import {
    Box,
    Card,
    Popover,
    CardContent,
    Typography,
    TextField,
    MenuItem,
    Divider,
    Stack,
    TableContainer,
    Paper,
    Table,
    TableHead,
    TableRow,
    TableCell,
    TableBody,
    Button,
    Skeleton,
    TablePagination,
    Tab
} from "@mui/material"

import dayjs from "dayjs";

import { TabContext, TabPanel, TabList } from "@mui/lab";

import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";

import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";

import { DateCalendar } from "@mui/x-date-pickers/DateCalendar";

import Grid from "@mui/material/Grid2"

import { exportToExcel } from "@/utils/exportToExcel"

const API_URL = process.env.NEXT_PUBLIC_API_URL

const LOCKED_ATTRIBUTES = ["userName", "activityName", "fullName", "moduleName"];

const reportAttributes = [
    { label: "Participant Name", key: "fullName", defaultChecked: true },
    { label: "User Email", key: "userEmail" },
    { label: "User Id", key: "userName", defaultChecked: true },
    { label: "Quiz Name", key: "activityName", defaultChecked: true },
    { label: "Program Name", key: "programName" },
    { label: "Content folder Name", key: "contentFolderName" },
    { label: "Module Name", key: "moduleName", defaultChecked: true },
    { label: "Date of Attempt", key: "attemptDate" },
    { label: "Date of Completion", key: "completionTime" },
    { label: "Score Percentage", key: "markPercent" },
    { label: "Time Taken", key: "duration" },
    { label: "Total Questions", key: "totalQuestion" },
    { label: "Questions Attempted", key: "attemptQuestion" },
    { label: "Questions Right", key: "correctQuestion" },
    { label: "Re-Attempts Count", key: "current_attempt" },
    { label: "Location name", key: "locationName" },
    { label: "Department name", key: "departmentName" },
    { label: "Designation name", key: "designationName" },
    { label: "Group name", key: "groupName" },
    { label: "Region name", key: "regionName" },
    { label: "Result", key: "passedStatus" },
    { label: "Completion Status", key: "completionStatus" },
    { label: "User Status", key: "userStatus" },
];



const ReportHeader = ({
    title,
    onExport,
    setIsShowFilter,
    isShowFilter,
    setFilterData,
    setStartDate,
    setEndDate
}) => (
    <Box className="flex justify-between items-center mb-3">
        <Typography variant="h6">{title}</Typography>
        <Box className="flex gap-2">
            {isShowFilter && (
                <Button
                    variant="outlined"
                    onClick={() => {

                        setStartDate(null)
                        setEndDate(null)

                        setFilterData({
                            userStatus: [],
                            result: [],
                            completionStatus: [],
                            programName: "",
                            contentFolder: [],
                            module: [],
                            designation: [],
                            location: [],
                            department: [],
                            group: [],
                            region: [],
                            startDate: null,
                            endDate: null,
                        });

                        setIsShowFilter(false);

                    }}
                >
                    Back
                </Button>
            )}
            <Button variant="contained" onClick={onExport}>
                Export To Excel
            </Button>
        </Box>
    </Box>
);

const DashboardTab = ({ onFilterClick, token, filterData, setFilterData, isShowFilter, setIsShowFilter, setStartDate, setEndDate }) => {

    const router = useRouter();

    const { lang } = useParams();

    const [dashboardData, setDashboardData] = useState([]);
    const [loading, setLoading] = useState(true);

    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);

    const handleChangePage = (event, newPage) => {
        setPage(newPage);
    };

    const visibleAttributes = useMemo(() => {
        if (!filterData?.allowedFields?.length) return reportAttributes;

        return reportAttributes.filter(attr =>
            filterData.allowedFields.includes(attr.key)
        );
    }, [filterData.allowedFields]);

    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    const handleExport = async () => {

        if (dashboardData.length <= 2000) {

            exportToExcel({
                headers: visibleAttributes,
                rows: dashboardData,
                fileName: "miscellaneous_report.xlsx",
            });
        } else {

            const res = await fetch(`${API_URL}/company/export/center/create`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    reportType: "Miscellaneous Report",
                    visibleColumns: dashboardData.map(row =>
                        Object.fromEntries(
                            visibleAttributes.map(c => [c.key, row[c.key] ?? ""])
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

            if (filterData.startDate)
                params.append("startTime", dayjs(filterData.startDate).toISOString());

            if (filterData.endDate)
                params.append("endTime", dayjs(filterData.endDate).toISOString());

            if (filterData.department)
                params.append("department", filterData.department);

            if (filterData.group)
                params.append("group", filterData.group);

            if (filterData.designation)
                params.append("designation", filterData.designation);

            if (filterData.contentFolder)
                params.append("contentFolder", filterData.contentFolder);

            if (filterData.location)
                params.append("location", filterData.location)

            if (filterData.module)
                params.append("module", filterData.module)

            if (filterData.region)
                params.append("region", filterData.region)

            if (filterData.result)
                params.append("result", filterData.result)

            if (filterData.userStatus)
                params.append("userStatus", filterData.userStatus)

            if (filterData.programName)
                params.append("programName", filterData.programName)

            if (filterData.completionStatus)
                params.append("completionStatus", filterData.completionStatus)

            const response = await fetch(
                `${API_URL}/company/dashboard/miscellaneous/report?${params.toString()}`,
                {
                    method: "GET",
                    headers: { Authorization: `Bearer ${token}` }
                }
            );

            const value = await response.json();

            if (response.ok) {

                console.log("Data", value.data);

                setDashboardData(value?.data || []);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (API_URL && token) {
            fetchDashboardReport();
        }
    }, [API_URL, token, filterData]);

    const paginatedData = dashboardData.slice(
        page * rowsPerPage,
        page * rowsPerPage + rowsPerPage
    );

    const TableSkeletonRow = ({ visibleAttributes = [] }) => (
        <TableRow>
            {visibleAttributes.map((attr, index) => (
                <TableCell key={attr?.key || index}>
                    <Skeleton width="60%" />
                </TableCell>
            ))}
        </TableRow>
    );

    return (
        <>
            <ReportHeader title="Miscellaneous Report" onFilterClick={onFilterClick} onExport={handleExport} isShowFilter={isShowFilter} setFilterData={setFilterData} setIsShowFilter={setIsShowFilter} setStartDate={setStartDate} setEndDate={setEndDate} />
            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            {visibleAttributes.map(attr => (
                                <TableCell key={attr.key}>{attr.label}</TableCell>
                            ))}
                        </TableRow>
                    </TableHead>

                    <TableBody>
                        {loading ? (
                            Array.from({ length: 3 }).map((_, index) => (
                                <TableSkeletonRow
                                    key={`skeleton-${index}`}
                                    visibleAttributes={visibleAttributes}
                                />
                            ))
                        )
                            : paginatedData.length > 0 ? (
                                paginatedData.map((item, index) => (
                                    <TableRow key={index}>
                                        {visibleAttributes.map(attr => {
                                            let value = item?.[attr.key];

                                            // Optional formatting
                                            if (attr.key === "activity_time" && value) {
                                                value = new Date(value).toLocaleString();
                                            }

                                            return (
                                                <TableCell key={attr.key}>
                                                    {value ?? ""}
                                                </TableCell>
                                            );
                                        })}
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={visibleAttributes.length} align="center">
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

const MiscellaneousReport = () => {

    const { data: session } = useSession();
    const token = session?.user?.token;

    const [isShowFilter, setIsShowFilter] = useState(false);
    const [tab, setTab] = useState("login");
    const [anchorEl, setAnchorEl] = useState(null);

    const [startDate, setStartDate] = useState(null);
    const [endDate, setEndDate] = useState(null);

    const [createData, setCreateData] = useState({});
    const [loading, setLoading] = useState(true);

    const [filterData, setFilterData] = useState({
        allowedFields: [],
        userStatus: [],
        result: [],
        completionStatus: [],
        programName: "",
        contentFolder: [],
        module: [],
        designation: [],
        location: [],
        department: [],
        group: [],
        region: [],
        startDate: null,
        endDate: null,
    });

    const fetchCreateData = async () => {
        try {
            const res = await fetch(`${API_URL}/company/dashboard/filter/data`, {
                method: "GET",
                headers: { Authorization: `Bearer ${token}` },
            });

            const json = await res.json();

            if (res.ok) setCreateData(json?.data || {});
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (token) fetchCreateData();
    }, [token]);

    const options = [
        ["userStatus", "User Status", [{ _id: true, title: "Active" }, { _id: false, title: "Inactive" }], true],
        ["result", "Result", [{ _id: true, title: "Passed" }, { _id: false, title: "Not Passed" }], true],
        [
            "completionStatus",
            "Completion Status",
            [
                { _id: "1", title: "Not started" },
                { _id: "2", title: "In progress" },
                { _id: '3', title: "Completed" },
            ],
            true,
        ],
        ["programName", "Program Name", createData?.program || [], false],
        ["contentFolder", "Content Folder Name", createData?.contentFolder || [], true],
        ["module", "Module Name", createData?.module || [], true],
    ];

    const metaOptions = [
        ["designation", "Designation", createData?.designation || [], true],
        ["location", "Location", createData?.states || [], true],
        ["department", "Department", createData?.department || [], true],
        ["group", "Group", createData?.group || [], true],
        ["region", "Region", createData?.region || [], true],
    ];

    const [selectedAttributes, setSelectedAttributes] = useState(
        reportAttributes.filter((a) => a.defaultChecked).map((a) => a.key)
    );

    const displayValue =
        startDate && endDate
            ? `${dayjs(startDate).format("DD/MM/YYYY")} - ${dayjs(endDate).format("DD/MM/YYYY")}`
            : "";

    const handleMultiSelectChange = (key, items, multiple) => (e) => {
        let value = e.target.value || (multiple ? [] : "");

        if (Array.isArray(value) && value.includes("all")) {

            const allValues = items.map((i) => i._id);
            const allSelected = allValues.every((v) => filterData[key]?.includes(v));

            setFilterData((prev) => ({
                ...prev,
                [key]: allSelected ? [] : allValues,
            }));

            return;
        }

        setFilterData((prev) => ({ ...prev, [key]: value }));
    };

    const renderSelectValue = (selected, items, multiple) => {

        if (!selected || (Array.isArray(selected) && selected.length === 0)) return "";

        if (multiple) {

            return selected
                .filter((v) => v !== "all")
                .map((id) => items.find((i) => i._id === id)?.title || "")
                .join(", ");
        }

        return items.find((i) => i._id === selected)?.title || "";
    };

    useEffect(() => {
        setFilterData((prev) => ({
            ...prev,
            allowedFields: selectedAttributes,
        }));
    }, [selectedAttributes]);

    const renderMultiSelectItems = (key, items, multiple) => {
        const allSelected = items.every((i) => filterData[key]?.includes(i._id));

        return [
            <MenuItem key="all" value="all">
                {multiple && <input type="checkbox" checked={allSelected} readOnly />}
                <Typography ml={1}>Select All</Typography>
            </MenuItem>,
            ...items.map((item) => (
                <MenuItem key={item._id} value={item._id}>
                    {multiple && <input type="checkbox" checked={filterData[key]?.includes(item._id)} readOnly />}
                    <Typography ml={1}>{item.title || item.name || item.state_name}</Typography>
                </MenuItem>
            )),
        ];
    };

    if (!isShowFilter) {
        return (
            <Box p={3} bgcolor="#f6f7f9">

                <Card sx={{ mb: 3 }}>
                    <CardContent>
                        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                            <Typography fontWeight={600}>Report Attributes</Typography>
                            <Stack direction="row" spacing={1} alignItems="center">
                                <input
                                    type="checkbox"
                                    checked={reportAttributes.filter((a) => !LOCKED_ATTRIBUTES.includes(a.key)).every((a) => selectedAttributes.includes(a.key))}
                                    onChange={(e) => {
                                        if (e.target.checked) {
                                            const allKeys = reportAttributes.map((a) => a.key);

                                            setSelectedAttributes(allKeys);
                                        } else {
                                            setSelectedAttributes([...LOCKED_ATTRIBUTES]);
                                        }
                                    }}
                                />
                                <Typography>Select All</Typography>
                            </Stack>
                        </Stack>

                        <Grid container spacing={2}>
                            {reportAttributes.map((attr) => {
                                const locked = LOCKED_ATTRIBUTES.includes(attr.key);

                                return (
                                    <Grid item size={{ xs: 12, sm: 6, md: 3 }} key={attr.key}>
                                        <Stack direction="row" spacing={1} alignItems="center">
                                            <input
                                                type="checkbox"
                                                checked={locked || selectedAttributes.includes(attr.key)}
                                                disabled={locked}
                                                onChange={(e) =>
                                                    setSelectedAttributes((prev) =>
                                                        e.target.checked ? [...prev, attr.key] : prev.filter((k) => k !== attr.key)
                                                    )
                                                }
                                            />
                                            <Typography color={locked ? "text.secondary" : "text.primary"}>{attr.label}</Typography>
                                        </Stack>
                                    </Grid>
                                );
                            })}
                        </Grid>
                    </CardContent>
                </Card>

                <Card sx={{ mb: 3 }}>
                    <CardContent>
                        <Typography fontWeight={600} mb={2}>
                            Report Inputs
                        </Typography>
                        <Grid container spacing={2}>
                            {options.map(([key, label, items, multiple]) => (
                                <Grid item size={{ xs: 12, sm: 6, md: 3 }} key={key}>
                                    {loading ? (
                                        <Skeleton height={40} />
                                    ) : (
                                        <TextField
                                            select
                                            fullWidth
                                            size="small"
                                            label={label}
                                            value={multiple ? filterData[key] || [] : filterData[key] ?? ""}
                                            SelectProps={{
                                                multiple,
                                                renderValue: (selected) => renderSelectValue(selected, items, multiple),
                                            }}
                                            onChange={handleMultiSelectChange(key, items, multiple)}
                                        >
                                            {multiple && renderMultiSelectItems(key, items, multiple)}
                                            {!multiple &&
                                                items.map((item) => (
                                                    <MenuItem key={item._id} value={item._id}>
                                                        {item.title}
                                                    </MenuItem>
                                                ))}
                                        </TextField>
                                    )}
                                </Grid>
                            ))}
                        </Grid>
                    </CardContent>
                </Card>

                <Card sx={{ mb: 3 }}>
                    <CardContent>
                        <Typography fontWeight={600} mb={2}>
                            Time Period
                        </Typography>
                        <LocalizationProvider dateAdapter={AdapterDayjs}>
                            <TextField
                                size="small"
                                label="Enrollment Date"
                                value={displayValue}
                                InputProps={{ readOnly: true }}
                                onClick={(e) => setAnchorEl(e.currentTarget)}
                            />
                            <Popover open={Boolean(anchorEl)} anchorEl={anchorEl} onClose={() => setAnchorEl(null)}>
                                <Stack direction="row" p={2} spacing={2}>
                                    <DateCalendar
                                        value={startDate}
                                        onChange={(value) => {

                                            setStartDate(value);
                                            setFilterData((prev) => ({ ...prev, startDate: value }));
                                        }}
                                    />
                                    <DateCalendar
                                        value={endDate}
                                        minDate={startDate}
                                        onChange={(value) => {

                                            setEndDate(value);
                                            setFilterData((prev) => ({ ...prev, endDate: value }));
                                        }}
                                    />
                                </Stack>
                            </Popover>
                        </LocalizationProvider>
                    </CardContent>
                </Card>

                <Card sx={{ mb: 3 }}>
                    <CardContent>
                        <Typography fontWeight={600} mb={2}>
                            Report Inputs
                        </Typography>
                        <Grid container spacing={2}>
                            {metaOptions.map(([key, label, items, multiple]) => {

                                const normalizedItems = items.map((i) => ({ ...i, _id: label === "Location" ? i.state_id : i._id }));

                                return (
                                    <Grid item size={{ xs: 12, sm: 6, md: 3 }} key={key}>
                                        {loading ? (
                                            <Skeleton height={40} />
                                        ) : (
                                            <TextField
                                                select
                                                fullWidth
                                                size="small"
                                                label={label}
                                                value={multiple ? filterData[key] || [] : filterData[key] ?? ""}
                                                SelectProps={{
                                                    multiple,
                                                    renderValue: (selected) => {
                                                        if (!selected || selected.length === 0) return "";

                                                        return selected
                                                            .filter((v) => v !== "all")
                                                            .map((id) => (normalizedItems.find((i) => i._id === id)?.title || normalizedItems.find((i) => i._id === id)?.name || normalizedItems.find((i) => i._id === id)?.state_name))
                                                            .join(", ");
                                                    },
                                                }}
                                                onChange={handleMultiSelectChange(key, normalizedItems, multiple)}
                                            >
                                                {multiple && renderMultiSelectItems(key, normalizedItems, multiple)}
                                                {!multiple &&
                                                    normalizedItems.map((item) => (
                                                        <MenuItem key={item._id} value={item._id}>
                                                            {item.title || item.name || item.state_name}
                                                        </MenuItem>
                                                    ))}
                                            </TextField>
                                        )}
                                    </Grid>
                                );
                            })}
                        </Grid>
                    </CardContent>
                </Card>

                <Divider sx={{ my: 3 }} />

                <Stack direction="row" justifyContent="center" spacing={2}>
                    <Button
                        variant="outlined"
                        onClick={() => {
                            setStartDate(null);
                            setEndDate(null);
                            setFilterData({
                                userStatus: [],
                                result: [],
                                completionStatus: [],
                                programName: "",
                                contentFolder: [],
                                module: [],
                                designation: [],
                                location: [],
                                department: [],
                                group: [],
                                region: [],
                                startDate: null,
                                endDate: null,
                            });
                        }}
                    >
                        Clear All
                    </Button>
                    <Button variant="contained" onClick={() => setIsShowFilter(true)}>
                        Generate
                    </Button>
                </Stack>
            </Box>
        );
    }

    return (
        <TabContext value={tab}>
            <TabList onChange={(e, v) => setTab(v)}>
                <Tab label="Miscellaneous Report" value="login" />
            </TabList>

            <TabPanel value="login" sx={{ p: 0, mt: 2 }}>
                <DashboardTab
                    token={token}
                    filterData={filterData}
                    setFilterData={setFilterData}
                    isShowFilter={isShowFilter}
                    setIsShowFilter={setIsShowFilter}
                    setStartDate={setStartDate}
                    setEndDate={setEndDate}
                />
            </TabPanel>
        </TabContext>
    );
};

export default MiscellaneousReport;
