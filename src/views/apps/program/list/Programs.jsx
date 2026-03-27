import { useState, useEffect } from 'react'

// Next Imports
import Link from 'next/link'
import { useParams } from 'next/navigation'

// MUI Imports
import Grid from '@mui/material/Grid2'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Chip from '@mui/material/Chip'
import { IconButton, Tooltip } from '@mui/material'
import Button from '@mui/material/Button'
import FormControl from '@mui/material/FormControl'
import FormControlLabel from '@mui/material/FormControlLabel'
import LinearProgress from '@mui/material/LinearProgress'
import MenuItem from '@mui/material/MenuItem'
import Pagination from '@mui/material/Pagination'
import Select from '@mui/material/Select'
import Switch from '@mui/material/Switch'
import Typography from '@mui/material/Typography'

// Component Imports
import { useSession } from 'next-auth/react';

import { toast } from 'react-toastify'

import { useApi } from '../../../../utils/api';

// Util Imports
import { getLocalizedUrl } from '@/utils/i18n'

import SkeletonModulesComponent from './SkeletonModulesComponent.jsx'
import PublishTrainingDialog from '../../../../components/dialogs/trainings/publish-module-dialog/page';

const iconStyle = {
  minWidth: '40px',
  width: '40px',
  height: '40px',
  padding: 0,
  borderRadius: '8px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

const Program = props => {
  // Props
  const { searchValue } = props

  // States
  const URL = process.env.NEXT_PUBLIC_API_URL
  const APP_URL = process.env.NEXT_PUBLIC_ASSETS_URL
  const { data: session, status } = useSession();

  const token = session?.user?.token;
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [hideCompleted, setHideCompleted] = useState(true)
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState([])
  const [categories, setCateories] = useState()
  const [activePage, setActivePage] = useState(1); // 0-based index
  const [totalItems, setTotalItems] = useState(0);
  const { doGet, doDelete, doPostFormData } = useApi();

  const [open, setOpen] = useState(false)
  const [cardItems, setCardItems] = useState([]);
  const [module, setModule] = useState();
  const [moduleStatus, setModuleStatus] = useState();

  const itemsPerPage = 12;

  // Hooks
  const { lang: locale } = useParams()

  const placeholderBase64 =
    'data:image/svg+xml;base64,' +
    btoa(`
    <svg xmlns="http://www.w3.org/2000/svg" width="300" height="200">
      <rect width="100%" height="100%" fill="#e0e0e0"/>
    </svg>
  `);

  const getModuleList = async (activePage, keyword = '') => {
    setLoading(true)

    const queryParams = [];

    if (selectedCategory && selectedCategory !== 'All') {
      queryParams.push(`category=${encodeURIComponent(selectedCategory)}`);
    }

    if (keyword) {
      queryParams.push(`keyword=${encodeURIComponent(keyword)}`);
    }

    const query = queryParams.length > 0 ? `&${queryParams.join('&')}` : '';

    const modulesData = await doGet(`admin/trainings/list?page=${activePage + 1}&limit=${itemsPerPage}${query}`);

    setData(prevData => ({
      ...prevData,
      modules: modulesData?.data?.data,
    }));

    setTotalItems(modulesData?.data?.totalItems)
    setActivePage(activePage)
    setLoading(false)
  };

  const loadData = async () => {
    const categoryData = await doGet(`admin/categories?type=training`);

    setData(prevData => ({
      ...prevData,
      categories: categoryData,
    }));
  };

  const handleDelete = async (id) => {
    const endpoint = `admin/training/${id}`;

    if (confirm('Are you sure?')) {
      await doDelete({
        endpoint,
        params: {},
        onSuccess: (response) => {
          toast.success(response.message, { autoClose: 2000 });
          getModuleList(0);
        },
        onError: (error) => {
          toast.error(error.message, { autoClose: 2000 });
        }
      });
    }
  };

  const onUpdateStatusChangeState = (status) => {

    setData(prevData => ({
      ...prevData,
      modules: prevData.modules.map(mod =>
        mod._id === module._id
          ? { ...mod, status: status }  // update only this module
          : mod
      )
    }));

    setModuleStatus(status);
  };

  useEffect(() => {
    if (token && URL) {

      loadData();
      getModuleList(0);

    }

  }, [token, URL]);

  useEffect(() => {
    if (token && URL) {

      getModuleList(0, searchValue);

    }
  }, [token, URL, searchValue]);


  useEffect(() => {
    if (token) {
      // setData(prevData => ({
      //   ...prevData,
      //   modules: [],
      // }));
      setLoading(true)
      getModuleList(activePage);
    }
  }, [token, selectedCategory]);

  const publishModuleDialogHandle = (item) => {

    setOpen(true);
    setModuleStatus(item.status)
    setCardItems(item.cards)
    setModule(item)
  }

  if (loading) return <SkeletonModulesComponent />

  return (
    <Card>
      <CardContent className='flex flex-col gap-6'>
        <div className='flex flex-wrap items-center justify-between gap-2'>
          <div>
            <Typography variant='h5'>My Programs</Typography>
            <Typography>Total {totalItems} trainings you have in your bucket</Typography>
          </div>
          <div className='flex flex-wrap items-center gap-y-4 gap-x-6'>
            <Button
              variant='contained'
              startIcon={<i className='tabler-plus' />}
              component={Link}
              href={getLocalizedUrl(`/apps/program/form`, locale)}
              className='max-sm:is-full'
            >
              Add New Program
            </Button>
            <FormControl fullWidth size='small' className='is-[250px] flex-auto'>
              <Select
                fullWidth
                id='select-course'
                value={selectedCategory} // <-- the selected category
                onChange={e => {
                  const selected = e.target.value;

                  setSelectedCategory(selected);

                }}
                labelId='course-select'
              >
                <MenuItem value='All'>All Categories</MenuItem>
                {data?.categories?.length > 0 ? (
                  data.categories.map((item) => (
                    <MenuItem key={item._id} value={item._id}>
                      {item.name}
                    </MenuItem>
                  ))
                ) : (
                  <MenuItem disabled>No categories</MenuItem>
                )}
              </Select>
            </FormControl>

            {/* <FormControlLabel
              control={<Switch onChange={handleChange} checked={hideCompleted} />}
              label='Hide completed'
            /> */}
          </div>
        </div>
        {data?.modules?.length > 0 ? (
          <Grid container spacing={6}>
            {data.modules.map((item, index) => (
              <Grid size={{ xs: 12, sm: 4, md: 3 }} key={index}>
                <div className='border rounded bs-full'>
                  <div className='pli-2 pbs-2'>
                    <Link href={getLocalizedUrl(`/apps/content-folder/${item._id}`, locale)} className='flex'>
                      <img src={item.image ? `${APP_URL}/${item.image}` : placeholderBase64} alt={item.title} className='is-full' />
                    </Link>
                  </div>

                  <div className='flex flex-col gap-4 p-5'>
                    <div className='flex items-center justify-between'>

                      {item?.category_id?.name && <Chip label={item?.category_id?.name} variant='tonal' size='small' color='secondary' />}
                      <div className='flex items-start'>
                        {/* <Typography className='font-medium mie-1'>{item?.cards?.length}</Typography> */}
                        <i className='tabler-cards text-info mie-2' />
                        <Typography>{`(${item?.cards?.length})`}</Typography>
                      </div>
                    </div>
                    <div className='flex flex-col gap-1'>
                      <Typography
                        variant='h5'
                        component={Link}
                        href={getLocalizedUrl(`/apps/trainings/form/${item._id}`, locale)}
                        className='hover:text-primary'
                      >
                        {item.title}
                      </Typography>
                      {/* <Typography>{item.description}</Typography> */}
                    </div>
                    <div className="flex gap-2">
                      <Tooltip title="Edit">
                        <Button variant="tonal"
                          color="primary"
                          sx={iconStyle}
                          component={Link}
                          href={getLocalizedUrl(`/apps/trainings/form/${item._id}`, locale)}
                        >
                          <i className="tabler-edit" />
                        </Button>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <Button variant="tonal" color="error" onClick={() => { handleDelete(item._id) }} sx={iconStyle}>
                          <i className="tabler-trash" />
                        </Button>
                      </Tooltip>
                      <Tooltip title={item.status === 'draft' ? 'Publish' : 'Unpublish'}>
                        <Button variant="tonal"
                          color={item.status === 'draft' ? 'warning' : 'success'}
                          onClick={() => {
                            publishModuleDialogHandle(item);
                          }} sx={iconStyle}>
                          <i className={`tabler-${item.status === 'published' ? 'arrow-down' : 'arrow-up'}`} />
                        </Button>
                      </Tooltip>
                    </div>

                  </div>
                </div>
              </Grid>
            ))}
            <PublishTrainingDialog open={open} setOpen={setOpen} moduleData={module} type={moduleStatus} onUpdateStatusChangeState={onUpdateStatusChangeState} cardItems={cardItems} />
          </Grid>
        ) : (
          <Typography className='text-center'>No Trainings Found</Typography>
        )}
        <div className='flex justify-center'>
          <Pagination
            count={Math.ceil(totalItems / itemsPerPage)}
            page={activePage + 1}
            showFirstButton
            showLastButton
            shape='rounded'
            variant='tonal'
            color='primary'
            onChange={(e, page) => getModuleList(page - 1)}
          />
        </div>
      </CardContent>
    </Card>
  )
}

export default Program
