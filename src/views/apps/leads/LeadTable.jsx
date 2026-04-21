'use client'

import { useState, useMemo, useEffect } from 'react'

import { useSession } from 'next-auth/react'

import {
  Popover,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Chip,
  Menu,
  MenuItem,
  IconButton,
  Checkbox,
} from '@mui/material'

import Grid from "@mui/material/Grid2"

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

// // Component Imports
import CustomTextField from '@core/components/mui/TextField'
import TablePaginationComponent from '@components/TablePaginationComponent'
import LeadDialog from '@components/dialogs/leads-dialog/page'
import ProposalDialog from '@/components/dialogs/proposal-dialog/page'
import FollowUpTableDialog from '@/components/dialogs/follow_up_table_dialog/page'
import FollowUpDialog from '@/components/dialogs/follow-up-dialog/page'

// Style Imports
import tableStyles from '@core/styles/table.module.css'

import { usePermissionList } from '@/utils/getPermission'

import { getInitials } from '@/utils/getInitials';

import CustomAvatar from '@/@core/components/mui/Avatar'

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

const fuzzyFilter = (row, columnId, value, addMeta) => {
  const itemRank = rankItem(row.getValue(columnId), value)

  addMeta({ itemRank })

  return itemRank.passed
}

const public_url = process.env.NEXT_PUBLIC_ASSETS_URL;

const getAvatar = params => {
  const { avatar, fullName } = params

  if (avatar) {
    return <CustomAvatar src={`${public_url}/${avatar}`} size={34} />
  } else {
    return <CustomAvatar size={34}>{getInitials(fullName)}</CustomAvatar>
  }
}

const columnHelper = createColumnHelper()

