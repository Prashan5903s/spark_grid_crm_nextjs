'use client'

// React Imports
import { useState, useMemo, useEffect } from 'react'

// MUI Imports
import Typography from '@mui/material/Typography'
import LinearProgress from '@mui/material/LinearProgress'
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import MenuItem from '@mui/material/MenuItem'
import TablePagination from '@mui/material/TablePagination'

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
import CustomAvatar from '@core/components/mui/Avatar'
import CustomTextField from '@core/components/mui/TextField'
import TablePaginationComponent from '@components/TablePaginationComponent'

import { getInitials } from '@/utils/getInitials';

// Style Imports
import tableStyles from '@core/styles/table.module.css'

const getAvatar = params => {
  const { avatar, fullName } = params

  if (avatar) {
    return <CustomAvatar src={`${public_url}/uploads/images/${avatar}`} size={34} />
  } else {
    return <CustomAvatar size={34}>{getInitials(fullName)}</CustomAvatar>
  }
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

const ProjectListTable = ({ companyData = [] }) => {

  const [rowSelection, setRowSelection] = useState({})

  const [globalFilter, setGlobalFilter] = useState('')

  const columns = useMemo(
    () => [
      columnHelper.accessor('projectTitle', {
        header: 'Name',
        cell: ({ row }) => (
          <div className='flex items-center gap-4'>
            {getAvatar({ avatar: row.original.photo, fullName: row.original.first_name + " " + row.original.last_name })}
            <div className='flex flex-col'>
              <Typography className='font-medium' color='text.primary'>
                {row.original.first_name} {row.original.last_name}
              </Typography>
            </div>
          </div>
        )
      }),
      columnHelper.accessor('totalTask', {
        header: 'Email',
        cell: ({ row }) => <Typography color='text.primary'>{row.original.email}</Typography>
      }),
      columnHelper.accessor('progressValue', {
        header: 'Phone',
        cell: ({ row }) => (
          <>
            <Typography color='text.primary'>{`${row.original.phone}`}</Typography>
          </>
        )
      }),
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  )

  const table = useReactTable({
    data: (companyData ?? []),
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
        pageSize: 7
      }
    },
    enableRowSelection: true,
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

  return (
    <Card>
      <CardHeader title='User&#39;s List' className='flex flex-wrap gap-4' />
      <div className='flex items-center justify-between p-6 gap-4'>
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
            <MenuItem value='10'>10</MenuItem>
          </CustomTextField>
        </div>
        <DebouncedInput
          value={globalFilter ?? ''}
          onChange={value => setGlobalFilter(String(value))}
          placeholder='Search Project'
        />
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
  )
}

export default ProjectListTable
