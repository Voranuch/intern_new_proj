import { Create, ReferenceInput, SimpleForm, TextInput,DateInput } from 'react-admin';


const ModelCreate = () => {
    return (<Create>
        <SimpleForm>
            <TextInput source="model_num" />
        </SimpleForm>
    </Create> 
    );
};
 
export default ModelCreate;