function LeadsFilters({
  onApply,
  filters,
  setFilters
}) {

  const { data: session } = useSession()
  const token = session?.user?.token
  const API_URL = process.env.NEXT_PUBLIC_API_URL

  const [createData, setCreateData] = useState();

  const handleChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }))
  }

  const handleReset = () => {
    setFilters({
      search: '',
      leadStatus: '',
      leadSource: '',
      solution: '',
      converted: '',
    })
  }

  const fetchCreateData = async () => {
    try {

      const response = await fetch(`${API_URL}/user/leads/create/data`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`
        }
      })

      const value = await response.json();

      if (response.ok) {

        const data = value?.data;

        setCreateData(data);

      }

    } catch (error) {

      throw new Error(error)
    }
  }

  useEffect(() => {
    if (API_URL && token) {

      fetchCreateData()
    }
  }, [API_URL, token])

  return (
    <div className="p-4 bg-white rounded-xl shadow-sm border">

      {/* FILTERS */}
      <Grid container spacing={2} alignItems="center">
        <Grid item size={{ xs: 12, md: 6 }}>
          <TextField
            select
            fullWidth
            size="small"
            label="Lead Status"
            value={filters.leadStatus || ''}
            onChange={(e) => handleChange('leadStatus', e.target.value)}
          >
            {(createData?.statusData?.length ? createData.statusData : []).map(opt => (
              <MenuItem key={opt?._id} value={opt?._id}>
                {opt?.title}
              </MenuItem>
            ))}
          </TextField>
        </Grid>

        <Grid item size={{ xs: 12, md: 6 }}>
          <TextField
            select
            fullWidth
            size="small"
            label="Lead Source"
            value={filters.leadSource}
            onChange={(e) => handleChange('leadSource', e.target.value)}
          >
            {(createData?.sourceData?.length ? createData?.sourceData : [])?.map(opt => (
              <MenuItem key={opt?._id} value={opt?._id}>{opt?.title}</MenuItem>
            ))}
          </TextField>
        </Grid>

        <Grid item size={{ xs: 12, md: 6 }}>
          <TextField
            select
            fullWidth
            size="small"
            label="Solution"
            value={filters.solution}
            onChange={(e) => handleChange('solution', e.target.value)}
          >
            {(createData?.solutionData ? createData?.solutionData : [])?.map(opt => (
              <MenuItem key={opt?._id} value={opt?._id}>{opt.title}</MenuItem>
            ))}
          </TextField>
        </Grid>

        <Grid item size={{ xs: 12, md: 6 }}>
          <TextField
            select
            fullWidth
            size="small"
            label="Converted"
            value={filters.converted}
            onChange={(e) => handleChange('converted', e.target.value)}
          >
            {[{
              title: "Yes",
              value: "true"
            }, {
              title: "No",
              value: "false"
            }].map(opt => (
              <MenuItem key={opt.value} value={opt.value}>{opt.title}</MenuItem>
            ))}
          </TextField>
        </Grid>

        {/* ACTION BUTTONS */}
        <Grid item size={{ xs: 12, md: 6 }} className="flex gap-2" >
          <Button
            fullWidth
            variant="contained"
            onClick={() => onApply(filters)}
          >
            Apply Filters
          </Button>

          <Button
            fullWidth
            variant="outlined"
            onClick={handleReset}
          >
            Reset
          </Button>
        </Grid>
      </Grid>
    </div>
  )
}

const LeadTable = ({
  tableData,
  setIsTable,
  setOpenTableDialog,
  openFollowUpModal,
  setFollowUpModal,
  selectedLeadId,
  setSelectedLeadId,
  fetchLeadsData,
  permissions,
  openDialog,
  selectedLead,
  setSelectedLead,
  isProposalModalOpen,
  setIsProposalModalOpen,
  setOpenDialog,
}) => {

  const [rowSelection, setRowSelection] = useState({})
  const [filteredData, setFilteredData] = useState([])
  const [globalFilter, setGlobalFilter] = useState('')

  useEffect(() => {
    if (tableData) {

      setFilteredData(tableData)
    }
  }, [tableData])

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
    columnHelper.accessor('first_name', {
      header: 'User',
      cell: ({ row }) => (
        <div className='flex items-center gap-4'>
          {getAvatar({ avatar: "", fullName: row?.original?.name || "" })}
          <div className='flex flex-col'>
            <Typography color='text.primary' className='font-medium'>
              {row?.original?.name || ""}
            </Typography>
            <Typography variant='body2'>{row?.original?.email || ""}</Typography>
          </div>
        </div>
      )
    }),
    columnHelper.accessor('phone', {
      header: 'Phone',
      cell: ({ row }) => (
        <Typography variant='body2' color='text.secondary'>
          {row.original.phone}
        </Typography>
      )
    }),
    columnHelper.accessor('follow_up', {
      header: 'Follow Up',
      cell: ({ row }) => {
        return (
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>

            {/* Add Icon */}
            <i
              className='tabler-plus cursor-pointer icon-btn'
              onClick={() => {

                setSelectedLead(row?.original)
                setSelectedLeadId(row?.original?._id)
                setFollowUpModal(true)
              }}
            />

            {/* View Icon */}
            <i
              className='tabler-eye cursor-pointer icon-btn'
              onClick={() => {

                setSelectedLead(row?.original)
                setSelectedLeadId(row?.original?._id)
                setOpenTableDialog(true)
              }}
            />
            <Typography>{row?.original?.followUp?.length} FollowUp</Typography>
          </div>
        )
      }
    }),
    columnHelper.accessor('proposal', {
      header: 'Send Proposal',
      cell: ({ row }) => {
        return (
          <div
            style={{
              display: 'flex',
              justifyContent: "center",
              gap: '10px',
              alignItems: 'center'
            }}
          >
            {row?.original?.lead_status_id === "69d5dfb78c890e742280d9c9" && (
              <i
                className="tabler-send cursor-pointer icon-btn"
                onClick={() => {
                  setSelectedLeadId(row?.original?._id);
                  setSelectedLead(row?.original);
                  setIsProposalModalOpen(true);
                }}
              />
            )}
          </div>
        );
      }
    }),
    columnHelper.accessor('average_monthly_consumption', {
      header: 'Average Monthly Consumption',
      cell: ({ row }) => (
        <Typography variant='body2' color='text.secondary'>
          {row.original.average_monthly_consumption}
        </Typography>
      )
    }),
    columnHelper.accessor('sanctioned_load', {
      header: 'Sanctioned Load',
      cell: ({ row }) => (
        <Typography variant='body2' color='text.secondary'>
          {row.original.sanctioned_load}
        </Typography>
      )
    }),
    columnHelper.accessor('lead_status', {
      header: 'Status',
      cell: ({ row }) => (
        <Typography variant='body2' color='text.secondary'>
          <span
            style={{
              backgroundColor: row.original?.lead_status?.status.color,
              display: 'inline-block',
              inlineSize: '8px',
              blockSize: '8px',
              borderRadius: '50%',
              insetInlineEnd: '6px'
            }}
          ></span>
          {" "}
          {row.original?.lead_status?.status.title}
        </Typography>
      )
    }),
    columnHelper.accessor('action', {
      header: 'Actions',
      cell: ({ row }) => (
        <div className='flex items-center'>
          {(
            <IconButton
              onClick={() => {

                setIsTable(false)
                setSelectedLead(row.original)
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
    <div>


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
    </div>
  )
}

function KanbanCard({
  lead,
  status,
  setOpenDialog,
  setSelectedLead,
  isProposalModalOpen,
  setFollowUpModal,
  openFollowUpModal,
  openTableDialog,
  setIsProposalModalOpen,
  setOpenTableDialog,
  openDialog,
  setSelectedLeadId,
  selectedLeadId
}) {

  const [anchorEl, setAnchorEl] = useState(null)

  const priortyFun = async ({ id }) => {

    const value = {
      "69c52842a9a39a1b7c89fbe1": "Three Star",
      "69c52842a9a39a1b7c89fbe2": "One Star",
      "69c52842a9a39a1b7c89fbe3": "Two Star"
    }

    return value?.[id];

  }

  return (
    <div
      className="bg-white p-3 rounded-xl shadow-sm transform transition duration-200 hover:scale-95 hover:shadow-md"
      style={{ borderLeft: `4px solid ${status?.color || '#ccc'}` }}
    >
      <div className='flex justify-between'>
        <Typography className='font-medium'>{lead.name}</Typography>
        <i className='tabler-dots-vertical cursor-pointer' onClick={(e) => setAnchorEl(e.currentTarget)} />
      </div>

      <Typography variant='body2'>{lead.email}</Typography>
      <Typography variant='body2'>{lead.company}</Typography>
      <Typography className='mt-1'>{lead.phone}</Typography>
      <Typography variant='caption'>{lead?.followUp?.length} {" Follow Up"}</Typography>



      <div className='flex justify-between items-center mt-2'>
        <Typography variant='caption'>{formatTime(lead.created_at)}</Typography>
      </div>

      {/* MENU */}
      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => setAnchorEl(null)}>
        <MenuItem onClick={() => {

          setSelectedLead(lead)
          setSelectedLeadId(lead?._id)
          setFollowUpModal(true)
        }}>
          Add Follow Up
        </MenuItem>
        <MenuItem onClick={() => {

          setSelectedLead(lead)
          setSelectedLeadId(lead?._id)
          setOpenTableDialog(true)
        }}>
          View Follow Up
        </MenuItem>
        <MenuItem>Convert to Client</MenuItem>
        <MenuItem onClick={() => {

          setAnchorEl(null)
          setOpenDialog(true)
          setSelectedLead(lead)
        }}>
          Edit
        </MenuItem>
      </Menu>
    </div>
  )
}

const applyFilters = (lead, filters, view) => {
  const {
    search,
    leadStatus,
    leadSource,
    solution,
    converted
  } = filters;

  const matchesSearch =
    !search ||
    lead.name?.toLowerCase().includes(search.toLowerCase()) ||
    lead.company_name?.toLowerCase().includes(search.toLowerCase()) ||
    lead.email?.toLowerCase().includes(search.toLowerCase()) ||
    lead.phone?.includes(search);

  // Skip status in kanban (already grouped)
  const matchesStatus =
    !leadStatus || lead.lead_status_id === leadStatus;

  const matchesSource =
    !leadSource || lead.source_id === leadSource;

  const matchesSolution =
    !solution || lead.solution_id === solution;

  //  Correct field: is_converted
  const matchesConverted =
    converted === '' ||
    converted === null ||
    lead.is_converted === (
      converted === 'true' || converted === '1'
    );

  console.log("Result", converted, lead);


  return (
    matchesSearch &&
    matchesStatus &&
    matchesSource &&
    matchesSolution &&
    matchesConverted
  );
};

export default function LeadsPage({
  isTable,
  setIsTable,
  setSelectLeadStatusId,
  selectLeadStatusId,
  tableData,
  fetchLeadsData,
  view,
  setView,
  setLeadsData
}) {

  const [filters, setFilters] = useState({
    search: '',
    leadStatus: '',
    leadSource: '',
    solution: '',
    converted: '',
  })

  const [openDialog, setOpenDialog] = useState(false)
  const [selectedLead, setSelectedLead] = useState(null)
  const [finalData, setFinalData] = useState()

  const [open, setOpen] = useState(false)

  const [anchorEl, setAnchorEl] = useState(null)

  const getPermissions = usePermissionList();
  const [permissions, setPermissions] = useState({});

  const [isProposalModalOpen, setIsProposalModalOpen] = useState(false)

  const [openTableDialog, setOpenTableDialog] = useState(false)
  const [openFollowUpModal, setFollowUpModal] = useState(false)
  const [selectedLeadId, setSelectedLeadId] = useState();

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
  }, [getPermissions]);

  const handleSearch = () => {

    if (view === "kanban") {

      const filtered = tableData.map(group => ({
        ...group,
        leads: (group.leads || []).filter(lead =>
          applyFilters(lead, filters, view)
        )
      }));

      setFinalData(filtered);

    } else {

      const filtered = tableData.filter(lead =>
        applyFilters(lead, filters, view)
      );

      setFinalData(filtered);
    }
  };

  const handleClick = event => {
    setAnchorEl(event.currentTarget)
    setOpen(true)
  }

  const handleClose = () => {
    setAnchorEl(null)
    setOpen(false)
  }

  return (
    <Card className="rounded-2xl shadow-sm">

      {/* HEADER */}
      <CardContent className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <Typography variant="h5" className="font-semibold">Leads</Typography>

        <div className="flex flex-wrap gap-2">
          {/* <Button variant="outlined" startIcon={<i className="tabler-download" />}>Export</Button>
          <Button variant="outlined" startIcon={<i className="tabler-upload" />}>Import</Button> */}
          <Button
            variant="contained"
            startIcon={<i className="tabler-plus" />}
            onClick={() => {
              setIsTable(true)
              setSelectLeadStatusId()
              setOpenDialog(true)
              setSelectedLead(null)
            }}
          >
            Add Lead
          </Button>
        </div>
      </CardContent>

      {/* FILTER BAR */}
      <Grid container spacing={2} className="px-4 pb-4 items-center justify-between">
        <Grid item size={{ xs: 12, md: 6 }}>
          <div className="flex flex-wrap items-center gap-2">
            <TextField
              size="small"
              placeholder="Search leads..."
              value={filters.search}
              onChange={(e) =>
                setFilters(prev => ({ ...prev, search: e.target.value }))
              }
            />
            <Button
              variant="contained"
              startIcon={<i className="tabler-search" />}
              onClick={handleSearch}
            >
              Search
            </Button>
            <Button variant="outlined" color="success" startIcon={<i className="tabler-filter" />} onClick={handleClick} aria-controls="leads-filter-menu">
              Filters
            </Button>
            <Popover slotProps={{ paper: { style: { inlineSize: "800px" } } }} keepMounted id="leads-filter-menu" anchorEl={anchorEl} open={open} onClose={handleClose}>
              <LeadsFilters
                filters={filters}
                setFilters={setFilters}
                onApply={handleSearch}
                handleClose={handleClose}
              />
            </Popover>
          </div>
        </Grid>

        <Grid item size={{ xs: 12, md: 6 }}>
          <div className="flex justify-start md:justify-end gap-2">
            <Button
              size="small"
              variant={view === 'table' ? 'contained' : 'outlined'}
              onClick={() => {

                setView('table')
                setIsTable(true)
                setLeadsData()
              }}
            >
              <i className="tabler-list" />
            </Button>
            <Button
              size="small"
              variant={view === 'kanban' ? 'contained' : 'outlined'}
              onClick={() => {

                setLeadsData()
                setIsTable(false)
                setView('kanban')
              }}
            >
              <i className="tabler-layout-kanban" />
            </Button>
          </div>
        </Grid>
      </Grid>

      {/* TABLE */}
      {view === 'table' && (
        <div className="p-4">
          <LeadTable
            setIsTable={setIsTable}
            isProposalModalOpen={isProposalModalOpen}
            setFollowUpModal={setFollowUpModal}
            openFollowUpModal={openFollowUpModal}
            openTableDialog={openTableDialog}
            setIsProposalModalOpen={setIsProposalModalOpen}
            setOpenTableDialog={setOpenTableDialog}
            openDialog={openDialog}
            setSelectedLeadId={setSelectedLeadId}
            selectedLeadId={selectedLeadId}
            setOpenDialog={setOpenDialog}
            setSelectedLead={setSelectedLead}
            selectedLead={selectedLead}
            tableData={finalData || tableData}
            fetchLeadsData={fetchLeadsData}
            permissions={permissions}
          />
        </div>
      )}

      {/* KANBAN */}
      {view === 'kanban' && (
        <div className="flex gap-4 overflow-x-auto p-4">

          {(finalData ? finalData : tableData)?.map((col, index) => {

            const filteredLeads = (col?.leads || []);

            return (
              <div key={index} className="min-w-[280px] bg-gray-50 rounded-2xl p-3 shadow-sm">
                <div className="flex justify-between items-center mb-3">
                  <Typography className="font-medium"><span
                    style={{
                      backgroundColor: col?.status?.color,
                      display: 'inline-block',
                      inlineSize: '8px',
                      blockSize: '8px',
                      borderRadius: '50%',
                      insetInlineEnd: '6px'
                    }}
                  ></span>{" "}{col?.status?.title || ""}</Typography>
                  <span className="text-xs bg-gray-200 px-2 py-0.5 rounded-full">
                    {filteredLeads.length}
                  </span>
                </div>

                <Button
                  fullWidth
                  size="small"
                  variant="outlined"
                  className="mb-3"
                  onClick={() => {
                    setOpenDialog(true)
                    setSelectedLead()
                    setIsTable(false)
                    setSelectLeadStatusId(col?.status?._id)
                  }}
                >
                  + Add Lead
                </Button>

                <div className="flex flex-col gap-3 max-h-[420px] overflow-y-auto pr-1">
                  {filteredLeads?.length > 0 ?
                    filteredLeads.map((lead, index) => (
                      <KanbanCard
                        isProposalModalOpen={isProposalModalOpen}
                        setFollowUpModal={setFollowUpModal}
                        openFollowUpModal={openFollowUpModal}
                        openTableDialog={openTableDialog}
                        setIsProposalModalOpen={setIsProposalModalOpen}
                        setOpenTableDialog={setOpenTableDialog}
                        openDialog={openDialog}
                        setSelectedLeadId={setSelectedLeadId}
                        selectedLeadId={selectedLeadId}
                        key={index}
                        setOpenDialog={setOpenDialog}
                        setSelectedLead={setSelectedLead}
                        lead={lead}
                        status={col?.status}
                      />
                    ))
                    : (
                      <Typography display={"flex"} justifyContent={"center"} alignItems={"center"}>No Data Found</Typography>
                    )
                  }
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* DIALOG */}
      {openDialog && (
        <LeadDialog
          tableData={finalData || tableData}
          open={openDialog}
          isTable={isTable}
          setOpen={setOpenDialog}
          selectedLead={selectedLead}
          selectLeadStatusId={selectLeadStatusId}
          fetchLeadsData={fetchLeadsData}
          permissionArr={permissions}
        />
      )}
      {
        openFollowUpModal && (
          <FollowUpDialog
            tableData={finalData || tableData}
            open={openFollowUpModal}
            selectedLeadId={selectedLeadId}
            selectedLead={selectedLead}
            fetchLeadsData={fetchLeadsData}
            setOpen={setFollowUpModal}
          />
        )
      }
      {
        openTableDialog && (
          <FollowUpTableDialog
            tableData={selectedLead}
            open={openTableDialog}
            setOpen={setOpenTableDialog}
            selectedLeadId={selectedLeadId}
          />
        )
      }
      {
        isProposalModalOpen && (
          <ProposalDialog
            open={isProposalModalOpen}
            setOpen={setIsProposalModalOpen}
            selectLeadId={selectedLeadId}
            selectedLead={selectedLead}
          />
        )
      }
    </Card>
  )
}
