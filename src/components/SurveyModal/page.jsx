'use client'

import {
  Dialog,
  DialogActions,
  DialogTitle,
  DialogContent
} from "@mui/material"

import DialogCloseButton from "../dialogs/DialogCloseButton"

const SurveyModalComponent = ({open, onClose}) => {
  return (
    <>
      <Dialog fullWidth maxWidth='lg' scroll='body' open={open} onClose={onClose} sx={{ '& .MuiDialog-paper': { overflow: 'visible' } }}>
        <DialogCloseButton onClick={onClose}><i className="tabler-x" /></DialogCloseButton>
        <DialogTitle variant='h4' className='text-center'>Import Quiz Question</DialogTitle>
      </Dialog>
    </>
  )
}
