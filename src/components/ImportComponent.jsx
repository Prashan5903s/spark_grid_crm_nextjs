'use client'

import React, { useState, useMemo, useEffect } from 'react'

import {
    Dialog, DialogTitle, DialogActions, Typography, Button,
    Card, CardContent, Alert, Avatar, IconButton, List,
    ListItem, LinearProgress, MenuItem
} from '@mui/material'

import ExcelJS from "exceljs";

import classnames from 'classnames'

import { toast } from 'react-toastify'

import { useDropzone } from 'react-dropzone'

import { useSession } from 'next-auth/react'

import { rankItem } from '@tanstack/match-sorter-utils'

import {
    createColumnHelper,
    flexRender,
    getCoreRowModel,
    useReactTable,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel
} from '@tanstack/react-table'

import CustomTextField from '@/@core/components/mui/TextField'

import AppReactDropzone from '@/libs/styles/AppReactDropzone'

import DialogCloseButton from './dialogs/DialogCloseButton'

import TablePaginationComponent from '@components/TablePaginationComponent'

import tableStyles from '@core/styles/table.module.css'

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

const ImportComponent = ({ open, onClose, setMatchUserId, matchUserId }) => {
    const columnHelper = createColumnHelper()
    const URL = process.env.NEXT_PUBLIC_API_URL
    const { data: session } = useSession() || {}
    const token = session?.user?.token

    const [fileInput, setFileInput] = useState(null)
    const [uploadData, setUploadData] = useState([])
    const [missingHeaders, setMissingHeaders] = useState([])
    const [progress, setProgress] = useState(0)
    const [rowSelection, setRowSelection] = useState({})
    const [loading, setLoading] = useState(false)
    const [globalFilter, setGlobalFilter] = useState('')
    const [srNoArr, setSRNOArr] = useState([])

    const handleRemoveFile = () => {
        setFileInput(null)
        setUploadData([])
        setProgress(0)
        setSRNOArr([])
    }

    useEffect(() => {
        if (open) {
            setFileInput(null)
            setUploadData([])
            setMissingHeaders([])
            setProgress(0)
            setRowSelection({})
            setGlobalFilter('')
            setSRNOArr([])
            setLoading(false)
        }
    }, [open])


    const checkEmployeeId = async (data) => {
        if (!data?.length) return

        try {
            const queryParam = encodeURIComponent(JSON.stringify(data))

            const response = await fetch(`${URL}/company/check/group/empId/${queryParam}`, {
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${token}`
                }
            })

            const result = await response.json()

            if (response.ok) {

                setSRNOArr(result?.data?.unmatch || [])
                setMatchUserId(result?.data?.matchUser || [])
            } else {
                toast.error(result?.message || 'Employee ID check failed')
            }
        } catch (error) {
            console.error("Error checking EmpID:", error)
            toast.error("Error occurred during Employee ID check")
        }
    }

    const handleUploadData = () => {
        if (uploadData.length > 0) {
            toast.success(`${matchUserId.length} users has been imported`, {
                autoClose: 900
            })
            onClose()
        }
    }

    const handleDialogClose = () => {
        onClose();
    };

    const { getRootProps, getInputProps } = useDropzone({

        multiple: false,
        maxSize: 2 * 1024 * 1024,
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
            setUploadData([]);
            setSRNOArr([]);

            try {

                const selectedFile = acceptedFiles[0];
                const arrayBuffer = await selectedFile.arrayBuffer();

                const workbook = new ExcelJS.Workbook();
                
                await workbook.xlsx.load(arrayBuffer);

                const worksheet = workbook.worksheets[0];
                
                if (!worksheet) throw new Error("Excel file is empty.");

                // Read header row
                const headers = worksheet.getRow(1).values.slice(1).map(h => String(h || "").trim());

                const requiredHeaders = ['SRNO', 'EmpID'];
                const missing = requiredHeaders.filter(h => !headers.includes(h));

                if (missing.length) {
                    setMissingHeaders(missing);
                    setLoading(false);
                    
                    return;
                }

                // Read all rows starting from row 2
                const jsonData = [];
                
                worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
                    if (rowNumber === 1) return; // skip header
                    const rowValues = row.values.slice(1); // ExcelJS is 1-based
                    const rowData = {};
                    
                    headers.forEach((header, idx) => {
                        rowData[header] = rowValues[idx] ?? "";
                    });
                    jsonData.push(rowData);
                });

                setUploadData(jsonData);
                setFileInput(selectedFile);

                // Call your existing function
                await checkEmployeeId(jsonData);

            } catch (err) {
                console.error(err);
                toast.error("Error processing Excel file");
            } finally {
                setLoading(false);
            }
        }
    });

    const columns = useMemo(() => [
        columnHelper.accessor('SRNO', {
            header: 'SRNO',
            cell: info => (
                <Typography>{info.getValue()}</Typography>
            ),
        }),
        columnHelper.accessor('EmpID', {
            header: 'Employee ID',
            cell: info => {
                const row = info.row.original;
                const empID = row?.EmpID.toString();
                const isError = srNoArr.includes(empID);

                return (
                    <>
                        <Typography>{info.getValue()}</Typography>
                        {isError && (
                            <Typography variant="body2" color="var(--mui-palette-error-main)">
                                Employee ID does not exist
                            </Typography>
                        )}
                    </>
                );
            },
        }),
    ], [srNoArr]);

    const table = useReactTable({
        data: uploadData,
        columns,
        state: { rowSelection, globalFilter },
        filterFns: { fuzzy: fuzzyFilter },
        globalFilterFn: fuzzyFilter,
        onRowSelectionChange: setRowSelection,
        onGlobalFilterChange: setGlobalFilter,
        getCoreRowModel: getCoreRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getPaginationRowModel: getPaginationRowModel()
    })

    const TableImportComponent = () => (
        <Card className='mt-4'>
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
                        <MenuItem value={200}>200</MenuItem>
                    </CustomTextField>
                </div>
                <div className='flex gap-4 flex-col !items-start max-sm:is-full sm:flex-row sm:items-center'>
                    <DebouncedInput
                        value={globalFilter ?? ''}
                        className='max-sm:is-full min-is-[250px]'
                        onChange={value => setGlobalFilter(String(value))}
                        placeholder='Search Employee ID'
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
                                        <div
                                            className={classnames({
                                                'flex items-center': true,
                                                'cursor-pointer': header.column.getCanSort()
                                            })}
                                            onClick={header.column.getToggleSortingHandler()}
                                        >
                                            {flexRender(header.column.columnDef.header, header.getContext())}
                                            {header.column.getIsSorted() === 'asc' && <i className='tabler-chevron-up text-xl' />}
                                            {header.column.getIsSorted() === 'desc' && <i className='tabler-chevron-down text-xl' />}
                                        </div>
                                    </th>
                                ))}
                            </tr>
                        ))}
                    </thead>
                    <tbody>
                        {table.getRowModel().rows.length === 0 ? (
                            <tr>
                                <td colSpan={columns.length} className='text-center'>No data available</td>
                            </tr>
                        ) : (
                            table.getRowModel().rows.map(row => (
                                <tr key={row.id}>
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
        </Card>
    )

    return (
        <Dialog
            fullWidth
            maxWidth='md'
            scroll='body'
            open={open}
            onClose={onClose}
            sx={{ '& .MuiDialog-paper': { overflow: 'visible' } }}
        >
            <DialogCloseButton onClick={onClose}>
                <i className="tabler-x" />
            </DialogCloseButton>

            <DialogTitle variant='h4' className='text-center'>Import Users</DialogTitle>

            <Card>
                <CardContent>
                    <Alert severity='info'>Note: Allowed only Excel files with *.xls or *.xlsx extension.</Alert>
                    {missingHeaders.length > 0 && (
                        <Alert severity='error'>Missing Headers: {missingHeaders.join(', ')}</Alert>
                    )}
                    <Typography className='mt-3'>
                        Use this format:
                        <span style={{ marginLeft: '0.5rem' }}>
                            <Button variant='outlined' href="/sample/group_import_users.xlsx" download>
                                Download sample file
                            </Button>
                        </span>
                    </Typography>
                </CardContent>

                <CardContent>
                    <AppReactDropzone>
                        <div {...getRootProps()} className='dropzone'>
                            <input {...getInputProps()} />
                            <div className='flex items-center flex-col'>
                                <Avatar variant='rounded' className='bs-12 is-12 mbe-9'><i className='tabler-upload' /></Avatar>
                                <Typography variant='h4'>Drop files here or click to upload</Typography>
                                <Typography>Allowed *.xls, *.xlsx – Max 2 MB</Typography>
                            </div>
                        </div>

                        {loading && (
                            <LinearProgress variant='determinate' color='success' value={progress} />
                        )}

                        {fileInput && (
                            <List className='mt-3'>
                                <ListItem>
                                    <div className='file-details'>
                                        <div className='file-preview'><i className='vscode-icons-file-type-excel w-6 h-6' /></div>
                                        <Typography>{fileInput.name}</Typography>
                                    </div>
                                    <IconButton onClick={handleRemoveFile}><i className='tabler-x text-xl' /></IconButton>
                                </ListItem>
                            </List>
                        )}

                        {uploadData.length > 0 && <TableImportComponent />}
                    </AppReactDropzone>
                </CardContent>
            </Card>

            <DialogActions className='justify-center'>
                {uploadData.length > 0 && (
                    <Button variant='contained' onClick={handleUploadData}>Start Import</Button>
                )}
                <Button variant='tonal' type='button' color='secondary' onClick={handleDialogClose}>Close</Button>
            </DialogActions>
        </Dialog>
    )
}

export default ImportComponent
