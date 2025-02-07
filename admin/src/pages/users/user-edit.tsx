import React from 'react';
import { DateInput, Edit, ReferenceInput, SimpleForm, TextInput, PasswordInput, SelectInput } from 'react-admin';

const UserEdit = () => (
    <Edit>
        <SimpleForm>
            <TextInput source="id" disabled />
            <TextInput source="username" />
            <TextInput source="firstname" />
            <TextInput source="lastname" />
            <TextInput source="email" type="email" />

            {/* Optional password field (not required for update) */}
            <PasswordInput source="password" label="New Password" resettable />

            <ReferenceInput source="role_id" reference="roles">
                {/* The SelectInput will display the role_name, but use role_id for the actual value */}
                <SelectInput optionText="role_name" />
            </ReferenceInput>
            <DateInput source="created_at" disabled />
            <DateInput source="updated_at" disabled />
        </SimpleForm>
    </Edit>
);

export default UserEdit;
