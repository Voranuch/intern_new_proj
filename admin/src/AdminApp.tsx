import {
  Admin,
  Resource,
} from 'react-admin';
import { Layout } from './Layout';
import { dataProvider } from './dataProvider';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import UserList from './pages/users/user-list';
import UserShow from './pages/users/user-show';
import UserEdit from './pages/users/user-edit';
import UserCreate from './pages/users/user-create';
import ModelList from './pages/model/model-list';
import ModelShow from './pages/model/model-show';
import ModelEdit from './pages/model/model-edit';
import ModelCreate from './pages/model/model-create';
import BeaList from './pages/bea/bea-list';
import BeaShow from './pages/bea/bea-show';
import BeaEdit from './pages/bea/bea-edit';
import BeaCreate from './pages/bea/bea-create';
import ArticleRoundedIcon from '@mui/icons-material/ArticleRounded';
import PersonRoundedIcon from '@mui/icons-material/PersonRounded';
import { HomePage } from './pages/homepage';
import { authProvider } from './authProvider';

const AdminApp = () => {
  console.log('✅ AdminApp is rendering...'); // Add this line

  return (
   <Admin layout={Layout} dataProvider={dataProvider}  dashboard={HomePage}  authProvider={authProvider}  >
      <Resource icon={PersonRoundedIcon}  name='users'  list={UserList}  show={UserShow}  edit={UserEdit}  create={UserCreate} />
      <Resource icon={ArticleRoundedIcon}  name='model'  list={ModelList}  show={ModelShow}  edit={ModelEdit}  create={ModelCreate}/>
      <Resource  icon={ArticleRoundedIcon}  name='bea'  list={BeaList}  show={BeaShow}  edit={BeaEdit}  create={BeaCreate}  />
    </Admin>
          
  );
};

export default AdminApp;
