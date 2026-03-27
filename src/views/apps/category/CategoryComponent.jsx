'use client'

// React Imports

import { useEffect, useState, useMemo } from 'react'

// MUI Imports

import Card from '@mui/material/Card'

import CardContent from '@mui/material/CardContent'

import Button from '@mui/material/Button'

import Typography from '@mui/material/Typography'

import Chip from '@mui/material/Chip'

import TablePagination from '@mui/material/TablePagination'

import IconButton from '@mui/material/IconButton'

import MenuItem from '@mui/material/MenuItem'

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

import { toast } from 'react-toastify'

import { useSession } from 'next-auth/react'

// Component Imports

import CategoryDialog from '@components/dialogs/category/page'

import OpenDialogOnElementClick from '@components/dialogs/OpenDialogOnElementClick'

import CustomTextField from '@core/components/mui/TextField'

import TablePaginationComponent from '@components/TablePaginationComponent'

// Style Imports
import tableStyles from '@core/styles/table.module.css'

// Vars
const colors = {
    support: 'info',
    users: 'success',
    manager: 'warning',
    administrator: 'primary',
    'restricted-user': 'error'
}

const fuzzyFilter = (row, columnId, value, addMeta) => {
    // Rank the item
    const itemRank = rankItem(row.getValue(columnId), value)

    // Store the itemRank info
    addMeta({
        itemRank
    })

    // Return if the item should be filtered in/out
    return itemRank.passed
}

