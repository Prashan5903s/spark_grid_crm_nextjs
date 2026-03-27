'use client'

// React Imports

import { useEffect, useState, useMemo } from 'react'

// Next Imports
import { useRouter, useParams } from 'next/navigation';

import Link from 'next/link'

import { useSession } from 'next-auth/react';

import { styled } from '@mui/material/styles'

import { Card, CardHeader, Button, Typography, Chip, Checkbox, IconButton, TablePagination, MenuItem, Dialog, DialogTitle, DialogContent, DialogActions, Snackbar, Alert } from '@mui/material'

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

import { toast } from 'react-toastify';

// Component Imports
import TableFilters from './TableFilters'
import AddUserDrawer from './AddUserDrawer'
import OptionMenu from '@core/components/option-menu'
import TablePaginationComponent from '@components/TablePaginationComponent'
import CustomTextField from '@core/components/mui/TextField'
import CustomAvatar from '@core/components/mui/Avatar'

import UpdatePasswordDialog from '@components/dialogs/user/update-password-dialog/page';

// Util Imports
import { getInitials } from '@/utils/getInitials'
import { getLocalizedUrl } from '@/utils/i18n'

// Style Imports
import tableStyles from '@core/styles/table.module.css'



// Styled Components
const Icon = styled('i')({})

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

const userStatusObj = {
  active: 'success',
  pending: 'warning',
  inactive: 'secondary'
}

const API_URL = process.env.NEXT_PUBLIC_API_URL;

// Column Definitions
const columnHelper = createColumnHelper()

const UserListTable = ({ userData, fetchData }) => {

  const { data: session } = useSession();
  const token = session?.user?.token;

  // States
  const [rowSelection, setRowSelection] = useState({})
  const [data, setData] = useState([])
  const [filteredData, setFilteredData] = useState([])
  const [globalFilter, setGlobalFilter] = useState('')

  const [deleteId, setDeleteId] = useState(null)
  const [openDelete, setOpenDelete] = useState(false)
  const [loadingDelete, setLoadingDelete] = useState(false)
  const [user, setUser] = useState()
  const [open, setOpen] = useState(false)
  const [snack, setSnack] = useState({ open: false, msg: '', type: 'success' })

  const handleDeleteClick = (id) => {
    setDeleteId(id)
    setOpenDelete(true)
  }

  const updateNewPasswordhandle = (row) => {
    setUser(row);
    setOpen(true);
  }

  const handleDeleteConfirm = async () => {
    if (!deleteId) return
    setLoadingDelete(true)

    try {
      const res = await fetch(`${API_URL}/admin/company/${deleteId}/delete`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`
        }
      })

      if (!res.ok) throw new Error('Delete failed')

      // remove from UI
      setData(prev => prev.filter(item => item.id !== deleteId))
      setFilteredData(prev => prev.filter(item => item.id !== deleteId))

      toast.success("User deleted successfully", {
        autoClose: 1000
      })
    } catch (e) {
      setSnack({ open: true, msg: 'Delete failed', type: 'error' })
    } finally {
      setLoadingDelete(false)
      setOpenDelete(false)
      setDeleteId(null)
    }
  }

  const public_url = process.env.NEXT_PUBLIC_ASSETS_URL;

  const router = useRouter();

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

      // columnHelper.accessor('role', {
      //   header: 'Role',
      //   cell: ({ row }) => (
      //     <div className='flex items-center gap-2'>
      //       <Icon
      //         className={userRoleObj[row.original.role].icon}
      //         sx={{ color: `var(--mui-palette-${userRoleObj[row.original.role].color}-main)` }}
      //       />
      //       <Typography className='capitalize' color='text.primary'>
      //         {row.original.role}
      //       </Typography>
      //     </div>
      //   )
      // }),
      // columnHelper.accessor('currentPlan', {
      //   header: 'Plan',
      //   cell: ({ row }) => (
      //     <Typography className='capitalize' color='text.primary'>
      //       {row.original.currentPlan}
      //     </Typography>
      //   )
      // }),
      columnHelper.accessor('company_name', {
        header: 'Company Name',
        cell: ({ row }) => <Typography>{row.original.company_name}</Typography>
      }),
      columnHelper.accessor('phone', {
        header: 'Phone',
        cell: ({ row }) => <Typography>{row.original.phone}</Typography>
      }),
      columnHelper.accessor('address', {
        header: 'Address',
        cell: ({ row }) => <Typography>{row.original.address}</Typography>
      }),
      columnHelper.accessor('status', {
        header: 'Status',
        cell: ({ row }) => (
          <div className='flex items-center gap-3'>
            <Chip
              variant='tonal'
              label={row.original.status ? "Active" : "Inactive"}
              size='small'
              color={userStatusObj[row.original.status ? "active" : "inactive"]}
              className='capitalize'
            />
          </div>
        )
      }),
      columnHelper.accessor('action', {
        header: 'Action',
        cell: ({ row }) => (
          <div className='flex items-center'>
            <IconButton onClick={() => handleDeleteClick(row.original.id)}>
              <i className='tabler-trash text-textSecondary' />
            </IconButton>
            <IconButton>
              <Link href={getLocalizedUrl(`/apps/company/view/${row?.original?.id}`, locale)} className='flex'>
                <i className='tabler-eye text-textSecondary' />
              </Link>
            </IconButton>
            <OptionMenu
              iconButtonProps={{ size: 'medium' }}
              iconClassName='text-textSecondary'
              options={[
                {
                  text: 'Update password',
                  icon: 'tabler-lock',
                  menuItemProps: {
                    className: 'flex items-center gap-2 text-textSecondary',
                    onClick: (() => {
                      updateNewPasswordhandle(row.original);
                    })
                  }
                },
                {
                  text: 'Edit',
                  icon: 'tabler-edit',
                  menuItemProps: {
                    className: 'flex items-center gap-2 text-textSecondary',
                    onClick: (() => {
                      router.push(`/${locale}/apps/company/form/${row.original._id}`)
                    })
                  }
                }
              ]}
            />
          </div>
        ),
        enableSorting: false
      })
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      return <CustomAvatar src={`${public_url}/uploads/images/${avatar}`} size={34} />
    } else {
      return <CustomAvatar size={34}>{getInitials(fullName)}</CustomAvatar>
    }
  }

  return (
    <>
      <Card>
        <CardHeader title='Filters' className='pbe-4' />
        <TableFilters setData={setFilteredData} tableData={data} />
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
            <Button
              color='secondary'
              variant='tonal'
              startIcon={<i className='tabler-upload' />}
              className='max-sm:is-full'
            >
              Export
            </Button>
            <Button
              variant='contained'
              startIcon={<i className='tabler-plus' />}
              onClick={() => router.push(`/${locale}/apps/company/form`)}
              className='max-sm:is-full'
            >
              Add New Company
            </Button>

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
      <Dialog open={openDelete} onClose={() => setOpenDelete(false)}>
        <DialogTitle>Delete Company</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to delete this company?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDelete(false)}>Cancel</Button>
          <Button
            color="error"
            variant="contained"
            onClick={handleDeleteConfirm}
            disabled={loadingDelete}
          >
            {loadingDelete ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
      <>
        <UpdatePasswordDialog open={open} setOpen={setOpen} data={user} />
      </>
    </>
  )
}

export default UserListTable
