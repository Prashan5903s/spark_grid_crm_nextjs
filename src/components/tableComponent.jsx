'use client'

// -------------------- React Imports --------------------
import { useEffect, useState, useMemo } from 'react';

// -------------------- Next.js Imports --------------------
import { useParams } from 'next/navigation';

// -------------------- MUI Imports --------------------
import Card from '@mui/material/Card';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Checkbox from '@mui/material/Checkbox';
import TablePagination from '@mui/material/TablePagination';
import MenuItem from '@mui/material/MenuItem';


// -------------------- External Libraries --------------------
import classnames from 'classnames';
import { rankItem } from '@tanstack/match-sorter-utils';

// -------------------- React Table Imports --------------------
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
} from '@tanstack/react-table';

// -------------------- Local/Custom Components --------------------

import TablePaginationComponent from '@components/TablePaginationComponent';
import CustomTextField from '@core/components/mui/TextField';
import CustomAvatar from '@core/components/mui/Avatar';

// -------------------- Utilities --------------------
import { getInitials } from '@/utils/getInitials';

// -------------------- Styles --------------------
import tableStyles from '@core/styles/table.module.css';

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

const TableComponent = ({ userData, type }) => {
    // States
    const [rowSelection, setRowSelection] = useState({})
    const [data, setData] = useState([])
    const [filteredData, setFilteredData] = useState([])
    const [globalFilter, setGlobalFilter] = useState('')
    const public_url = process.env.NEXT_PUBLIC_ASSETS_URL;


    useEffect(() => {
        if (userData) {
            setData(userData);
            setFilteredData(userData);
        }
    }, [userData])

    // Hooks
    const { lang: locale } = useParams()

    const columns = useMemo(
        () => [
            {
                id: 'select',
                header: ({ table }) => (
                    <Checkbox
                        {...{
                            checked: table.getIsAllRowsSelected(),
                            indeterminate: table.getIsSomeRowsSelected(),
                            onChange: table.getToggleAllRowsSelectedHandler()
                        }}
                    />
                ),
                cell: ({ row }) => (
                    <Checkbox
                        {...{
                            checked: row.getIsSelected(),
                            disabled: !row.getCanSelect(),
                            indeterminate: row.getIsSomeSelected(),
                            onChange: row.getToggleSelectedHandler()
                        }}
                    />
                )
            },
            columnHelper.accessor('first_name', {
                header: 'User',
                cell: ({ row }) => (
                    <div className='flex items-center gap-4'>
                        {getAvatar({ avatar: row.original.photo, fullName: row.original.first_name + " " + row.original.last_name })}
                        <div className='flex flex-col'>
                            <Typography color='text.primary' className='font-medium'>
                                {row.original.first_name + " " + row.original.last_name}
                            </Typography>
                            <Typography variant='body2'>{row.original.email}</Typography>
                        </div>
                    </div>
                )
            }),
            columnHelper.accessor('email', {
                header: 'Email',
                cell: ({ row }) => <Typography>{row.original.email}</Typography>
            }),
            columnHelper.accessor('phone', {
                header: 'Phone',
                cell: ({ row }) => <Typography>{row.original.phone}</Typography>
            }),
            columnHelper.accessor('address', {
                header: 'Address',
                cell: ({ row }) => <Typography>{row.original.address}</Typography>
            }),
        ],
        [data, filteredData]
    )

    const table = useReactTable({
        data: filteredData,
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
                pageSize: 10
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

    const getAvatar = params => {
        const { avatar, fullName } = params

        if (avatar) {
            return <CustomAvatar src={`${public_url}/${avatar}`} size={34} />
        } else {
            return <CustomAvatar size={34}>{getInitials(fullName)}</CustomAvatar>
        }
    }

    return (
        <>
            <Card >
                <div className='flex justify-between flex-col items-start md:flex-row md:items-center p-6 border-bs gap-4'>
                    <CustomTextField
                        select
                        value={table.getState().pagination.pageSize}
                        onChange={e => table.setPageSize(Number(e.target.value))}
                        className='max-sm:is-full sm:is-[70px]'
                    >
                        <MenuItem value='10'>10</MenuItem>
                        <MenuItem value='25'>25</MenuItem>
                        <MenuItem value='50'>50</MenuItem>
                    </CustomTextField>
                    <div className='flex flex-col sm:flex-row max-sm:is-full items-start sm:items-center gap-4'>
                        <DebouncedInput
                            value={globalFilter ?? ''}
                            onChange={value => setGlobalFilter(String(value))}
                            placeholder='Search User'
                            className='max-sm:is-full'
                        />
                        {type == 1 && (
                            <Button variant='contained'>
                                Invite
                            </Button>
                        )}

                    </div>
                </div>
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
        </>
    )
}

export default TableComponent