const DebouncedInput = ({ value: initialValue, onChange, debounce = 500, ...props }) => {
    // States
    const [value, setValue] = useState(initialValue)

    useEffect(() => {
        setValue(initialValue)
    }, [initialValue])
    useEffect(() => {
        const timeout = setTimeout(() => {
            onChange(value)
        }, debounce)

        return () => clearTimeout(timeout)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [value])

    return <CustomTextField {...props} value={value} onChange={e => setValue(e.target.value)} />
}

// Column Definitions
const columnHelper = createColumnHelper()

const CategoryComponent = ({ tableRows, loadTableData, type }) => {
    // States
    const [open, setOpen] = useState(false)
    const [rowSelection, setRowSelection] = useState({})
    const [editValue, setEditValue] = useState('')
    const [data, setData] = useState([])
    const [globalFilter, setGlobalFilter] = useState('')
    const { data: session } = useSession()

    useEffect(() => {

        if (tableRows) {
            setData(tableRows);
        }
    }, [tableRows])

    // Vars
    const buttonProps = {
        variant: 'contained',
        children: 'Add Category',
        onClick: () => handleAdd(),
        className: 'max-sm:is-full',
        startIcon: <i className='tabler-plus' />
    }

    // Hooks
    const columns = useMemo(
        () => [
            columnHelper.accessor('name', {
                header: 'Name',
                cell: ({ row }) => <Typography color='text.primary'>{row.original.name}</Typography>
            }),
            columnHelper.accessor('status', {
                header: 'Status',
                cell: ({ row }) => (
                    <Chip
                        label={row.original.status ? 'Active' : 'Inactive'}
                        color={row.original.status ? 'success' : 'error'}
                        variant='tonal'
                        size='small'
                    />
                )
            }),
            columnHelper.accessor('action', {
                header: 'Actions',
                cell: ({ row }) => (
                    <div className='flex items-center'>
                        <IconButton onClick={() => handleEdit(row.original)}>
                            <i className='tabler-edit text-textSecondary' />
                        </IconButton>
                        <IconButton
                            onClick={() => {
                                const confirmDelete = window.confirm('Are you sure you want to delete?')

                                if (confirmDelete) {
                                    handleDeleteRow(row.original)
                                }
                            }}
                        >
                            <i className='tabler-trash text-textdanger' />
                        </IconButton>

                    </div>
                ),
                enableSorting: false
            })
        ],
        []
    )

    const table = useReactTable({
        data: data,
        columns,
        filterFns: {
            fuzzy: fuzzyFilter
        },
        state: {
            rowSelection,
            globalFilter
        },
        initialState: {
            pagination: {
                pageSize: 9
            }
        },
        enableRowSelection: true, //enable row selection for all rows
        // enableRowSelection: row => row.original.age > 18, // or enable row selection conditionally per row
        globalFilterFn: fuzzyFilter,
        onRowSelectionChange: setRowSelection,
        getCoreRowModel: getCoreRowModel(),
        onGlobalFilterChange: setGlobalFilter,
        getFilteredRowModel: getFilteredRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getFacetedRowModel: getFacetedRowModel(),
        getFacetedUniqueValues: getFacetedUniqueValues(),
        getFacetedMinMaxValues: getFacetedMinMaxValues()
    })

    const handleEdit = name => {
        setOpen(true)
        setEditValue(name)
    }

    const handleAdd = () => {
        setEditValue('')
    }

    const handleAddEmployeeType = () => {
        setOpen(true)
        setEditValue('')
    }

    const handleDeleteRow = async (row) => {
        if (!row || !row._id) return

        const URL = process.env.NEXT_PUBLIC_API_URL
        const endpoint = `${URL}/admin/category/${row._id}`

        try {
            const response = await fetch(endpoint, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${session?.user?.token}`
                }
            })

            const result = await response.json()

            if (!response.ok) {
                throw new Error(result.message || 'Failed to delete Category')
            }

            toast.success(result.message || 'Category deleted successfully', { autoClose: 700 })
            loadTableData() // Refresh the list after deletion
        } catch (error) {
            console.error('Delete error:', error)
            toast.error(error.message || 'Failed to delete Category')
        }
    }

    return (
        <>
            <Card>
                <CardContent className='flex flex-col gap-4 sm:flex-row items-start sm:items-center justify-between flex-wrap'>
                    <div className='flex items-center gap-2'>
                        <Typography>Show {type}</Typography>
                        <CustomTextField
                            select
                            value={table.getState().pagination.pageSize}
                            onChange={e => table.setPageSize(Number(e.target.value))}
                            className='is-[70px]'
                        >
                            <MenuItem value='5'>5</MenuItem>
                            <MenuItem value='7'>7</MenuItem>
                            <MenuItem value='9'>9</MenuItem>
                        </CustomTextField>
                    </div>
                    <div className='flex flex-wrap gap-4'>
                        <DebouncedInput
                            value={globalFilter ?? ''}
                            onChange={value => setGlobalFilter(String(value))}
                            placeholder='Search Category'
                            className='max-sm:is-full'
                        />
                        <OpenDialogOnElementClick
                            element={Button}
                            elementProps={buttonProps}
                            dialog={CategoryDialog}
                            dialogProps={{ editValue, tableRows, loadTableData, type }}
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
                                                <>
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
                                                </>
                                            )}
                                        </th>
                                    ))}
                                </tr>
                            ))}
                        </thead>
                        {table.getFilteredRowModel().rows.length === 0 ? (
                            <tbody>
                                <tr>
                                    <td colSpan={table.getVisibleFlatColumns().length} className='text-center'>
                                        No data available
                                    </td>
                                </tr>
                            </tbody>
                        ) : (
                            <tbody>
                                {table
                                    .getRowModel()
                                    .rows.slice(0, table.getState().pagination.pageSize)
                                    .map(row => {
                                        return (
                                            <tr key={row.id} className={classnames({ selected: row.getIsSelected() })}>
                                                {row.getVisibleCells().map(cell => (
                                                    <td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>
                                                ))}
                                            </tr>
                                        )
                                    })}
                            </tbody>
                        )}
                    </table>
                </div>
                <TablePagination
                    component={() => <TablePaginationComponent table={table} />}
                    count={table.getFilteredRowModel().rows.length}
                    rowsPerPage={table.getState().pagination.pageSize}
                    page={table.getState().pagination.pageIndex}
                    onPageChange={(_, page) => {
                        table.setPageIndex(page)
                    }}
                />
            </Card>
            <CategoryDialog open={open} setOpen={setOpen} data={editValue} loadTableData={loadTableData} type={type} location="category" />
        </>
    )
}

export default CategoryComponent
