"use client"

import { useEffect, useState, } from "react"

import { useRouter, useParams } from "next/navigation"

import { useSession } from "next-auth/react"

import {
    Box,
    Button,
    Tab,
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

import { TabContext, TabList, TabPanel } from "@mui/lab"

import Grid from "@mui/material/Grid2"

import { getInitials } from '@/utils/getInitials';

import CustomAvatar from '@core/components/mui/Avatar';

import { exportToExcel } from "@/utils/exportToExcel"

import DialogCloseButton from "@/components/dialogs/DialogCloseButton"

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

const getAvatar = params => {
    const { avatar, fullName } = params

    if (avatar) {
        return <CustomAvatar src={`${public_url}/${avatar}`} size={34} />
    } else {
        return <CustomAvatar size={34}>{getInitials(fullName)}</CustomAvatar>
    }
}

const FilterModal = ({ open, onClose, setFilterData, createData, loading }) => {

    const [statusData, setStatusData] = useState("");
    const [sourceData, setSourceData] = useState("");
    const [solutionData, setSolutionData] = useState("");

    const handleClear = () => {
        const clearedFilters = {
            solutionData: "",
            sourceData: "",
            statusData: "",
        };

        setSolutionData("");
        setSourceData("");
        setStatusData("");

        setFilterData(clearedFilters);
    };

    const handleSearch = () => {
        setFilterData({
            solutionData,
            sourceData,
            statusData,
        });
    };

    const SelectSkeleton = () => (
        <Skeleton variant="rectangular" height={40} sx={{ borderRadius: 1 }} />
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
                    value={value || ""}
                    label={label}
                    displayEmpty
                    onChange={(e) => setValue(e.target.value)}
                    renderValue={(selected) => {
                        if (!selected) {
                            return (
                                <span style={{ color: "#9e9e9e" }}>
                                    Select {label}
                                </span>
                            );
                        }

                        const item = options.find((o) => o._id === selected);
                        
                        return item?.title || "";
                    }}
                >
                    {options.map((opt) => (
                        <MenuItem key={opt._id} value={opt._id}>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>

                                {opt?.color && (

                                    <span
                                        style={{
                                            backgroundColor: opt?.color || "#ccc",
                                            inlineSize: "10px",
                                            blockSize: "10px",
                                            borderRadius: "50%",
                                            display: "inline-block",
                                        }}
                                    />

                                )}

                                {opt.title}
                            </div>
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

                            {[...Array(6)].map((_, i) => (
                                <Grid item size={{ xs: 12, md: 4 }} key={i}>
                                    <SelectSkeleton />
                                </Grid>
                            ))}
                        </>
                    ) : (
                        <>



                            {(

                                <>

                                    <Grid item size={{ xs: 12, md: 4 }}>
                                        {renderSelect(
                                            "Lead Status",
                                            statusData,
                                            setStatusData,
                                            createData?.statusData || []
                                        )}
                                    </Grid>

                                    <Grid item size={{ xs: 12, md: 4 }}>
                                        {renderSelect(
                                            "Sources",
                                            sourceData,
                                            setSourceData,
                                            createData?.sourceData || [],
                                            true
                                        )}
                                    </Grid>

                                    <Grid item size={{ xs: 12, md: 4 }}>
                                        {renderSelect(
                                            "Solution",
                                            solutionData,
                                            setSolutionData,
                                            createData?.solutionData || []
                                        )}
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

const ReportHeader = ({
    title,
    onFilterClick,
    onExport,
    createData,
    back = false,
    setModuleTypeModal,
    setFilterData
}) => {

    const router = useRouter();

    const { lang } = useParams()

    const handleBack = () => {
        if (back) {
            // Reset state
            setFilterData({
                solutionData: "",
                sourceData: "",
                statusData: "",
            });
            setModuleTypeModal(false);
        } else {
            // Navigate
            router.push(`/${lang}/apps/my-team`);
        }
    };


    return (


        < Box className="flex justify-between items-center mb-3" >
            <Typography variant="h6">{title}</Typography>
            <Box className="flex gap-2">
                {back && (
                    <Button
                        variant="outlined"
                        onClick={() => {
                            setFilterData({
                                solutionData: "",
                                sourceData: "",
                                statusData: "",
                            });
                            setModuleTypeModal(false);
                        }}
                    >
                        Back
                    </Button>
                )}
                <Button variant="outlined" onClick={handleBack}>
                    Back
                </Button>
                <Button variant="outlined" onClick={onFilterClick}>
                    Filter
                </Button>
                <Button variant="contained" onClick={onExport}>
                    Export To Excel
                </Button>
            </Box>
        </Box >
    )
}

const DashboardTab = ({ onFilterClick, createData, dashboardData, loading }) => {

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
        { label: "Lead", key: (row) => row.name },
        { label: "Phone", key: (row) => row.phone },
        { label: "Lead Status", key: (row) => row?.lead_status?.title || "" },
        {
            label: "Assigned User",
            key: (row) =>
                `${row?.assignedUser?.first_name || ""} ${row?.assignedUser?.last_name || ""}`
        },
        {
            label: "Reporting Manager",
            key: (row) =>
                `${row?.reportingManagerUser?.first_name || ""} ${row?.reportingManagerUser?.last_name || ""}`
        },
        {
            label: "Created At",
            key: (row) =>
                new Date(row?.created_at).toLocaleDateString("en-GB", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                })
        },
    ];

    const handleExport = async () => {

        exportToExcel({
            headers: dashboardHeaders,
            rows: dashboardData,
            fileName: "leads_data.xlsx",
        });

    };

    const paginatedData = (dashboardData ? dashboardData : [])?.slice(
        page * rowsPerPage,
        page * rowsPerPage + rowsPerPage
    );

    return (
        <>
            <ReportHeader title="Leads Data" onFilterClick={onFilterClick} onExport={handleExport} createData={createData} />

            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Lead</TableCell>
                            <TableCell>Phone</TableCell>
                            <TableCell>Lead Status</TableCell>
                            <TableCell>Assigned User</TableCell>
                            <TableCell>Reporting Manager</TableCell>
                            <TableCell>Created At</TableCell>
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
                                    <TableCell>
                                        <div className='flex items-center gap-4'>
                                            {getAvatar({
                                                avatar: "",
                                                fullName: `${item.name}`
                                            })}
                                            <div className='flex flex-col'>
                                                <Typography className='font-medium'>
                                                    {item.name}
                                                </Typography>
                                                <Typography variant='body2'>
                                                    {item.email}
                                                </Typography>
                                            </div>
                                        </div>
                                    </TableCell>

                                    <TableCell>{item?.phone || 0}</TableCell>
                                    <TableCell>
                                        <span
                                            style={{
                                                backgroundColor: item?.lead_status?.color || "#ccc",
                                                inlineSize: "10px",
                                                blockSize: "10px",
                                                borderRadius: "50%",
                                                display: "inline-block",
                                            }}
                                        />
                                        {" "}
                                        {item?.lead_status?.title}
                                    </TableCell>
                                    <TableCell>{item?.assignedUser?.first_name} {item?.assignedUser?.last_name}</TableCell>
                                    <TableCell>{item?.reportingManagerUser?.first_name} {item?.reportingManagerUser?.last_name}</TableCell>
                                    <TableCell>{new Date(item?.created_at).toLocaleDateString("en-GB", {
                                        day: "2-digit",
                                        month: "short",
                                        year: "numeric",
                                    })}</TableCell>
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
                    count={dashboardData?.length}
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

const FollowUpTab = ({ onFilterClick, token, filterData, dashboardData, loading }) => {

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
        { label: "Lead", key: (row) => `${row.lead_data.name} ${row.lead_data.email}` },
        {
            label: "Follow Up Date", key: (row) => {
                {
                    row?.follow_up_date
                        ? new Date(row.follow_up_date).toLocaleDateString("en-GB", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                        })
                        : ""
                }
            }
        },
        { label: "Status", key: (row) => `${row?.status_data?.title || ""}` },
        { label: "Type", key: (row) => `${row?.follow_up_type_data?.title || ""}` },
        { label: "Priority", key: (row) => `${row?.priority_data?.title || ""}` },
        { label: "Created User", key: (row) => `${row?.createdUser?.first_name} ${row?.createdUser?.last_name}` },
        {
            label: "Created At",
            key: (row) => new Date(row.created_at).toLocaleDateString("en-GB", {
                day: "2-digit",
                month: "short",
                year: "numeric",
            })

        }
    ];

    const handleExport = async () => {


        exportToExcel({
            headers,
            rows: dashboardData,
            fileName: "follow_up_data.xlsx",
        });

    };

    const paginatedData = dashboardData?.slice(
        page * rowsPerPage,
        page * rowsPerPage + rowsPerPage
    );

    return (

        <>
            <ReportHeader
                title="Follow Up Data"
                onFilterClick={onFilterClick}
                onExport={handleExport}
            />
            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Lead</TableCell>
                            <TableCell>Follow Up Date</TableCell>
                            <TableCell>Status</TableCell>
                            <TableCell>Type</TableCell>
                            <TableCell>Priority</TableCell>
                            <TableCell>Created User</TableCell>
                            <TableCell>Created at</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {paginatedData && paginatedData.length > 0 ? (
                            paginatedData.map((item, index) => (
                                <TableRow key={index}>
                                    <TableCell>
                                        <div className='flex items-center gap-4'>
                                            {getAvatar({
                                                avatar: "",
                                                fullName: `${item.lead_data.name}`
                                            })}
                                            <div className='flex flex-col'>
                                                <Typography className='font-medium'>
                                                    {item.lead_data.name}
                                                </Typography>
                                                <Typography variant='body2'>
                                                    {item.lead_data.email}
                                                </Typography>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        {item?.follow_up_date
                                            ? new Date(item.follow_up_date).toLocaleDateString("en-GB", {
                                                day: "2-digit",
                                                month: "short",
                                                year: "numeric",
                                            })
                                            : ""}
                                    </TableCell>
                                    <TableCell>{item?.status_data?.title || ""}</TableCell>
                                    <TableCell>{item?.follow_up_type_data?.title}</TableCell>
                                    <TableCell>{item?.priority_data?.title}</TableCell>
                                    <TableCell>{item?.createdUser?.first_name} {item?.createdUser?.last_name}</TableCell>
                                    <TableCell>
                                        {item?.follow_up_date
                                            ? new Date(item.created_at).toLocaleDateString("en-GB", {
                                                day: "2-digit",
                                                month: "short",
                                                year: "numeric",
                                            })
                                            : ""}
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
                    count={dashboardData?.length}
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

const ProposalTab = ({ onFilterClick, token, filterData, dashboardData, loading }) => {

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
        {
            label: "User Name", key: (row) => `${row?.user_id?.first_name}  ${row?.user_id?.last_name}`
        },
        { label: "Recipient", key: (row) => `${row?.email_sent ?? ""}` },
        { label: "Template", key: (row) => `${row?.template_id?.template_name}` },
        {
            label: "Sent Time", key: (row) => new Date(row?.created_at).toLocaleDateString("en-GB", {
                day: "2-digit",
                month: "short",
                year: "numeric",
            })
        },
    ];

    const handleExport = async () => {


        exportToExcel({
            headers,
            rows: dashboardData,
            fileName: "proposal_data.xlsx",
        });

    };


    const paginatedData = dashboardData?.slice(
        page * rowsPerPage,
        page * rowsPerPage + rowsPerPage
    );


    return (

        <>
            <ReportHeader
                title="Proposal Data"
                onFilterClick={onFilterClick}
                onExport={handleExport}
            />
            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>User Name</TableCell>
                            <TableCell>Recipient</TableCell>
                            <TableCell>Template</TableCell>
                            <TableCell>Sent Time</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {(paginatedData && paginatedData.length > 0)
                            ?
                            paginatedData.map((item, index) => (
                                <TableRow key={index}>
                                    <TableCell>
                                        <div className='flex items-center gap-4'>
                                            {getAvatar({
                                                avatar: "",
                                                fullName: `${item?.user_id?.first_name}` + " " + `${item?.user_id?.last_name}`
                                            })}
                                            <div className='flex flex-col'>
                                                <Typography className='font-medium'>
                                                    {`${item?.user_id?.first_name}`} {`${item?.user_id?.last_name}`}
                                                </Typography>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>{item?.email_sent ?? ""}</TableCell>
                                    <TableCell>{item?.template_id?.template_name}</TableCell>
                                    <TableCell>{new Date(item?.created_at).toLocaleDateString("en-GB", {
                                        day: "2-digit",
                                        month: "short",
                                        year: "numeric",
                                    }) || ""}</TableCell>
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
                    count={dashboardData?.length}
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

const MyTeamInfoDashboard = () => {

    const API_URL = process.env.NEXT_PUBLIC_API_URL

    const { id } = useParams();

    const { data: session } = useSession()

    const token = session?.user?.token

    const [loading, setLoading] = useState(true);
    const [isLoading, setIsLoading] = useState(true)
    const [tab, setTab] = useState("leads_data")
    const [openFilter, setOpenFilter] = useState(false)
    const [dashboardData, setDashboardData] = useState([]);
    const [createData, setCreateData] = useState();

    const [filterData, setFilterData] = useState({
        solutionData: "",
        sourceData: "",
        statusData: "",
    })

    const fetchDashboardReport = async () => {
        try {

            const queryParams = new URLSearchParams({
                solution: filterData.solutionData || "",
                source: filterData.sourceData || "",
                status: filterData.statusData || "",
            });

            const response = await fetch(
                `${API_URL}/user/reporting-manager/info/data/${id}?${queryParams.toString()}`,
                {
                    method: "GET",
                    headers: { Authorization: `Bearer ${token}` }
                }
            );

            const value = await response.json();

            if (response.ok) {
                setDashboardData(value?.data || {});
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const fetchCreateData = async () => {
        try {

            const response = await fetch(`${API_URL}/user/leads/create/data`, {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${token}`
                }
            })

            const value = await response.json()

            if (response.ok) {

                setCreateData(value?.data)
            }

        } catch (error) {
            throw new Error(error)
        } finally {

            setIsLoading(false)
        }
    }


    useEffect(() => {
        if (API_URL && token && id) {
            fetchDashboardReport();
        }
    }, [API_URL, token, id, filterData]);

    useEffect(() => {

        if (API_URL && token) {

            fetchCreateData();
        }
    }, [API_URL, token])

    return (
        <>
            <TabContext value={tab}>
                <TabList onChange={(e, v) => setTab(v)} variant="scrollable">
                    <Tab label="Leads" value="leads_data" />
                    <Tab label="Follow Ups" value="follow_up" />
                    <Tab label="Proposal" value="proposal" />
                </TabList>

                <Box className="mt-4">
                    <TabPanel value="leads_data" className="p-0">
                        <DashboardTab
                            onFilterClick={() => setOpenFilter(true)}
                            token={token}
                            loading={loading}
                            createData={createData}
                            dashboardData={dashboardData?.lead}
                            filterData={filterData}
                            setFilterData={setFilterData}
                        />
                    </TabPanel>

                    <TabPanel value="follow_up" className="p-0">
                        <FollowUpTab
                            onFilterClick={() => setOpenFilter(true)}
                            token={token}
                            loading={loading}
                            createData={createData}
                            dashboardData={dashboardData?.followUp}
                            filterData={filterData}
                        />
                    </TabPanel>

                    <TabPanel value="proposal" className="p-0">
                        <ProposalTab
                            onFilterClick={() => setOpenFilter(true)}
                            token={token}
                            createData={createData}
                            dashboardData={dashboardData?.proposal}
                            loading={loading}
                            filterData={filterData}
                        />
                    </TabPanel>
                </Box>
            </TabContext>
            <FilterModal
                tab={tab}
                createData={createData}
                open={openFilter}
                token={token}
                loading={isLoading}
                setFilterData={setFilterData}
                onClose={() => setOpenFilter(false)}
            />
        </>
    )
}

export default MyTeamInfoDashboard
