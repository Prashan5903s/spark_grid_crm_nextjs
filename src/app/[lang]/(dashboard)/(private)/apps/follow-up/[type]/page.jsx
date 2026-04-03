"use client"

import { useSession } from "next-auth/react"
import { useState, useMemo, useEffect } from "react"
import { useParams } from "next/navigation"
import dayjs from "dayjs"

import {
    createColumnHelper,
    flexRender,
    getCoreRowModel,
    useReactTable,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel
} from "@tanstack/react-table"

import {
    Card,
    CardContent,
    Checkbox,
    Typography,
    MenuItem,
    TextField
} from "@mui/material"

import Grid from "@mui/material/Grid2"

import CustomTextField from "@core/components/mui/TextField"
import TablePaginationComponent from "@components/TablePaginationComponent"
import tableStyles from "@core/styles/table.module.css"

import DateRangeComponent from "@/components/DateRangeComponent"

import { getInitials } from '@/utils/getInitials';

import CustomAvatar from '@/@core/components/mui/Avatar'

const columnHelper = createColumnHelper()

const getAvatar = params => {
    const { avatar, fullName } = params

    if (avatar) {
        return <CustomAvatar src={`${public_url}/${avatar}`} size={34} />
    } else {
        return <CustomAvatar size={34}>{getInitials(fullName)}</CustomAvatar>
    }
}

