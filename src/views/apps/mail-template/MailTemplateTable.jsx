'use client'

import { useState, useMemo, useEffect } from 'react'

import {
  Card,
  Button,
  CardContent,
  MenuItem,
  Chip,
  Typography,
  Checkbox,
  IconButton
} from '@mui/material'

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
import MailTemplateDialog from '@components/dialogs/mail-template-dialog/page' // 👈 Update the path if needed

// Style Imports
import tableStyles from '@core/styles/table.module.css'

import { usePermissionList } from '@/utils/getPermission'

// Filter function
const fuzzyFilter = (row, columnId, value, addMeta) => {
  const itemRank = rankItem(row.getValue(columnId), value)

  addMeta({ itemRank })

  return itemRank.passed
}

const columnHelper = createColumnHelper()

const MailTemplateTable = ({ tableData, fetchMailTemplateData }) => {

  const [rowSelection, setRowSelection] = useState({})
  const [filteredData, setFilteredData] = useState([])
  const [globalFilter, setGlobalFilter] = useState('')
  const [openDialog, setOpenDialog] = useState(false)
  const [selectedRole, setSelectedRole] = useState(null)

  const getPermissions = usePermissionList();
  const [permissions, setPermissions] = useState({});

  useEffect(() => {
    if (tableData) {

      setFilteredData(tableData)
    }
  }, [tableData])

  useEffect(() => {
    const fetchPermissions = async () => {
      try {
        const result = await getPermissions();

        setPermissions(result);
      } catch (error) {
        console.error('Error fetching permissions:', error);
      }
    };

    if (getPermissions) {
      fetchPermissions();
    }
  }, [getPermissions]); // Include in dependency array

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
    columnHelper.accessor('name', {
      header: 'Group Name',
      cell: ({ row }) => (
        <Typography className='capitalize' color='text.primary'>
          {row.original.name}
        </Typography>
      )
    }),
    columnHelper.accessor('description', {
      header: 'Description',
      cell: ({ row }) => (
        <Typography variant='body2' color='text.secondary'>
          {row.original.description}
        </Typography>
      )
    }),
    columnHelper.accessor('userId', {
      header: 'Total users',
      cell: ({ row }) => (
        <Typography variant='body2' color='text.secondary'>
          {row.original.userId.length}
        </Typography>
      )
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
          {permissions?.['hasGroupEditPermission'] && (
            <IconButton
              onClick={() => {
                setSelectedRole(row.original)
                setOpenDialog(true)
              }}
            >
              <i className='tabler-edit text-textSecondary' />
            </IconButton>
          )}
        </div>
      ),
      enableSorting: false
    })
  ], [permissions])

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
    <Card>
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
          <Button variant='contained' size='small' onClick={() => setOpenDialog(true)}>
            Add Mail Template
          </Button>
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

      {/* Role Dialog */}
      {openDialog && (
        <MailTemplateDialog
          tableData={tableData}
          open={openDialog}
          setOpen={setOpenDialog}
          selectedRole={selectedRole}
          fetchMailTemplateData={fetchMailTemplateData}
          permissionArr={permissions}
        />
      )}
    </Card>
  )
}

export default MailTemplateTable
