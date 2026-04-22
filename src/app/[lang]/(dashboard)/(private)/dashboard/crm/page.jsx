"use client";

import React, { useEffect, useState } from "react";

import { useParams } from "next/navigation";

import {
  Box,
  Card,
  CardContent,
  Typography,
  Avatar,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  Chip,
} from "@mui/material";

import Grid from "@mui/material/Grid2";

import {
  BarChart3,
  Users,
  DollarSign,
  Package
} from "lucide-react";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  Legend,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from "recharts";

import PermissionGuardClient from "@/hocs/PermissionClientGuard";

// Data
const salesData = [
  { name: "Jul", value: 5 },
  { name: "Aug", value: 20 },
  { name: "Sep", value: 25 },
  { name: "Oct", value: 18 },
  { name: "Nov", value: 22 },
  { name: "Dec", value: 24 },
];

const leadData = [
  { name: "Jul", a: 5, b: 6 },
  { name: "Aug", a: 12, b: 10 },
  { name: "Sep", a: 15, b: 18 },
  { name: "Oct", a: 10, b: 8 },
  { name: "Nov", a: 13, b: 15 },
  { name: "Dec", a: 14, b: 14 },
];

const pieData = [
  { name: "Enterprise Customer", value: 30, color: "#3b82f6" },
  { name: "Prospect", value: 20, color: "#22c55e" },
  { name: "Reseller/Channel", value: 25, color: "#f59e0b" },
  { name: "SMB Customer", value: 15, color: "#ef4444" },
  { name: "Strategic Partner", value: 10, color: "#8b5cf6" },
];

const renderLegend = (props) => {
  const { payload } = props;

  return (
    <Box
      sx={{
        display: "flex",
        flexWrap: "wrap",
        justifyContent: "center",
        gap: 2,
        mt: 2,
      }}
    >
      {payload.map((entry, index) => (
        <Box key={`item-${index}`} sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Box
            sx={{
              inlineSize: 10,
              blockSize: 10,
              borderRadius: "50%",
              backgroundColor: entry.color,
            }}
          />
          <Typography variant="body2">{entry.value}</Typography>
        </Box>
      ))}
    </Box>
  );
};

// Stat Card
const StatCard = ({ title, value, icon }) => (
  <Card sx={{ borderRadius: 3 }}>
    <CardContent sx={{ display: "flex", justifyContent: "space-between" }}>
      <Box>
        <Typography variant="body2" color="text.secondary">
          {title}
        </Typography>
        <Typography variant="h5" fontWeight={700}>
          {value}
        </Typography>
      </Box>
      <Avatar sx={{ bgcolor: "primary.main", color: "white" }}>{icon}</Avatar>
    </CardContent>
  </Card>
);

export default function DashboardUI() {

  const [mounted, setMounted] = useState(false);

  const { lang } = useParams();

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <PermissionGuardClient locale={lang} element="notUser">

      <Box sx={{ p: 4, bgcolor: "#f5f7fb", minHeight: "100vh" }}>

        {/* Top Stats */}
        <Grid container spacing={3} mb={3}>
          {[
            { title: "Total Employees", value: 88, icon: <Users size={20} /> },
            { title: "Total Leads", value: 35, icon: <BarChart3 size={20} /> },
            { title: "Total Sales", value: 16, icon: <DollarSign size={20} /> },
            { title: "Total Projects", value: 18, icon: <Package size={20} /> },
          ].map((item, i) => (
            <Grid size={{ xs: 12, sm: 6, md: 3 }} key={i}>
              <StatCard {...item} />
            </Grid>
          ))}
        </Grid>

        {/* Sales Chart */}
        <Grid container spacing={3} mb={3}>
          <Grid size={{ xs: 12, md: 8 }}>
            <Card>
              <CardContent>
                <Typography variant="h6" mb={2}>
                  Sales Trends
                </Typography>

                <Box sx={{ blockSize: 250, inlineSize: "100%", minWidth: 0 }}>
                  {mounted && (
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={salesData}>
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Line
                          type="monotone"
                          dataKey="value"
                          stroke="#3b82f6"
                          strokeWidth={3}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  )}
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, md: 4 }}>
            <Card sx={{ blockSize: 328, inlineSize: "100%" }}>
              <CardContent>
                <Typography variant="h6">Storage Usage</Typography>
                <LinearProgress
                  variant="determinate"
                  value={25}
                  sx={{ blockSize: 8, borderRadius: 5, mt: 2 }}
                />
                <Typography mt={1}>25% used</Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Middle Charts */}
        <Grid container spacing={3} mb={3}>
          <Grid size={{ xs: 12, md: 6 }}>
            <Card>
              <CardContent>
                <Typography variant="h6">Lead Conversion</Typography>

                <Box sx={{ blockSize: 250, inlineSize: "100%", minWidth: 0 }}>
                  {mounted && (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={leadData}>
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="a" fill="#60a5fa" />
                        <Bar dataKey="b" fill="#34d399" />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <Card>
              <CardContent>
                <Typography variant="h6">Customer Distribution</Typography>

                <Box sx={{ blockSize: 250, inlineSize: "100%", minWidth: 0 }}>
                  {mounted && (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={pieData} dataKey="value" innerRadius={50}>
                          {pieData.map((n, i) => (
                            <Cell key={i} fill={n.color} />
                          ))}
                        </Pie>

                        <Tooltip />

                        <Legend
                          verticalAlign="bottom"
                          align="center"
                          content={renderLegend}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Lists */}
        <Grid container spacing={3} mb={3}>
          <Grid size={{ xs: 12, md: 6 }}>
            <Card>
              <CardContent>
                <Typography variant="h6">Latest Leads</Typography>
                <List>
                  {["Michael Scott", "Pam Beesly", "Jim Halpert", "Dwight Schrute"].map((name, i) => (
                    <ListItem key={i}>
                      <ListItemText primary={name} />
                      <Chip label="New" color="success" size="small" />
                    </ListItem>
                  ))}
                </List>
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <Card>
              <CardContent>
                <Typography variant="h6">Recent Sales</Typography>
                <List>
                  {["Website Development", "Mobile App", "Cloud Setup", "SEO Package"].map((item, i) => (
                    <ListItem key={i}>
                      <ListItemText primary={item} />
                      <Chip label="Completed" color="primary" size="small" />
                    </ListItem>
                  ))}
                </List>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Bottom */}
        <Card>
          <CardContent>
            <Typography variant="h6">Recent Announcements</Typography>
            <List>
              {["Holiday Schedule", "New Features Released", "Performance Improvements"].map(
                (text, i) => (
                  <ListItem key={i}>
                    <ListItemText primary={text} />
                  </ListItem>
                )
              )}
            </List>
          </CardContent>
        </Card>
      </Box>
    </PermissionGuardClient>
  );
}
