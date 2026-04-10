"use client"

import { useState, useEffect } from "react"

import dayjs from "dayjs"

import {
    Box,
    Button,
    Typography
} from "@mui/material"

import {
    LocalizationProvider,
    DateCalendar,
    PickersDay
} from "@mui/x-date-pickers"

import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs"

//  Calendar Component
const Calendar = ({ month, start, end, onSelect }) => {
    return (
        <DateCalendar
            value={month}
            referenceDate={month}
            onChange={(date) => onSelect(date)}
            slots={{
                day: (props) => {
                    const { day } = props

                    const isStart = start && day.isSame(start, "day")
                    const isEnd = end && day.isSame(end, "day")

                    const isBetween =
                        start && end && day.isAfter(start) && day.isBefore(end)

                    // Restrict >1 month selection
                    let disabled = false
                    
                    if (start && !end) {
                        const diff = Math.abs(day.diff(start, "month", true))
                        
                        if (diff > 1) disabled = true
                    }

                    return (
                        <PickersDay
                            {...props}
                            disabled={disabled}
                            onClick={() => !disabled && onSelect(day)}
                            sx={{
                                borderRadius: isStart || isEnd ? "50%" : 0,

                                ...(isStart || isEnd && {
                                    backgroundColor: "#3b82f6",
                                    color: "#fff"
                                }),

                                ...(isBetween && {
                                    backgroundColor: "#bfdbfe"
                                })
                            }}
                        />
                    )
                }
            }}
        />
    )
}

