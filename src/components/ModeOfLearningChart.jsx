"use client";

import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend,
} from "recharts";
import { Card, CardContent, Typography } from "@mui/material";

export default function ModeOfLearningChart({ dashboardData }) {

    if (!dashboardData || dashboardData.length === 0) return null;

    // Extract FY keys (same for all items)
    const previousFY = dashboardData[0]?.previousFinancialYear;
    const currentFY = dashboardData[0]?.currentFinancialYear;

    const sortedData = [...dashboardData].sort((a, b) => {
        
        if (a.title === "Micro Learning Module") return -1;
        
        if (b.title === "Micro Learning Module") return 1;
        
        return 0;
    });

    const chartData = sortedData.map(m => ({
        name: m.title,
        [previousFY]: m.previousFYUsers,
        [currentFY]: m.currentFYUsers,
    }));

    return (
        <Card sx={{ borderRadius: 3, boxShadow: 3 }}>
            <CardContent>
                <Typography variant="h6" gutterBottom>
                    Modes Of Learning
                </Typography>

                <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" />

                        <XAxis dataKey="name" />

                        <YAxis
                            label={{
                                value: "No of Users",
                                angle: -90,
                                position: "insideLeft",
                            }}
                        />

                        <Tooltip />
                        <Legend />

                        {/* Previous FY */}
                        <Line
                            type="monotone"
                            dataKey={previousFY}
                            stroke="#1f2937"
                            strokeWidth={2}
                            dot={{ r: 4 }}
                            name={previousFY}
                        />

                        {/* Current FY */}
                        <Line
                            type="monotone"
                            dataKey={currentFY}
                            stroke="#ef4444"
                            strokeWidth={2}
                            dot={{ r: 4 }}
                            name={currentFY}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
}