const FollowUp = () => {
    const { type } = useParams()
    const { data: session } = useSession() || {}

    const token = session?.user?.token
    const URL = process.env.NEXT_PUBLIC_API_URL

    const [tableData, setTableData] = useState([])
    const [globalFilter, setGlobalFilter] = useState("")
    const [rowSelection, setRowSelection] = useState({})

    const [selectedStatus, setSelectedStatus] = useState("")

    // FIXED: Initialize properly
    const [createData, setCreateData] = useState({
        followUpStatus: []
    })

    const [startDate, setStartDate] = useState(null)
    const [endDate, setEndDate] = useState(null)

    // Fetch Table Data
    const fetchFollowUpData = async () => {
        try {
            const body = {
                type,
                ...(selectedStatus && { status: selectedStatus }),
                ...(startDate && endDate && {
                    startDate: dayjs(startDate).format("YYYY-MM-DD"),
                    endDate: dayjs(endDate).format("YYYY-MM-DD")
                })
            }

            const res = await fetch(`${URL}/user/follow-up/filter/data`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(body)
            })

            const data = await res.json()

            if (res.ok) {
                setTableData(data?.data || [])
            }
        } catch (err) {
            console.error(err)
        }
    }

    // Fetch Dropdown Data
    const fetchCreateData = async () => {
        try {
            const res = await fetch(`${URL}/user/follow-up/create/data`, {
                headers: { Authorization: `Bearer ${token}` }
            })

            const data = await res.json()

            if (res.ok) {
                setCreateData({
                    followUpStatus: data?.data?.followUpStatus || []
                })
            }
        } catch (err) {
            console.error(err)
        }
    }

    useEffect(() => {
        if (URL && token && type) fetchFollowUpData()
    }, [URL, token, type, selectedStatus, startDate, endDate])

    useEffect(() => {
        if (URL && token) fetchCreateData()
    }, [URL, token])

    const formatTime = (value) => {
        if (!value) return '';

        const date = new Date(value);

        if (isNaN(date)) return '';

        return date.toLocaleString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
        })
    };

    // Columns
    const columns = useMemo(() => [
        {
            id: "select",
            header: ({ table }) => (
                <Checkbox
                    checked={table.getIsAllRowsSelected()}
                    indeterminate={table.getIsSomeRowsSelected()}
                    onChange={table.getToggleAllRowsSelectedHandler()}
                />
            ),
            cell: ({ row }) => (
                <Checkbox
                    checked={row.getIsSelected()}
                    onChange={row.getToggleSelectedHandler()}
                />
            )
        },
        columnHelper.accessor('first_name', {
            header: 'User',
            cell: ({ row }) => (
                <div className='flex items-center gap-4'>
                    {getAvatar({ avatar: "", fullName: row.original.lead_data.name })}
                    <div className='flex flex-col'>
                        <Typography color='text.primary' className='font-medium'>
                            {row.original.lead_data.name}
                        </Typography>
                        <Typography variant='body2'>{row.original.lead_data.email}</Typography>
                    </div>
                </div>
            )
        }),
        columnHelper.accessor("company_name", {
            header: "Company Name",
            cell: ({ row }) => (
                <Typography>{row.original?.lead_data?.company_name}</Typography>
            )
        }),
        columnHelper.accessor("email", {
            header: "Email",
            cell: ({ row }) => (
                <Typography>{row.original?.lead_data?.email}</Typography>
            )
        }),
        columnHelper.accessor("phone", {
            header: "Phone",
            cell: ({ row }) => (
                <Typography>{row.original?.lead_data?.phone}</Typography>
            )
        }),
        columnHelper.accessor("lead_status", {
            header: "Status",
            cell: ({ row }) => (
                <Typography>
                    {row.original?.status_data?.title}
                </Typography>
            )
        }),
        columnHelper.accessor("type_data", {
            header: "Follow-up Type",
            cell: ({ row }) => (
                <Typography>
                    {row.original?.follow_up_type_data?.title}
                </Typography>
            )
        }),
        columnHelper.accessor("priority", {
            header: "Priority",
            cell: ({ row }) => (
                <Typography>
                    {row.original?.priority_data?.title}
                </Typography>
            )
        }),
        columnHelper.accessor("follow_up_date", {
            header: "Follow-up Data",
            cell: ({ row }) => (
                <Typography>
                    {formatTime(row.original?.follow_up_date)}
                </Typography>
            )
        })
    ], [])

    const table = useReactTable({
        data: tableData,
        columns,
        state: { rowSelection, globalFilter },
        onRowSelectionChange: setRowSelection,
        onGlobalFilterChange: setGlobalFilter,
        initialState: { pagination: { pageSize: 10 } },
        getCoreRowModel: getCoreRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getPaginationRowModel: getPaginationRowModel()
    })

    return (

        <Card>
            <CardContent>
                <Grid container spacing={3} alignItems="center" justifyContent="space-between">

                    {/* Left: Page Size */}
                    <Grid size={{ xs: 12, sm: 6 }}>
                        <div className="flex items-center gap-2">
                            <Typography>Show</Typography>
                            <CustomTextField
                                select
                                size="small"
                                value={table.getState().pagination.pageSize}
                                onChange={(e) => table.setPageSize(Number(e.target.value))}
                                sx={{ minWidth: 80 }}
                            >
                                <MenuItem value={10}>10</MenuItem>
                                <MenuItem value={25}>25</MenuItem>
                                <MenuItem value={50}>50</MenuItem>
                            </CustomTextField>
                        </div>
                    </Grid>

                    {/* Right: Filters */}
                    <Grid container spacing={2} size={type === 'view-all' ? { xs: 12, sm: 6 } : { xs: 12, sm: 6 }}>

                        {/* Status Filter */}
                        <Grid size={type === 'view-all' ? { xs: 12, sm: 6 } : { xs: 12 }}>
                            <TextField
                                label="Status"
                                select
                                value={selectedStatus}
                                fullWidth
                                size="small"
                                onChange={(e) => setSelectedStatus(e.target.value)}
                            >
                                <MenuItem value="" disabled>Select Status</MenuItem>
                                {(createData.followUpStatus || []).map((item) => (
                                    <MenuItem key={item._id} value={item._id}>
                                        {item.title}
                                    </MenuItem>
                                ))}
                            </TextField>
                        </Grid>

                        {/* Date Range */}

                        {type === 'view-all' && (

                            <Grid size={{ xs: 12, sm: 6 }}>
                                <DateRangeComponent
                                    startDate={startDate}
                                    endDate={endDate}
                                    onChange={(start, end) => {
                                        setStartDate(start)
                                        setEndDate(end)
                                    }}
                                />
                            </Grid>
                        )}
                    </Grid>
                </Grid>
            </CardContent>

            {/* TABLE */}
            <div className="overflow-x-auto">
                <table className={tableStyles.table}>
                    <thead>
                        {table.getHeaderGroups().map((hg) => (
                            <tr key={hg.id}>
                                {hg.headers.map((header) => (
                                    <th key={header.id} className="text-left px-4 py-3">
                                        {flexRender(header.column.columnDef.header, header.getContext())}
                                    </th>
                                ))}
                            </tr>
                        ))}
                    </thead>

                    <tbody>
                        {table.getRowModel().rows.length === 0 ? (
                            <tr>
                                <td colSpan={columns.length} className="text-center py-8">
                                    No data available
                                </td>
                            </tr>
                        ) : (
                            table.getRowModel().rows.map((row) => (
                                <tr key={row.id} className="hover:bg-gray-50 transition">
                                    {row.getVisibleCells().map((cell) => (
                                        <td key={cell.id} className="px-4 py-3">
                                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                        </td>
                                    ))}
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            <div className="px-4 py-2">
                <TablePaginationComponent table={table} />
            </div>
        </Card >

    )
}

export default FollowUp
