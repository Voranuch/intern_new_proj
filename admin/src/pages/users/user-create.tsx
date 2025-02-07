import { Create, ReferenceInput, SimpleForm, TextInput,DateInput, SelectInput} from 'react-admin';


const UserCreate = () => {
    return (<Create>
        <SimpleForm>
            <TextInput source="username" />
            <TextInput source="firstname" />
            <TextInput source="lastname" />
            <TextInput source="email" />
            <TextInput source="password" />
            <ReferenceInput source="role_id" reference="roles">
                            {/* The SelectInput will display the role_name, but use role_id for the actual value */}
                <SelectInput optionText="role_name" />
            </ReferenceInput>
            <DateInput source="created_at" />
            <DateInput source="updated_at" />
        </SimpleForm>
    </Create> 
    );
};
 
export default UserCreate;
