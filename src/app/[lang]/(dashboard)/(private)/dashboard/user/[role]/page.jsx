"use client";

import { useEffect, useState } from "react";

import { useSession } from "next-auth/react";

import {
    Box,
    Typography,
    Card,
    CardContent,
    Skeleton,
    Button,
    Divider,
    Table,
    TableHead,
    TableRow,
    TableCell,
    TableBody,
} from "@mui/material";

import Grid from "@mui/material/Grid2";

import {
    ResponsiveContainer,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    LineChart,
    Line,
    Legend,
} from "recharts";

import DateRangeComponent from "@/components/DateRangeDashboardComponent"

export default function Dashboard() {
    const URL = process.env.NEXT_PUBLIC_API_URL;
    const { data: session } = useSession() || {};
    const token = session?.user?.token;

    const [dashboardData, setDashboardData] = useState(null);
    const [page, setPage] = useState(0);

    const [loading, setLoading] = useState(true);

    const [startDate, setStartDate] = useState(null)
    const [endDate, setEndDate] = useState(null)

    const rowsPerPage = 4;

    // ================= DATA =================
    const monthlyData =
        dashboardData?.leadsFinancialYear?.map((l) => ({
            name: l?.month || "N/A",
            total: l?.currentTotalLead || 0,
            converted: l?.isCurrentConvertedLead || 0,
        })) || [];

    const trendData =
        dashboardData?.leadsFinancialYear?.map((l) => ({
            name: l?.month || "N/A",
            leads: l?.currentTotalLead || 0,
            conv: l?.isCurrentConvertedLead || 0,
            ratio: Number(l?.currentConverPerc || 0).toFixed(2),
        })) || [];

    const zonalData =
        dashboardData?.finalZoneLead?.map((z) => ({
            name: z?.zoneName || "N/A",
            leads: z?.totalLead || 0,
            conversions: z?.totalConvert || 0,
        })) || [];

    const tableData =
        dashboardData?.todayLeads?.map((t) => ({
            name: t?.name || "-",
            status: t?.lead_status?.title || "-",
            color: t?.lead_status?.color || "#ccc",
            assigned: `${t?.assignedUser?.first_name || ""} ${t?.assignedUser?.last_name || ""
                }`,
            reporting_manager: `${t?.reportingManagerUser?.first_name || ""} ${t?.reportingManagerUser?.last_name || ""
                }`,
        })) || [];

    const totalRows = tableData.length;
    const totalPages = Math.ceil(totalRows / rowsPerPage);

    const paginatedData = tableData.slice(
        page * rowsPerPage,
        page * rowsPerPage + rowsPerPage
    );

    const fetchDashboardData = async (filters = {}) => {
        try {

            setLoading(true)

            let query = "";

            if (filters.startDate && filters.endDate) {
                query = `?from=${filters.startDate}&to=${filters.endDate}`;
            }

            const res = await fetch(`${URL}/user/dashboard/user/data${query}`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            const data = await res.json();

            if (res.ok) {

                setLoading(false)
                setDashboardData(data?.data);
            }
        } catch (err) {
            console.error(err);
        } finally {

            setLoading(false)
        }
    };

    const handleFilterSubmit = () => {

        const changeData = {
            startDate: startDate
                ? startDate.startOf('day').toISOString()
                : null,
            endDate: endDate
                ? endDate.endOf('day').toISOString()
                : null
        };

        setPage(0);

        fetchDashboardData(changeData);
    };

    useEffect(() => {
        if (URL && token) fetchDashboardData();
    }, [URL, token]);

    if (loading) {
        return (
            <Box sx={{ p: { xs: 1, sm: 2 }, minHeight: "100vh" }}>

                {/* ===== TOP CARDS SKELETON ===== */}
                <Grid container spacing={2}>
                    {[...Array(4)].map((_, i) => (
                        <Grid size={{ xs: 12, sm: 6, md: 3 }} key={i}>
                            <Card sx={{ borderRadius: 3 }}>
                                <CardContent>
                                    <Skeleton variant="rounded" width={40} height={40} />
                                    <Skeleton width="60%" sx={{ mt: 1 }} />
                                    <Skeleton width="40%" height={30} />
                                </CardContent>
                            </Card>
                        </Grid>
                    ))}
                </Grid>

                {/* ===== MAIN GRID SKELETON ===== */}
                <Grid container spacing={2} mt={1}>

                    {/* BAR CHART */}
                    <Grid size={{ xs: 12, md: 5 }}>
                        <Card sx={{ borderRadius: 3 }}>
                            <CardContent>
                                <Skeleton width="50%" />
                                <Skeleton variant="rounded" height={300} sx={{ mt: 2 }} />
                            </CardContent>
                        </Card>
                    </Grid>

                    {/* LINE CHART */}
                    <Grid size={{ xs: 12, md: 4 }}>
                        <Card sx={{ borderRadius: 3 }}>
                            <CardContent>
                                <Skeleton width="40%" />
                                <Skeleton variant="rounded" height={300} sx={{ mt: 2 }} />
                            </CardContent>
                        </Card>
                    </Grid>

                    {/* FILTER + PERFORMANCE */}
                    <Grid size={{ xs: 12, md: 3 }}>
                        <Card sx={{ borderRadius: 3 }}>
                            <CardContent>
                                <Skeleton width="40%" />
                                <Skeleton variant="rounded" height={40} sx={{ mt: 2 }} />
                                <Skeleton variant="rounded" height={40} sx={{ mt: 2 }} />
                                <Skeleton variant="rounded" height={40} sx={{ mt: 2 }} />
                            </CardContent>
                        </Card>

                        <Card sx={{ mt: 2, borderRadius: 3 }}>
                            <CardContent>
                                <Skeleton width="60%" />
                                <Skeleton width="80%" sx={{ mt: 2 }} />
                                <Skeleton width="70%" />
                                <Skeleton width="50%" sx={{ mt: 2 }} />
                                <Skeleton width="60%" />
                            </CardContent>
                        </Card>
                    </Grid>

                    {/* ZONAL PERFORMANCE */}
                    <Grid size={{ xs: 12, md: 5 }}>
                        <Card sx={{ borderRadius: 3 }}>
                            <CardContent>
                                <Skeleton width="50%" />
                                <Skeleton variant="rounded" height={300} sx={{ mt: 2 }} />
                            </CardContent>
                        </Card>
                    </Grid>

                    {/* TABLE */}
                    <Grid size={{ xs: 12, md: 7 }}>
                        <Card sx={{ borderRadius: 3 }}>
                            <CardContent>
                                <Skeleton width="40%" />

                                {[...Array(5)].map((_, i) => (
                                    <Skeleton
                                        key={i}
                                        variant="rounded"
                                        height={30}
                                        sx={{ mt: 1 }}
                                    />
                                ))}
                            </CardContent>
                        </Card>
                    </Grid>

                </Grid>
            </Box>
        );
    }

    return (
        <Box sx={{ p: { xs: 1, sm: 2 }, minHeight: "100vh" }}>

            {/* ===== TOP CARDS ===== */}
            <Grid container spacing={2}>
                {[
                    { label: "Total Leads", value: dashboardData?.totalLead || 0, icon: "tabler-user" },
                    { label: "Converted Clients", value: dashboardData?.totalConverted || 0, icon: "tabler-user-check" },
                    {
                        label: "Conversion %", value: Number(dashboardData?.convertPerc || 0).toFixed(2) == "0.00" ? 0 : Number(dashboardData?.convertPerc).toFixed(2), icon: "tabler-chart-pie"
                    },
                    { label: "Pending Leads", value: dashboardData?.isPending || 0, icon: "tabler-clock" },
                ].map((item, i) => (
                    <Grid size={{ xs: 12, sm: 6, md: 3 }} key={i}>
                        <Card sx={{ borderRadius: 3 }}>
                            <CardContent>
                                {/* Styled Icon */}
                                <Box
                                    sx={{
                                        inlineSize: 40,
                                        blockSize: 40,
                                        borderRadius: "12px",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        backgroundColor: "primary.light",
                                        color: "white",
                                        mb: 1.5,
                                    }}
                                >
                                    <i className={item.icon} style={{ fontSize: 20 }} />
                                </Box>
                                <Typography fontSize={12} color="text.secondary">
                                    {item.label}
                                </Typography>
                                <Typography variant="h5" fontWeight={700}>
                                    {item.value}
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                ))}
            </Grid>

            {/* ===== MAIN GRID ===== */}
            <Grid container spacing={2} mt={1}>

                {/* BAR */}
                <Grid size={{ xs: 12, md: 5 }}>
                    <Card sx={{ borderRadius: 3 }}>
                        <CardContent>
                            <Typography fontWeight={600}>
                                Total Leads vs Converted
                            </Typography>

                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={monthlyData}>
                                    <XAxis dataKey="name" />
                                    <YAxis />
                                    <Tooltip />
                                    <Legend />
                                    <Bar dataKey="total" fill="#2563eb" />
                                    <Bar dataKey="converted" fill="#10b981" />
                                </BarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                </Grid>

                {/* LINE */}
                <Grid size={{ xs: 12, md: 4 }}>
                    <Card sx={{ borderRadius: 3 }}>
                        <CardContent>
                            <Typography fontWeight={600}>Trend</Typography>

                            <ResponsiveContainer width="100%" height={300}>
                                <LineChart data={trendData}>
                                    <XAxis dataKey="name" />
                                    <YAxis />
                                    <Tooltip />
                                    <Legend />
                                    <Line dataKey="leads" stroke="#2563eb" />
                                    <Line dataKey="conv" stroke="#10b981" />
                                    <Line dataKey="ratio" stroke="#94a3b8" />
                                </LineChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                </Grid>

                {/* FILTER + PERFORMANCE */}
                <Grid size={{ xs: 12, md: 3 }}>
                    <Card sx={{ borderRadius: 3 }}>
                        <CardContent>
                            <Typography fontWeight={600} mb={2}>Filters</Typography>

                            <DateRangeComponent
                                startDate={startDate}
                                endDate={endDate}
                                onChange={(start, end) => {

                                    setStartDate(start)
                                    setEndDate(end)
                                }}
                            />

                            <Button
                                fullWidth
                                variant="contained"
                                sx={{ mt: 2 }}
                                onClick={handleFilterSubmit}
                            >
                                Apply Filter
                            </Button>
                        </CardContent>
                    </Card>

                    <Card sx={{ mt: 2, borderRadius: 3 }}>
                        <CardContent>
                            <Typography fontWeight={600}>
                                Performance Insights
                            </Typography>

                            <Typography fontSize={13} mt={2}>
                                Top Performing
                            </Typography>

                            <Typography fontSize={12} color="green">
                                {dashboardData
                                    ? `${dashboardData?.performance?.maxUser?.user?.first_name} ${dashboardData?.performance?.maxUser?.user?.last_name} (${dashboardData?.performance?.maxUser?.totalLeads})`
                                    : "No Data"}
                            </Typography>

                            <Divider sx={{ my: 2 }} />

                            <Typography fontSize={13}>
                                Low Conversion
                            </Typography>

                            <Typography fontSize={12} color="error">
                                {dashboardData
                                    ? `${dashboardData?.performance?.minUser?.user?.first_name} ${dashboardData?.performance?.minUser?.user?.last_name} (${dashboardData?.performance?.minUser?.totalLeads})`
                                    : "No Data"}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>

                {/* CHART */}
                <Grid size={{ xs: 12, md: 5 }}>
                    <Card sx={{ borderRadius: 3 }}>
                        <CardContent>
                            <Typography fontWeight={600}>Zonal Performance</Typography>

                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={zonalData} layout="vertical">
                                    <XAxis type="number" />
                                    <YAxis dataKey="name" type="category" />
                                    <Tooltip />
                                    <Bar dataKey="leads" fill="#10b981" />
                                    <Bar dataKey="conversions" fill="#2563eb" />
                                </BarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                </Grid>

                {/* TABLE */}
                <Grid size={{ xs: 12, md: 7, }} sx={{ height: "400px" }}>
                    <Card sx={{ borderRadius: 3 }}>
                        <CardContent>
                            <Typography fontWeight={600}>
                                Today{`&apos;`}s Lead
                            </Typography>

                            <Table size="small">
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Lead Name</TableCell>
                                        <TableCell>Status</TableCell>
                                        <TableCell>Assigned</TableCell>
                                        <TableCell>Manager</TableCell>
                                    </TableRow>
                                </TableHead>

                                <TableBody>
                                    {paginatedData.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={4} align="center">
                                                No Data Found
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        paginatedData.map((row, i) => (
                                            <TableRow key={i}>
                                                <TableCell>{row.name}</TableCell>

                                                <TableCell>
                                                    <Box
                                                        sx={{
                                                            display: "inline-block",
                                                            width: 10,
                                                            height: 10,
                                                            borderRadius: "50%",
                                                            backgroundColor: row.color,
                                                            mr: 1,
                                                        }}
                                                    />
                                                    {row.status}
                                                </TableCell>

                                                <TableCell>{row.assigned}</TableCell>
                                                <TableCell>{row.reporting_manager}</TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>

                            {totalRows > 0 && (
                                <Box
                                    sx={{
                                        display: "flex",
                                        justifyContent: "space-between",
                                        mt: 2,
                                        flexWrap: "wrap",
                                    }}
                                >
                                    <Typography fontSize={12}>
                                        Showing {page * rowsPerPage + 1}–
                                        {Math.min((page + 1) * rowsPerPage, totalRows)} of{" "}
                                        {totalRows}
                                    </Typography>

                                    <Box>
                                        <Button
                                            size="small"
                                            disabled={page === 0}
                                            onClick={() => setPage((p) => p - 1)}
                                        >
                                            Prev
                                        </Button>

                                        <Button
                                            size="small"
                                            disabled={page >= totalPages - 1}
                                            onClick={() => setPage((p) => p + 1)}
                                        >
                                            Next
                                        </Button>
                                    </Box>
                                </Box>
                            )}
                        </CardContent>
                    </Card>
                </Grid>

            </Grid>
        </Box>
    );
}
