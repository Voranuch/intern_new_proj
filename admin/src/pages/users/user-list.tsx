import { Datagrid, DateField, EmailField, List, TextField, EditButton, TextInput } from 'react-admin';

const UserList = () => {
    const userFilters = [
        <TextInput key="search" source="id" label="Search" alwaysOn />,
        <TextInput key="firstname" source="firstname" label="Firstname" />,
        <TextInput key="lastname" source="lastname" label="Lastname" />,
        <TextInput key="username" source="username" label="Username" />,
        <TextInput key="role" source="role" label="Role" />,
    ];

    return (
        <List filters={userFilters}>
            <Datagrid>
                <TextField source="id" />
                <TextField source="username" label="UserName" />
                <TextField source="firstname" label="First Name" />
                <TextField source="lastname" label="Last Name" />
                <EmailField source="email" />
                <TextField source="role_name" label="Role" />
                <DateField source="created_at" />
                <DateField source="updated_at" />
                <EditButton />
            </Datagrid>
        </List>
    );
};

export default UserList;
