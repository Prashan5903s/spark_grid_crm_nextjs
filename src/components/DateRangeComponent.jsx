"use client"

import { useState } from "react"

import dayjs from "dayjs"

import { TextField, Dialog, DialogContent, Menu } from "@mui/material"

import DateRangeWithPresets from "./DateRangePresent"

const DateRangeComponent = ({ startDate, endDate, onChange }) => {
    const [open, setOpen] = useState(false)

    const [anchorEl, setAnchorEl] = useState(null)

    const formatRange = () => {
        if (startDate && endDate) {
            return `${dayjs(startDate).format("DD MMM YYYY")} → ${dayjs(endDate).format("DD MMM YYYY")}`
        }
        
        if (startDate) {

            return `Start: ${dayjs(startDate).format("DD MMM YYYY")}`
        }
        
        return ""
    }


    const handleClick = event => {
        setAnchorEl(event.currentTarget)
        setOpen(true)
    }

    const handleClose = () => {
        setAnchorEl(null)
        setOpen(false)
    }

    return (
        <>
            <TextField
                fullWidth
                size="small"
                label="Select Date Range"
                value={formatRange()}
                placeholder="Select date range"
                onClick={handleClick}
                InputProps={{ readOnly: true }}
                aria-controls="date-range-menu"
            />

            <Menu keepMounted id="date-range-menu" anchorEl={anchorEl} open={open} onClose={handleClose}>
                <DateRangeWithPresets
                    startDate={startDate}
                    endDate={endDate}
                    onChange={(start, end) => {
                        onChange(start, end)
                        if (start && end) setOpen(false)
                    }}
                />
            </Menu>
        </>
    )
}

export default DateRangeComponent
