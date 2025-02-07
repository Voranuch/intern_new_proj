import {
  Admin,
  Resource,
} from 'react-admin';
import { Layout } from './Layout';
import { dataProvider } from './dataProvider';
import UserList from './pages/users/user-list';
import UserShow from './pages/users/user-show';
import UserEdit from './pages/users/user-edit';
import UserCreate from './pages/users/user-create';
import ModelList from './pages/model/model-list';
import ModelShow from './pages/model/model-show';
import ModelEdit from './pages/model/model-edit';
import ModelCreate from './pages/model/model-create';
import ArticleRoundedIcon from '@mui/icons-material/ArticleRounded';
import PersonRoundedIcon from '@mui/icons-material/PersonRounded';
import { HomePage } from './pages/homepage';
import { authProvider } from './authProvider';

export const App = () => (
  <Admin layout={Layout} dataProvider={dataProvider} dashboard={HomePage} authProvider={authProvider} >
    <Resource icon={PersonRoundedIcon} name="users" list={UserList} show={UserShow} edit={UserEdit} create={UserCreate}/>
    <Resource icon={ArticleRoundedIcon} name="model" list={ModelList} show={ModelShow} edit={ModelEdit} create={ModelCreate}/>
  </Admin>
);
