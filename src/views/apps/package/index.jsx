'use client'

// React Imports
import { useEffect, useState, useMemo } from 'react'

// MUI Imports

import Card from '@mui/material/Card'

import CardContent from '@mui/material/CardContent'

import Button from '@mui/material/Button'

import Typography from '@mui/material/Typography'

import { Chip, TablePagination } from '@mui/material'

import IconButton from '@mui/material/IconButton'

import MenuItem from '@mui/material/MenuItem'

// Third-party Imports

import classnames from 'classnames'

import { rankItem } from '@tanstack/match-sorter-utils'

import {
    createColumnHelper,
    flexRender,
    useReactTable,
    getCoreRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel
} from '@tanstack/react-table'

import SkeletonComponent from '@/components/skeleton/table/page'

// Component Imports

import OpenDialogOnElementClick from '@components/dialogs/OpenDialogOnElementClick'
import CustomTextField from '@core/components/mui/TextField'
import TablePaginationComponent from '@components/TablePaginationComponent'

// Style Imports
import tableStyles from '@core/styles/table.module.css'

import PackageDialog from '@components/dialogs/package-dialog/page'

// Vars
const fuzzyFilter = (row, columnId, value, addMeta) => {
    const itemRank = rankItem(row.getValue(columnId), value)
    
    addMeta({ itemRank })
    
    return itemRank.passed
}

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

// Column Definitions
const columnHelper = createColumnHelper()

const PackageTable = ({ packageTypeData, fetchPackage, isLoading, nameData }) => {
    const [open, setOpen] = useState(false)
    const [rowSelection, setRowSelection] = useState({})
    const [editValue, setEditValue] = useState('')
    const [globalFilter, setGlobalFilter] = useState('')

    const columns = useMemo(
        () => [
            columnHelper.accessor('name', {
                header: 'Name',
                cell: ({ row }) => <Typography color='text.primary'>{row.original.name}</Typography>
            }),
            columnHelper.accessor('packageTypeName', {
                header: 'Package Type Name',
                cell: ({ row }) => <Typography color='text.primary'>{row.original.packageTypeName}</Typography>
            }),
            columnHelper.accessor('description', {
                header: 'Description',
                cell: ({ row }) => <Typography color='text.primary'>{row.original.description}</Typography>
            }),
            columnHelper.accessor('amount', {
                header: 'Amount',
                cell: ({ row }) => <Typography color='text.primary'>{row.original.amount}</Typography>
            }),
            columnHelper.accessor('status', {
                header: 'Status',
                cell: ({ row }) => (
                    <Chip
                        label={row.original.status ? 'Active' : 'Inactive'}
                        color={row.original.status ? 'success' : 'default'}
                        variant='tonal'
                        size='small'
                    />
                )
            }),
            columnHelper.accessor('action', {
                header: 'Actions',
                cell: ({ row }) => (
                    <div className='flex items-center'>
                        <IconButton onClick={() => handleEditPermission(row.original)}>
                            <i className='tabler-edit text-textSecondary' />
                        </IconButton>
                    </div>
                ),
                enableSorting: false
            })
        ],
        []
    )

    const table = useReactTable({
        data: packageTypeData,
        columns,
        state: {
            rowSelection,
            globalFilter
        },
        initialState: {
            pagination: {
                pageSize: 9
            }
        },
        globalFilterFn: fuzzyFilter,
        onRowSelectionChange: setRowSelection,
        getCoreRowModel: getCoreRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
    })

    const handleEditPermission = value => {
        setOpen(true)
        setEditValue(value)
    }

    const handleAddPermission = () => {
        setEditValue('')
    }

    return (
        <>
            {isLoading ? (
                <Card>
                    <CardContent className='flex flex-col gap-4 sm:flex-row items-start sm:items-center justify-between flex-wrap'>
                        <div className='flex items-center gap-2'>
                            <Typography>Show</Typography>
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
                                placeholder='Search Package'
                                className='max-sm:is-full'
                            />
                            <OpenDialogOnElementClick
                                element={Button}
                                elementProps={{
                                    variant: 'contained',
                                    children: 'Add Package',
                                    onClick: () => handleAddPermission(),
                                    className: 'max-sm:is-full',
                                    startIcon: <i className='tabler-plus' />
                                }}
                                dialog={PackageDialog}
                                dialogProps={{ editValue, fetchPackage, nameData }}
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
                                {table.getRowModel().rows.length === 0 ? (
                                    <tr>
                                        <td colSpan={table.getVisibleFlatColumns().length} className='text-center'>
                                            No data available
                                        </td>
                                    </tr>
                                ) : (
                                    table.getRowModel().rows.map(row => (
                                        <tr key={row.id} className={classnames({ selected: row.getIsSelected() })}>
                                            {row.getVisibleCells().map(cell => (
                                                <td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>
                                            ))}
                                        </tr>
                                    ))
                                )}
                            </tbody>
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
            ) : (
                <SkeletonComponent />
            )}
            <PackageDialog
                open={open}
                setOpen={setOpen}
                data={editValue}
                fetchPackage={fetchPackage}
                nameData={nameData}
            />
        </>
    )
}

export default PackageTable;
