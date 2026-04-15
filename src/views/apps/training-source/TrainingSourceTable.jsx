'use client'

// React Imports
import { useState, useMemo, useEffect } from 'react'

// MUI Imports
import { Card, CardContent, MenuItem, Chip, Typography, Checkbox, IconButton, Button } from '@mui/material'

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
import TrainingSourceDialog from '@components/dialogs/training-sources-dialog/page' // 👈 Update the path if needed

// Style Imports
import tableStyles from '@core/styles/table.module.css'

import { usePermissionList } from '@/utils/getPermission'

const assert_url = process.env.NEXT_PUBLIC_ASSETS_URL || ''

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

const DownloadCenterTable = ({ tableData, fetchRoleData, isCompany = true }) => {
  // States
  const [role, setRole] = useState('')
  const [rowSelection, setRowSelection] = useState({})
  const [data, setData] = useState([])
  const [filteredData, setFilteredData] = useState([])
  const [globalFilter, setGlobalFilter] = useState('')
  const [openDialog, setOpenDialog] = useState(false)
  const [selectedRole, setSelectedRole] = useState(null)

  const getPermissions = usePermissionList();
  const [permissions, setPermissions] = useState({});

  useEffect(() => {
    if (tableData) {


      setData(tableData)
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

  // Role filter effect
  useEffect(() => {
    const filtered = data.filter(user => {
      if (role && user.role !== role) return false

      return true
    })

    setFilteredData(filtered)
  }, [role, data])

  const statusColor = (status) => {

    if (status == "completed") {

      return "success"
    } else if (status == "in_progress") {

      return "warning"

    } else if (status == "pending") {

      return "default"
    } else {

      return "danger"
    }

  }

  const publicURL = process.env.NEXT_PUBLIC_ASSETS_URL;

  const columns = useMemo(() => {
    const cols = [
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

      columnHelper.accessor('title', {
        header: 'Title',
        cell: ({ row }) => (
          <Typography className='capitalize' color='text.primary'>
            {row?.original?.title}
          </Typography>
        )
      }),

      columnHelper.accessor('description', {
        header: 'Description',
        cell: ({ row }) => (
          <Typography className='capitalize' color='text.primary'>
            {row?.original?.description}
          </Typography>
        )
      }),

      columnHelper.accessor('file', {
        header: 'File/Document',
        cell: ({ row }) => {
          const filePath = row?.original?.file_path;
          const fileUrl = `${publicURL}/export_center/${filePath}`;

          const handleDownload = () => {
            if (!filePath) return;

            const link = document.createElement('a');
            
            link.href = fileUrl;
            link.setAttribute('download', filePath);
            link.target = '_blank';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
          };

          return (
            <IconButton onClick={handleDownload}>
              <i className='tabler-download' />
            </IconButton>
          );
        }
      }),

      columnHelper.accessor('created_at', {
        header: 'Created At',
        cell: ({ row }) => (
          <Typography>
            {row?.original?.created_at
              ? new Date(row.original.created_at).toLocaleDateString('en-GB', {
                day: '2-digit',
                month: 'short',
                year: 'numeric'
              })
              : 'N/A'}
          </Typography>
        )
      })
    ];

    //  Add User Count column conditionally
    if (isCompany) {
      cols.push(
        columnHelper.accessor('user_count', {
          header: 'User Count',
          cell: ({ row }) => (
            <Typography color='text.primary'>
              {row?.original?.allowedUser?.length || 0}
            </Typography>
          )
        })
      );
    }

    //  Add Actions column conditionally
    if (isCompany) {
      cols.push(
        columnHelper.accessor('action', {
          header: 'Actions',
          cell: ({ row }) => (
            <div className='flex items-center'>
              <IconButton
                onClick={() => {
                  setSelectedRole(row?.original);
                  setOpenDialog(true);
                }}
              >
                <i className='tabler-edit' />
              </IconButton>
            </div>
          ),
          enableSorting: false
        })
      );
    }

    return cols;
  }, [isCompany, permissions]);

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

  const handleClose = async () => {

    setOpenDialog(false)
  }

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
          <DebouncedInput
            value={globalFilter ?? ''}
            className='max-sm:is-full min-is-[250px]'
            onChange={value => setGlobalFilter(String(value))}
            placeholder='Search...'
          />
          {isCompany && (

            <Button variant='contained' size='lg' onClick={() => {

              setOpenDialog(true)
              setSelectedRole();
            }}>
              Add Document
            </Button>
          )}
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
        <TrainingSourceDialog
          open={openDialog}
          handleClose={handleClose}
          setOpen={setOpenDialog}
          data={selectedRole}
          fetchRoleData={fetchRoleData}
          permissionArr={permissions}
        />
      )}
    </Card>
  )
}

export default DownloadCenterTable
