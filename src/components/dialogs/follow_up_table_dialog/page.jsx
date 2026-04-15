'use client'

// React Imports
import { useState, useMemo, useEffect } from 'react'

// MUI Imports
import { Dialog, CardContent, MenuItem, Chip, Typography, Checkbox, DialogContent, DialogTitle } from '@mui/material'

// Third-party Imports
import classnames from 'classnames'
import { rankItem } from '@tanstack/match-sorter-utils'
import {
    createColumnHelper,
    flexRender,
    getCoreRowModel,
    useReactTable,
    getFilteredRowModel,
    getFacetedRowModel,
    getFacetedUniqueValues,
    getFacetedMinMaxValues,
    getPaginationRowModel,
    getSortedRowModel
} from '@tanstack/react-table'

// Component Imports
import CustomTextField from '@core/components/mui/TextField'
import TablePaginationComponent from '@components/TablePaginationComponent'

// Style Imports
import tableStyles from '@core/styles/table.module.css'

import DialogCloseButton from '../DialogCloseButton'

// Filter function
const fuzzyFilter = (row, columnId, value, addMeta) => {
    const itemRank = rankItem(row.getValue(columnId), value)

    addMeta({ itemRank })

    return itemRank.passed
}

// Debounced Input
const DebouncedInput = ({ value: initialValue, onChange, debounce = 500, ...props }) => {
    const [value, setValue] = useState(initialValue)

    useEffect(() => {
        setValue(initialValue)
    }, [initialValue])

    useEffect(() => {
        const timeout = setTimeout(() => {
            onChange(value)
        }, debounce)

        return () => clearTimeout(timeout)
    }, [value])

    return <CustomTextField {...props} value={value} onChange={e => setValue(e.target.value)} />
}

const columnHelper = createColumnHelper()

const FollowUpTable = ({ open, setOpen, tableData, fetchRoleData, selectedLeadId }) => {

    const [rowSelection, setRowSelection] = useState({})
    const [filteredData, setFilteredData] = useState([])
    const [globalFilter, setGlobalFilter] = useState('')

    useEffect(() => {
        if (tableData) {

            setFilteredData(tableData?.followUp)
        }
    }, [tableData])

    const handleClose = () => {

        setOpen(false)
    }

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

    const columns = useMemo(() => [
        {
            id: 'select',
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
                    disabled={!row.getCanSelect()}
                    indeterminate={row.getIsSomeSelected()}
                    onChange={row.getToggleSelectedHandler()}
                />
            )
        },
        columnHelper.accessor('follow_up_date', {
            header: 'Follow Up Date',
            cell: ({ row }) => (
                <Typography className='capitalize' color='text.primary'>
                    {formatTime(row.original.follow_up_date)}
                </Typography>
            )
        }),
        columnHelper.accessor('next_follow_up_date', {
            header: 'Next follow up date',
            cell: ({ row }) => (
                <Typography variant='body2' color='text.secondary'>
                    {row.original.next_follow_up_date ? formatTime(row.original.next_follow_up_date) : ""}
                </Typography>
            )
        }),
        columnHelper.accessor('type', {
            header: 'Type',
            cell: ({ row }) => (
                <Typography>{row?.original?.type_data?.title || ""}</Typography>
            )
        }),
        columnHelper.accessor('priority', {
            header: 'Priority',
            cell: ({ row }) => (
                <Typography>{row?.original?.priority_data?.title || ""}</Typography>
            )
        }),
        columnHelper.accessor('status', {
            header: 'Status',
            cell: ({ row }) => (
                <Typography>{row?.original?.status_data?.title || ""}</Typography>
            )
        }),
    ], [])

    const table = useReactTable({
        data: filteredData,
        columns,
        filterFns: { fuzzy: fuzzyFilter },
        state: { rowSelection, globalFilter },
        initialState: { pagination: { pageSize: 10 } },
        enableRowSelection: true,
        globalFilterFn: fuzzyFilter,
        onRowSelectionChange: setRowSelection,
        onGlobalFilterChange: setGlobalFilter,
        getCoreRowModel: getCoreRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getFacetedRowModel: getFacetedRowModel(),
        getFacetedUniqueValues: getFacetedUniqueValues(),
        getFacetedMinMaxValues: getFacetedMinMaxValues()
    })

    return (
        <Dialog
            fullWidth
            maxWidth="lg"
            scroll="body"
            open={open}
            closeAfterTransition={false}
            sx={{ '& .MuiDialog-paper': { overflow: 'visible' } }}
        >
            <DialogCloseButton onClick={handleClose}>
                <i className="tabler-x" />
            </DialogCloseButton>

            <DialogTitle className="text-center">
                Follow Up List
            </DialogTitle>
            <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>


                <CardContent className='flex justify-between flex-col gap-4 items-start sm:flex-row sm:items-center'>
                    <div className='flex items-center gap-2'>
                        <Typography>Show</Typography>
                        <CustomTextField
                            select
                            value={table.getState().pagination.pageSize}
                            onChange={e => table.setPageSize(Number(e.target.value))}
                            className='max-sm:is-full sm:is-[70px]'
                        >
                            <MenuItem value={10}>10</MenuItem>
                            <MenuItem value={25}>25</MenuItem>
                            <MenuItem value={50}>50</MenuItem>
                        </CustomTextField>
                    </div>
                    <div className='flex gap-4 flex-col !items-start max-sm:is-full sm:flex-row sm:items-center'>
                        <DebouncedInput
                            value={globalFilter ?? ''}
                            className='max-sm:is-full min-is-[250px]'
                            onChange={value => setGlobalFilter(String(value))}
                            placeholder='Search FollowUp'
                        />
                    </div>
                </CardContent>

                <div className='overflow-x-auto'>
                    <table className={tableStyles.table}>
                        <thead>
                            {table.getHeaderGroups().map(headerGroup => (
                                <tr key={headerGroup.id}>
                                    {headerGroup.headers.map(header => (
                                        <th key={header.id}>
                                            {header.isPlaceholder ? null : (
                                                <div
                                                    className={classnames({
                                                        'flex items-center': header.column.getIsSorted(),
                                                        'cursor-pointer select-none': header.column.getCanSort()
                                                    })}
                                                    onClick={header.column.getToggleSortingHandler()}
                                                >
                                                    {flexRender(header.column.columnDef.header, header.getContext())}
                                                    {{
                                                        asc: <i className='tabler-chevron-up text-xl' />,
                                                        desc: <i className='tabler-chevron-down text-xl' />
                                                    }[header.column.getIsSorted()] ?? null}
                                                </div>
                                            )}
                                        </th>
                                    ))}
                                </tr>
                            ))}
                        </thead>
                        <tbody>
                            {table.getFilteredRowModel().rows.length === 0 ? (
                                <tr>
                                    <td colSpan={table.getVisibleFlatColumns().length} className='text-center'>
                                        No data available
                                    </td>
                                </tr>
                            ) : (
                                table.getRowModel().rows.map(row => (
                                    <tr key={row.id} className={classnames({ selected: row.getIsSelected() })}>
                                        {row.getVisibleCells().map(cell => (
                                            <td key={cell.id}>
                                                {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                            </td>
                                        ))}
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                <TablePaginationComponent table={table} />
            </DialogContent>
        </Dialog >
    )
}

export default FollowUpTable
