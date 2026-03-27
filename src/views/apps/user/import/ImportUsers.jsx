"use client"

import React, { useEffect, useMemo, useState } from 'react';

import {
  Button,
  Typography,
  Card,
  CardHeader,
  CardContent,
  Alert,
  AlertTitle,
  Avatar,
  List,
  ListItem,
  IconButton,
  LinearProgress,
  TablePagination,
  MenuItem,
  Checkbox,
  ListItemText,
  CircularProgress
} from '@mui/material';

import ExcelJS from "exceljs";

import { useDropzone } from 'react-dropzone';

import { toast } from 'react-toastify';

import { object, string, minLength, array } from 'valibot';

import { useForm, Controller } from 'react-hook-form';

import { valibotResolver } from '@hookform/resolvers/valibot';

import classnames from 'classnames';

import { useSession } from 'next-auth/react';

import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getFacetedMinMaxValues,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';

import { rankItem } from '@tanstack/match-sorter-utils';

import CustomTextField from '@core/components/mui/TextField';

import CustomAvatar from '@core/components/mui/Avatar';

import { useApi } from '../../../../utils/api';

import tableStyles from '@core/styles/table.module.css';

import AppReactDropzone from '@/libs/styles/AppReactDropzone';

import TablePaginationComponent from '@/components/TablePaginationComponent';

import ImportSuccessDialog from '@/components/dialogs/user/import-success-dialog/page';

const CHUNK_SIZE = 1;

const schema = object({
  roles: array(
    string([minLength(1, 'Each role must be at least 1 character')]),
    [minLength(1, 'At least one role must be selected')]
  )
});

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

const columnHelper = createColumnHelper()

