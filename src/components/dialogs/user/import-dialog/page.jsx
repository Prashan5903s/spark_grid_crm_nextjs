'use client'

// React Imports
import { Fragment, useState } from 'react'

// -------------------- MUI Imports --------------------
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
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
  TablePagination
} from '@mui/material';

// -------------------- External Library Imports --------------------
import { toast } from 'react-toastify';
import { useDropzone } from 'react-dropzone';

// -------------------- Internal/Custom Imports --------------------
import { useApi } from '../../../../utils/api';
import AppReactDropzone from '@/libs/styles/AppReactDropzone';

const ImportDialog = ({ open, setOpen }) => {

  // States
  const [secondDialog, setSecondDialog] = useState(false)
  const [userInput, setUserInput] = useState(false)
  const { doDelete } = useApi();
  const [progress, setProgress] = useState(0); // Progress state
  const [loading, setLoading] = useState(false); // Loading state
  const [fileInput, setFileInput] = useState(null);
  const [data, setData] = useState([]);

  const { getRootProps, getInputProps } = useDropzone({
    // maxFiles: 1,
    multiple: false,
    maxSize: 2000000,
    accept: {
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx']
    },

  });


  const handleRemoveFile = () => {

    setData([]);
    setFileInput(null)
    setUploadData([]);
  }

  const handleConfirmation = async (value) => {
    setUserInput(value)
    setOpen(false)
  };

  return (
    <>
      <Dialog fullWidth open={open} onClose={() => setOpen(false)} closeAfterTransition={false}>
        <DialogContent className='flex items-center flex-col text-center sm:pbs-16 sm:pbe-6 sm:pli-16'>
          <>

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
                    <LinearProgress variant='determinate' value={progress} />
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
                  <div className='buttons'>
                    <Button color='error' variant='outlined' onClick={handleRemoveFile}>
                      Remove All
                    </Button>
                    <Button variant='contained' onClick={handleUploadData} disabled={uploadData.length === 0}>Upload Students</Button>
                  </div>
                </>
              ) : null}
            </AppReactDropzone>

            {/* {data.length > 0 ? tableItems : ''} */}


          </>
        </DialogContent>
        <DialogActions className='justify-center pbs-0 sm:pbe-16 sm:pli-16'>

          <Button
            variant='tonal'
            color='secondary'
            onClick={() => {
              handleConfirmation(false)
            }}
          >
            Cancel
          </Button>
        </DialogActions>
      </Dialog >
    </>
  )
}

export default ImportDialog
