'use client'

// React Imports

import { useEffect, useState, useMemo } from 'react'

import { useRouter } from 'next/navigation'

// MUI Imports

import {
  Card,
  CardContent,
  Button,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TablePagination,
  IconButton,
  MenuItem
} from '@mui/material'

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

import CustomTextField from '@core/components/mui/TextField'

import TablePaginationComponent from '@components/TablePaginationComponent'

// Style Imports

import tableStyles from '@core/styles/table.module.css'

import SkeletonTableComponent from '@/components/skeleton/table/page'

import DialogCloseButton from "@/components/dialogs/DialogCloseButton"

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

const EmailTemplateModal = ({ open, onClose, templateData }) => {

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="lg" sx={{ '& .MuiDialog-paper': { overflow: 'visible' } }}>
      <DialogCloseButton onClick={onClose} disableRipple>
        <i className="tabler-x" />
      </DialogCloseButton>
      <DialogTitle>Template Details</DialogTitle>
      <DialogContent dividers>
        <Typography variant="h6" gutterBottom>
          Subject
        </Typography>
        <Typography variant="body1" gutterBottom>
          {templateData?.subject}
        </Typography>
        <Typography variant="h6" gutterBottom>
          Message
        </Typography>
        <Typography
          variant="body1"
          dangerouslySetInnerHTML={{ __html: templateData?.message }}
        />
      </DialogContent>
      <DialogActions sx={{ marginTop: "14px", display: "flex", justifyContent: "center", alignItems: "center" }}>
        <Button onClick={onClose} variant='outlined'>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  )
}

const columnHelper = createColumnHelper()

const Notification = () => {

  const URL = process.env.NEXT_PUBLIC_API_URL
  const { data: session } = useSession()
  const token = session?.user?.token

  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState(null)

  const onCloseTemplateModal = () => {
    setIsTemplateModalOpen(false)
    setSelectedTemplate(null)
  }

  const [rowSelection, setRowSelection] = useState({})
  const [globalFilter, setGlobalFilter] = useState('')
  const [data, setData] = useState()
  const [loading, setLoading] = useState()

  const router = useRouter();

  const fetchNotification = async () => {
    try {
      const response = await fetch(`${URL}/company/notification/data`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      })

      if (response.ok) {

        const result = await response.json()

        setData(result?.data ?? [])

        setLoading(true)

      } else {
        console.error('Failed to fetch data:', response.statusText)
      }
    } catch (error) {
      console.log('Error', error)
    }
  }

  useEffect(() => {
    if (URL && token) {
      fetchNotification()
    }
  }, [URL, token])

  const handleEditPermission = rowData => {

    router.push(`/apps/admin/template/create/${rowData._id}`)

  }

  const handleAddPermission = () => {
    router.push('/apps/admin/template/create')
  }

  const columns = useMemo(() => [
    columnHelper.accessor('template_name', {
      header: 'Template name',
      cell: ({ row }) => <Typography color='text.primary'>{row.original.template_name}</Typography>
    }),
    columnHelper.accessor('subject', {
      header: 'Subject',
      cell: ({ row }) => {
        const subject = row.original.subject || '';
        const truncated = subject.split(' ').slice(0, 5).join(' ');

        return (
          <Typography color="text.primary">
            {subject.split(' ').length > 5 ? `${truncated}...` : truncated}
          </Typography>
        );
      }
    }),
    columnHelper.accessor('message_text', {
      header: 'Message',
      cell: ({ row }) => {

        return (
          <Typography
            className="flex justify-center items-center cursor-pointer"
            onClick={() => {

              setSelectedTemplate(row.original)
              setIsTemplateModalOpen(true)
              
              // your action here
            }}
          >
            <i className="tabler-eye"></i>
          </Typography>
        )
      }
    }),
    columnHelper.accessor('action', {
      header: 'Actions',
      cell: ({ row }) => (
        <IconButton onClick={() => handleEditPermission(row.original)}>
          <i className='tabler-edit text-textSecondary' />
        </IconButton>
      ),
      enableSorting: false
    })
  ], [])

  const table = useReactTable({
    data,
    columns,
    filterFns: { fuzzy: fuzzyFilter },
    state: { rowSelection, globalFilter },
    initialState: {
      pagination: {
        pageSize: 9
      }
    },
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

  if (!loading) {
    return (
      <>
        <SkeletonTableComponent />
      </>
    )
  }

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
              {[5, 7, 9].map(val => (
                <MenuItem key={val} value={val}>{val}</MenuItem>
              ))}
            </CustomTextField>
          </div>
          <div className='flex flex-wrap gap-4'>
            <DebouncedInput
              value={globalFilter ?? ''}
              onChange={value => setGlobalFilter(String(value))}
              placeholder='Search Template'
              className='max-sm:is-full'
            />
            <Button
              variant='contained'
              onClick={handleAddPermission}
              className='max-sm:is-full'
              startIcon={<i className='tabler-plus' />}
            >
              Add Template
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
                  <td colSpan={columns.length} className='text-center'>
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

        <TablePagination
          component={() => <TablePaginationComponent table={table} />}
          count={table.getFilteredRowModel().rows.length}
          rowsPerPage={table.getState().pagination.pageSize}
          page={table.getState().pagination.pageIndex}
          onPageChange={(_, page) => table.setPageIndex(page)}
        />
        <EmailTemplateModal
          open={isTemplateModalOpen}
          onClose={onCloseTemplateModal}
          templateData={selectedTemplate}
        />
      </Card>
    </>
  )
}

export default Notification