const ImportUsers = ({ batch, onBack }) => {

  const [data, setData] = useState([]);
  const [uploadData, setUploadData] = useState([]);
  const [missingHeadersData, setMissingHeaders] = useState([]);
  const [fileInput, setFileInput] = useState(null);
  const [loading, setLoading] = useState(false); // Loading state
  const [isProgress, setIsProgress] = useState(false); // Loading state
  const [openSuccessDialog, setOpenSuccessDialog] = useState(false); // Loading state
  const [progress, setProgress] = useState(0); // Progress state
  const [roles, setRoles] = useState([]); // Progress state
  const { data: session } = useSession();
  const { doGet, doPost } = useApi();
  const [selectedRoles, setSelectedRoles] = useState([]);
  const [showError, setShowError] = useState();
  const [userRoles, setUserRoles] = useState([]);

  const token = session?.user?.token;

  const {
    control,
    formState: { errors }
  } = useForm({
    resolver: valibotResolver(schema),
    defaultValues: {
      roles: []
    }
  });

  const { getRootProps, getInputProps } = useDropzone({
    multiple: false,
    maxSize: 2 * 1024 * 1024, // 2MB
    accept: {
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx']
    },

    onDrop: async (acceptedFiles) => {
      
      if (!acceptedFiles?.length) return;

      setFileInput(null);
      setMissingHeaders([]);
      setLoading(true);
      setProgress(0);
      setData([]);

      try {
        
        const selectedFile = acceptedFiles[0];
        const arrayBuffer = await selectedFile.arrayBuffer();

        const workbook = new ExcelJS.Workbook();
        
        await workbook.xlsx.load(arrayBuffer);

        const worksheet = workbook.worksheets[0]; // first sheet
        
        if (!worksheet) throw new Error("Excel file is empty.");

        const requiredHeaders = [
          'SRNO', 'Email', 'FirstName', 'LastName', 'PhoneNo', 'Password', 'ParticipationType',
          'EmpID', 'Address', 'Country', 'State', 'City', 'PinCode', 'LicenseNo', 'Status'
        ];

        const headers = worksheet.getRow(1).values.slice(1).map(h => String(h || "").trim());

        const missingHeadersList = requiredHeaders.filter(h => !headers.includes(h));
        
        if (missingHeadersList.length > 0) {
        
          setMissingHeaders(missingHeadersList);
          setLoading(false);
        
          return;
        }

        const jsonData = [];
        
        worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
        
          if (rowNumber === 1) return; // skip header
        
          const rowValues = row.values.slice(1); // ExcelJS rows are 1-based
          const rowData = {};
        
          headers.forEach((header, idx) => {
            rowData[header] = rowValues[idx] ?? "";
          });
        
          jsonData.push(rowData);
        });

        const rowsWithMissingValues = [];
        
        jsonData.forEach((row, rowIndex) => {
        
          requiredHeaders.forEach(header => {
        
            const value = row[header];
        
            if (value === undefined || value === null || value.toString().trim() === '') {
        
              rowsWithMissingValues.push({ row: rowIndex + 2, header }); // +2: header + 1-based
            }
          });
        });

        if (rowsWithMissingValues.length > 0) {
        
          const errorMsg = rowsWithMissingValues.map(r => `"${r.header}"`).join(', ');
          const msgError = "Missing value in row: " + errorMsg;
        
          setShowError(msgError);
          setLoading(false);
        
          return;
        } else {
        
          setShowError();
        }

        const seen = new Set();
        const duplicates = new Set();

        jsonData.forEach(row => {
        
          const email = (row.Email || '').toLowerCase().trim();
        
          if (!email) return;
        
          if (seen.has(email)) {
        
            duplicates.add(email);
          } else {
        
            seen.add(email);
          }
        });

        if (duplicates.size > 0) {
        
          toast.error(`Duplicate emails found in Excel: ${Array.from(duplicates).join(', ')}`);
        
          setLoading(false);
        
          return;
        }

        setData([]);
        setUploadData(jsonData);
        setFileInput(selectedFile);
        setProgress(100);
        setLoading(false);

      } catch (err) {
        
        toast.error('Error in processing the Excel file.');
      
        setLoading(false);
        setProgress(0);
        setUploadData([]);
        setData([]);
      }
    },

    onDropRejected: (rejectedFiles) => {
      
      setLoading(false);
      setProgress(0);
      setUploadData([]);
      setData([]);

      rejectedFiles.forEach(file => {
        
        file.errors.forEach(error => {
          
          let msg = "";
          
          switch (error.code) {
            case 'file-invalid-type':
              msg = `Invalid file type for ${file.file.name}.`;
              break;
            case 'file-too-large':
              msg = `File ${file.file.name} is too large.`;
              break;
            case 'too-many-files':
              msg = `Too many files selected.`;
              break;
            default:
              msg = `Error with file ${file.file.name}.`;
          }

          toast.error(msg, { hideProgressBar: false });
          setImageError(msg);
        });
      });
    }
  });

  const getRoles = async () => {
    const roleData = await doGet(`company/role`);

    setRoles(roleData);
  }

  const handleRemoveFile = () => {
    setData([]);
    setFileInput(null)
    setUploadData([]);
    setLoading(false);
  }

  useEffect(() => {
    getRoles();
  }, [getRoles]);

  const handleUploadData = async () => {
    try {

      if (userRoles.length == 0) {

        setShowError(`Please choose the role first`)
        setLoading(false);

        return;

      } else {
        setShowError()
      }

      setIsProgress(true);

      const jsonData = uploadData;

      const totalChunks = Math.ceil(jsonData.length / CHUNK_SIZE);

      const final_url = `${process.env.NEXT_PUBLIC_API_URL}/admin/users/import`;

      for (let i = 0; i < totalChunks; i++) {
        const chunk = jsonData.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE);

        const res = await fetch(final_url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ chunk, roles: userRoles }),
        });

        const result = await res.json();

        if (!res.ok) {

          console.log("Result error", result?.message);

          throw new Error(result.message || 'Import failed');
        }

        const percent = Math.round(((i + 1) / totalChunks) * 100);

        setData(prev => [...prev, ...result.data.data]);

        setProgress(percent);

        if (percent == 100) {
          setOpenSuccessDialog(true);
          setUploadData([]);
          setUserRoles([]);
          setIsProgress(false);
        }
      }

    } catch (error) {
      console.error('Error processing the Excel file:', error);
      toast.error('Error in processing the Excel file.', {
        hideProgressBar: false
      });

      setLoading(false); // End loading
      setProgress(0); // Reset progress on error
      setUploadData([]);
      setData([]);
      setIsProgress(false);
    }

  }

  const columns = useMemo(
    () => [
      {
        id: 'serialNumber', // Serial number column
        header: 'S.No.',
        cell: ({ row }) => <Typography>{row.original.SRNO}</Typography>
      },
      columnHelper.accessor('Import Status', {
        header: 'Imported',
        cell: ({ row }) => {
          const hasErrors = row.original?.errors && Object.keys(row.original.errors).length > 0;

          return (
            <Typography color='text.primary'>
              <CustomAvatar skin='light' color={!hasErrors ? 'success' : 'error'}>
                <i className={!hasErrors ? 'tabler-circle-check' : 'tabler-circle-x'} />
              </CustomAvatar>
            </Typography>
          );
        }
      }),

      columnHelper.accessor('FirstName', {
        header: 'First Name',
        cell: ({ row }) => (
          <div className='flex items-center gap-4'>
            <div className='flex flex-col'>
              <Typography color='text.primary' >
                {row.original.FirstName}
              </Typography>
              <Typography variant='body2' color="error">{row.original?.error}</Typography>
            </div>
          </div>
        )
      }),


      columnHelper.accessor('LastName', {
        header: 'Last Name',
        cell: ({ row }) => (
          <div className="flex flex-col">
            <Typography color='text.primary' >
              {row.original.LastName}
            </Typography>
            <Typography variant='body2'>{row.original?.error}</Typography>
          </div>
        )
      }),

      columnHelper.accessor('Email', {
        header: 'Email',
        cell: ({ row }) => (
          <div className="flex flex-col">
            <Typography color='text.primary' >
              {row.original.Email}
            </Typography>
            <Typography variant='body2' color='#FF0000'>{row.original?.errors?.email}</Typography>
          </div>
        )
      }),
      columnHelper.accessor('PhoneNo', {
        header: 'Phone',
        cell: ({ row }) => (
          <div className="flex flex-col">
            <Typography color='text.primary' >
              {row.original.PhoneNo}
            </Typography>
            <Typography variant='body2' color='#FF0000'>{row.original?.errors?.phone}</Typography>
          </div>
        )
      }),

      columnHelper.accessor('EmpId', {
        header: 'EmpID',
        cell: ({ row }) => (
          <div className="flex flex-col">
            <Typography color='text.primary' >
              {row.original.EmpID}
            </Typography>
            <Typography variant='body2' color="#FF0000">{row.original?.errors?.emp_id}</Typography>
          </div>
        )
      }),

      columnHelper.accessor('Country', {
        header: 'Country',
        cell: ({ row }) => (
          <div className="flex flex-col">
            <Typography color='text.primary' >
              {row.original.Country}
            </Typography>
            <Typography variant='body2' color="#FF0000">{row.original?.errors?.country}</Typography>
          </div>
        )
      }),

      columnHelper.accessor('State', {
        header: 'State',
        cell: ({ row }) => (
          <div className="flex flex-col">
            <Typography color='text.primary' >
              {row.original.State}
            </Typography>
            <Typography variant='body2' color="#FF0000">{row.original?.errors?.state}</Typography>
          </div>
        )
      }),

      columnHelper.accessor('City', {
        header: 'City',
        cell: ({ row }) => (
          <div className="flex flex-col">
            <Typography color='text.primary' >
              {row.original.City}
            </Typography>
            <Typography variant='body2' color="#FF0000">{row.original?.errors?.city}</Typography>
          </div>
        )
      }),

      columnHelper.accessor('Designation', {
        header: 'Designation',
        cell: ({ row }) => (
          <div className="flex flex-col">
            <Typography color='text.primary' >
              {row.original.Designation}
            </Typography>
            <Typography variant='body2' color="#FF0000">{row.original?.errors?.designation}</Typography>
          </div>
        )
      }),

      columnHelper.accessor('Department', {
        header: 'Designation',
        cell: ({ row }) => (
          <div className="flex flex-col">
            <Typography color='text.primary' >
              {row.original.Department}
            </Typography>
            <Typography variant='body2' color="#FF0000">{row.original?.errors?.department}</Typography>
          </div>
        )
      }),

      columnHelper.accessor('ParticipationType', {
        header: 'ParticipationType',
        cell: ({ row }) => (
          <div className="flex flex-col">
            <Typography color='text.primary' >
              {row.original.ParticipationType}
            </Typography>
            <Typography variant='body2' color="#FF0000">{row.original?.errors?.participationType}</Typography>
          </div>
        )
      }),

      columnHelper.accessor('EmployeeType', {
        header: 'EmployeeType',
        cell: ({ row }) => (
          <div className="flex flex-col">
            <Typography color='text.primary' >
              {row.original.EmployeeType}
            </Typography>
            <Typography variant='body2' color="#FF0000">{row.original?.errors?.employeeType}</Typography>
          </div>
        )
      }),

      columnHelper.accessor('Zone', {
        header: 'Zone',
        cell: ({ row }) => (
          <div className="flex flex-col">
            <Typography color='text.primary' >
              {row.original.Zone}
            </Typography>
            <Typography variant='body2' color="#FF0000">{row.original?.errors?.zone}</Typography>
          </div>
        )
      }),

      columnHelper.accessor('Region', {
        header: 'Region',
        cell: ({ row }) => (
          <div className="flex flex-col">
            <Typography color='text.primary' >
              {row.original.Region}
            </Typography>
            <Typography variant='body2' color="#FF0000">{row.original?.errors?.zone}</Typography>
          </div>
        )
      }),

      columnHelper.accessor('Branch', {
        header: 'Branch',
        cell: ({ row }) => (
          <div className="flex flex-col">
            <Typography color='text.primary' >
              {row.original.Branch}
            </Typography>
            <Typography variant='body2' color="#FF0000">{row.original?.errors?.zone}</Typography>
          </div>
        )
      }),

      columnHelper.accessor('Status', {
        header: 'Status',
        cell: ({ row }) => (
          <div className="flex flex-col">
            <Typography color='text.primary' >
              {row.original.Status}
            </Typography>
          </div>
        )
      }),
    ],

    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  )

  const table = useReactTable({
    data: data,
    columns,
    filterFns: {
      fuzzy: fuzzyFilter
    },
    initialState: {
      pagination: {
        pageSize: 10
      }
    },
    enableRowSelection: true,
    globalFilterFn: fuzzyFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    getFacetedMinMaxValues: getFacetedMinMaxValues()
  })

  const tableItems = (
    <>
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
                          {(
                            {
                              asc: <i className="tabler-chevron-up text-xl" />,
                              desc: <i className="tabler-chevron-down text-xl" />
                            }[header.column.getIsSorted?.()] ?? null
                          )}

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
    </>
  )

  return (
    <>
      <Card>
        <CardHeader
          title='Import Users'
          action={
            <Button onClick={onBack} variant="outlined" color="primary" size='small'>
              Back
            </Button>
          }
          className='pbe-4'
        />
        <CardContent>
          <div className="flex gap-2 flex-col">
            {showError ? (
              <Alert severity='error'>
                {showError}
              </Alert>
            ) : (

              <Alert severity='info'>
                Note: Allowed only Excel files with *.xls or *.xlsx extension.
              </Alert>
            )}

            {missingHeadersData.length > 0 &&
              <Alert severity='error'
                action={
                  <IconButton size='small' color='inherit' aria-label='close' onClick={() => setMissingHeaders([])}>
                    <i className='tabler-x' />
                  </IconButton>
                }
              >
                <AlertTitle>Missing Headers:</AlertTitle>
                {missingHeadersData.join(', ')}
              </Alert>
            }
            <Typography>Use the same format as given below :<Button className='ml-2' variant='contained' href="/sample/users_import.xlsx" download="Users Sample File">Download</Button></Typography>
            <Controller
              name="roles"
              control={control}
              defaultValue={[]} // ensure it's initialized as an array
              render={({ field }) => (
                <CustomTextField
                  {...field}
                  select
                  fullWidth
                  label="Assign role*"
                  value={userRoles}  // array of role IDs
                  error={!!errors.roles}
                  helperText={errors.roles?.message}
                  slotProps={{
                    select: {
                      multiple: true,
                      onChange: (event) => {
                        const value = event.target.value;

                        setUserRoles(value);
                        field.onChange(value); // update react-hook-form state
                      },
                      renderValue: (selectedIds) => {
                        const selectedNames = roles.filter(role => selectedIds.includes(role._id)).map(role => role.name);

                        return selectedNames.join(', ');
                      }
                    }
                  }}
                >
                  {roles?.length > 0 ? (
                    roles.map((role, index) => (
                      <MenuItem key={index} value={role._id}>
                        <Checkbox checked={userRoles.includes(role._id)} />
                        <ListItemText primary={role.name} />
                      </MenuItem>
                    ))
                  ) : (
                    <MenuItem disabled>No roles</MenuItem>
                  )}
                </CustomTextField>

              )}
            />
          </div>
        </CardContent>
        <div className='overflow-x-auto'>
          <table className={tableStyles.table}>
            <thead>
              {/* <tr>
                {batch ?
                  ExpectedStudentExcelHeadersWithoutBatchId.map((header, index) => (
                    <th key={index}>{header}</th>
                  ))
                  :
                  ExpectedStudentExcelHeaders.map((header, index) => (
                    <th key={index}>{header}</th>
                  ))
                }
              </tr> */}
            </thead>
            <tbody>
              {/* <tr>
                <td colSpan={ExpectedStudentExcelHeaders.length} className='text-center'></td>
              </tr> */}
            </tbody>
          </table>
        </div>
        <CardContent>
          <AppReactDropzone>
            <div {...getRootProps({ className: 'dropzone' })}>
              <input {...getInputProps()} />
              <div className='flex items-center flex-col'>
                <Avatar variant='rounded' className='bs-12 is-12 mbe-9'>
                  <i className='tabler-upload' />
                </Avatar>
                <Typography variant='h4' className='mbe-2.5'>
                  Drop files here or click to upload.
                </Typography>
                <Typography>Allowed *.xls, *.xlsx</Typography>
                <Typography>Max 1 file and max size of 2 MB</Typography>
              </div>
            </div>
            {loading && (
              <div className='flex items-center gap-3'>
                <div className='is-full'>
                  <LinearProgress variant='determinate' color='success' value={progress} />
                </div>
                <Typography variant='body2' color='text.secondary' className='font-medium'>{`${progress}%`}</Typography>
              </div>
            )}
            {fileInput ? (
              <>
                <List>
                  <ListItem>
                    <div className='file-details'>
                      <div className='file-preview'><i className='vscode-icons-file-type-excel w-6 h-6' /></div>
                      <div>
                        <Typography className='file-name'>{fileInput.name}</Typography>
                        <Typography className='file-size' variant='body2'>
                          {Math.round(fileInput.size / 100) / 10 > 1000
                            ? `${(Math.round(fileInput.size / 100) / 10000).toFixed(1)} mb`
                            : `${(Math.round(fileInput.size / 100) / 10).toFixed(1)} kb`}
                        </Typography>
                      </div>
                    </div>
                    <IconButton onClick={() => handleRemoveFile()}>
                      <i className='tabler-x text-xl' />
                    </IconButton>
                  </ListItem>
                </List>
                <div className='flex gap-4 mt-4'>
                  <Button variant='contained' color='warning' onClick={handleRemoveFile} endIcon={<i className='tabler-trash' />}>
                    Remove
                  </Button>

                  <Button variant='contained' onClick={handleUploadData} disabled={uploadData.length === 0 || isProgress} startIcon={<i className='tabler-send' />}>
                    {isProgress ? (
                      <CircularProgress
                        size={24}
                        sx={{
                          color: 'white',
                          position: 'absolute',
                          top: '50%',
                          left: '50%',
                          marginTop: '-12px',
                          marginLeft: '-12px',
                        }}
                      />
                    ) : (
                      'Start Import'
                    )}
                  </Button>
                  {/* <Button color='error' variant='outlined'  onClick={handleRemoveFile}>
                    Remove All
                  </Button>
                  <Button variant='contained' onClick={handleUploadData} disabled={uploadData.length === 0}>Import Users</Button> */}
                </div>
              </>
            ) : null}
          </AppReactDropzone>
        </CardContent>
        {data.length > 0 ? tableItems : ''}
      </Card >
      <ImportSuccessDialog open={openSuccessDialog} setOpen={setOpenSuccessDialog} />
    </>

  );
};

export default ImportUsers;
