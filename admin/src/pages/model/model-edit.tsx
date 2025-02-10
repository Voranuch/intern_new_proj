import { DateInput, Edit, ReferenceInput, SimpleForm, TextInput, Resource} from 'react-admin';

const ModelEdit = () => (

    <Edit resource="model">
    <SimpleForm>
        <TextInput source="model_id" disabled/>
        <TextInput source="model_num" />
    </SimpleForm>
    </Edit>

);

export default ModelEdit;
