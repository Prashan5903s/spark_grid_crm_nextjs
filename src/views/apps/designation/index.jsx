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

import { useSession } from 'next-auth/react'

// Component Imports

import { toast } from 'react-toastify'

import CustomTextField from '@core/components/mui/TextField'
import DesignationDialog from '@components/dialogs/designation-dialog/page'
import OpenDialogOnElementClick from '@components/dialogs/OpenDialogOnElementClick'
import TablePaginationComponent from '@components/TablePaginationComponent'

// Style Imports
import tableStyles from '@core/styles/table.module.css'
import { usePermissionList } from '@/utils/getPermission'

// Helpers
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

// Column Definitions
const columnHelper = createColumnHelper()

const DesignationComponent = () => {
  const [open, setOpen] = useState(false)
  const [rowSelection, setRowSelection] = useState({})
  const [editValue, setEditValue] = useState('')
  const [data, setData] = useState([])
  const [globalFilter, setGlobalFilter] = useState('')
  const [nameData, setNameData] = useState()

  const URL = process.env.NEXT_PUBLIC_API_URL
  const { data: session } = useSession() || {}
  const token = session?.user?.token

  const getPermissions = usePermissionList();
  const [permissions, setPermissions] = useState({});

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

  const fetchDesignations = async () => {
    try {
      const response = await fetch(`${URL}/admin/designations`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      })

      const result = await response.json()

      if (!response.ok) throw new Error(result.message || 'Failed to fetch designations')
      setData(result.data || [])
    } catch (error) {
      console.error('Error fetching designations:', error.message)
      toast.error(error.message || 'Something went wrong')
    }
  }

  useEffect(() => {
    if (URL && token) fetchDesignations()
  }, [URL, token]) // ✅ fixed dependency

  const handleEditDesignation = name => {
    setOpen(true)
    setEditValue(name)
  }

  const handleAddPermission = () => {
    setEditValue('')
    setOpen(true) // ✅ open dialog
  }

  const handleDeleteDesignation = async designation => {
    if (!designation?._id) return

    const endpoint = `${URL}/admin/designation/${designation._id}`

    try {
      const response = await fetch(endpoint, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      })

      const result = await response.json()

      if (!response.ok) throw new Error(result.message || 'Failed to delete designation')

      toast.success(result.message || 'Designation deleted successfully', { autoClose: 700 })
      fetchDesignations()
    } catch (error) {
      console.error('Delete error:', error)
      toast.error(error.message || 'Failed to delete designation')
    }
  }

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
            {permissions && permissions?.['hasDesignationEditPermission'] && (

              <IconButton onClick={() => handleEditDesignation(row.original)}>
                <i className='tabler-edit text-textSecondary' />
              </IconButton>
            )}


            <IconButton onClick={() => {
              const confirmDelete = window.confirm('Are you sure you want to delete this designation?')

              if (confirmDelete) handleDeleteDesignation(row.original)
            }}>
              <i className='tabler-trash text-textdanger' />
            </IconButton>
          </div>
        ),
        enableSorting: false
      })
    ],
    [permissions]
  )

  const table = useReactTable({
    data,
    columns,
    state: {
      rowSelection,
      globalFilter
    },
    filterFns: { fuzzy: fuzzyFilter },
    globalFilterFn: fuzzyFilter,
    onRowSelectionChange: setRowSelection,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    getFacetedMinMaxValues: getFacetedMinMaxValues(),
    initialState: {
      pagination: {
        pageSize: 9
      }
    },
    enableRowSelection: true
  })

  return (
    <>
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
              placeholder='Search Designation'
              className='max-sm:is-full'
            />
            {permissions && permissions?.['hasDesignationAddPermission'] && (
              <OpenDialogOnElementClick
                element={Button}
                elementProps={{
                  variant: 'contained',
                  children: 'Add Designation',
                  onClick: handleAddPermission,
                  className: 'max-sm:is-full',
                  startIcon: <i className='tabler-plus' />
                }}
                dialog={DesignationDialog}
                dialogProps={{ editValue, fetchDesignations, nameData }}
              />
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
                {table.getRowModel().rows.map(row => (
                  <tr key={row.id} className={classnames({ selected: row.getIsSelected() })}>
                    {row.getVisibleCells().map(cell => (
                      <td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            )}
          </table>
        </div>

        <TablePaginationComponent table={table} />
      </Card>

      <DesignationDialog
        open={open}
        setOpen={setOpen}
        data={editValue}
        fetchDesignations={fetchDesignations}
        nameData={nameData}
      />
    </>
  )
}

export default DesignationComponent