//  MAIN COMPONENT
const DateRangeWithPresets = ({ startDate, endDate, onChange }) => {

    const [today, setToday] = useState(null)
    const [month, setMonth] = useState(null)

    const [start, setStart] = useState(startDate)
    const [end, setEnd] = useState(endDate)

    const [selectedPreset, setSelectedPreset] = useState(null)

    //  Init (client only)
    useEffect(() => {
        const now = dayjs()
        
        setToday(now)
        setMonth(startDate ? dayjs(startDate) : now)
    }, [])

    //  Sync with parent
    useEffect(() => {
        setStart(startDate)
        setEnd(endDate)

        if (startDate) {
            setMonth(dayjs(startDate))
        }
    }, [startDate, endDate])

    //  Always base calendars on START
    const baseMonth = start ? dayjs(start) : month
    const nextMonth = baseMonth?.add(1, "month")

    //  Handle date selection (WITH SWAP FIX)
    const handleSelect = (date) => {

        // First click OR restart
        if (!start || (start && end)) {

            setStart(date)
            setEnd(null)
            setMonth(date)
            setSelectedPreset(null)

            return;
        }

        let s = start
        let e = date

        //  Swap if user selects backward
        if (date.isBefore(start)) {
            s = date
            e = start
        }

        const monthDiff = e.diff(s, "month", true)
        
        if (monthDiff > 1) return

        setStart(s)
        setEnd(e)
        setMonth(s)
        setSelectedPreset(null)

        onChange?.(s, e)
    }

    //  Presets
    const presets = today ? [
        {
            label: "Today",
            action: () => {
                const s = today.startOf("day")
                const e = today.endOf("day")
                
                setStart(s)
                setEnd(e)
                setMonth(s)
                setSelectedPreset("Today")
                onChange(s, e)
            }
        },
        {
            label: "This Week",
            action: () => {
                const s = today.startOf("week")
                const e = today.endOf("week")
                
                setStart(s)
                setEnd(e)
                setMonth(s)
                setSelectedPreset("This Week")
                onChange(s, e)
            }
        },
        {
            label: "Last Week",
            action: () => {
                const s = today.subtract(1, "week").startOf("week")
                const e = today.subtract(1, "week").endOf("week")
                
                setStart(s)
                setEnd(e)
                setMonth(s)
                setSelectedPreset("Last Week")
                onChange(s, e)
            }
        },
        {
            label: "This Month",
            action: () => {
                const s = today.startOf("month")
                const e = today.endOf("month")
                
                setStart(s)
                setEnd(e)
                setMonth(s)
                setSelectedPreset("This Month")
                onChange(s, e)
            }
        },
        {
            label: "Last Month",
            action: () => {
                const s = today.subtract(1, "month").startOf("month")
                const e = today.subtract(1, "month").endOf("month")
                
                setStart(s)
                setEnd(e)
                setMonth(s)
                setSelectedPreset("Last Month")
                onChange(s, e)
            }
        },
        {
            label: "This Quarter",
            action: () => {
                const currentQuarter = Math.floor(today.month() / 3)

                const s = today.month(currentQuarter * 3).startOf("month")
                const e = s.add(2, "month").endOf("month")

                setStart(s)
                setEnd(e)
                setMonth(s)
                setSelectedPreset("This Quarter")
                onChange(s, e)
            }
        },
        {
            label: "Current Year",
            action: () => {
                const s = today.startOf("year")
                const e = today.endOf("year")
                
                setStart(s)
                setEnd(e)
                setMonth(s)
                setSelectedPreset("Current Year")
                onChange(s, e)
            }
        },
        {
            label: "Last Year",
            action: () => {
                const s = today.subtract(1, "year").startOf("year")
                const e = today.subtract(1, "year").endOf("year")
                
                setStart(s)
                setEnd(e)
                setMonth(s)
                setSelectedPreset("Last Year")
                onChange(s, e)
            }
        },
        {
            label: "Reset",
            action: () => {
                setStart(null)
                setEnd(null)
                setMonth(today)
                setSelectedPreset(null)
                onChange(null, null)
            }
        }
    ] : []

    //  Detect active preset
    useEffect(() => {
        if (!startDate || !endDate || !today) return

        const s = dayjs(startDate)
        const e = dayjs(endDate)

        if (
            s.isSame(today.subtract(6, "day"), "day") &&
            e.isSame(today, "day")
        ) {
            setSelectedPreset("Last 7 Days")
        } else if (
            s.isSame(today.startOf("week"), "day") &&
            e.isSame(today.endOf("week"), "day")
        ) {
            setSelectedPreset("This Week")
        } else if (
            s.isSame(today.subtract(1, "week").startOf("week"), "day") &&
            e.isSame(today.subtract(1, "week").endOf("week"), "day")
        ) {
            setSelectedPreset("Last Week")
        } else if (
            s.isSame(today.startOf("month"), "day") &&
            e.isSame(today.endOf("month"), "day")
        ) {
            setSelectedPreset("Current Month")
        } else {
            setSelectedPreset(null)
        }
    }, [startDate, endDate, today])

    if (!month || !today) return null

    return (
        <LocalizationProvider dateAdapter={AdapterDayjs}>
            <Box sx={{ p: 3, borderRadius: 3, width: "800px" }}>

                <Typography variant="h6" sx={{ mb: 2 }}>
                    {start && end
                        ? `${start.format("DD MMM YYYY")} → ${end.format("DD MMM YYYY")}`
                        : start
                            ? `Start: ${start.format("DD MMM YYYY")}`
                            : "Select Date Range"}
                </Typography>

                <Box sx={{ display: "flex" }}>

                    {/* PRESETS */}
                    <Box sx={{ inlineSize: 200 }}>
                        {presets.map((item) => (
                            <Button
                                key={item.label}
                                fullWidth
                                sx={{
                                    fontSize: 13,
                                    justifyContent: "flex-start",
                                    mb: 1,
                                    backgroundColor:
                                        selectedPreset === item.label
                                            ? "#e0e7ff"
                                            : "transparent"
                                }}
                                onClick={item.action}
                                color="secondary"
                            >
                                {item.label}
                            </Button>
                        ))}
                    </Box>

                    {/* CALENDARS */}
                    <Box sx={{ display: "flex", gap: 2, ml: 3 }}>

                        {/* LEFT = START MONTH */}
                        <Calendar
                            month={baseMonth}
                            start={start}
                            end={end}
                            onSelect={handleSelect}
                        />

                        {/* RIGHT = NEXT MONTH */}
                        <Calendar
                            month={nextMonth}
                            start={start}
                            end={end}
                            onSelect={handleSelect}
                        />
                    </Box>
                </Box>
            </Box>
        </LocalizationProvider>
    )
}

export default DateRangeWithPresets
