import { Datagrid, TextField, EditButton, TextInput, List } from 'react-admin';

const ModelList = () => {
    const modelFilters = [
        <TextInput key="search" source="model_num" label="Search" alwaysOn />,
        <TextInput key="model_num" source="model_num" label="Model" />, // Search filter for model_num
    ];

    return (
        <List filters={modelFilters}>
            <Datagrid>
                <TextField source="model_id" />
                <TextField source="model_num" label="Model Name" /> {/* Display model_num */}
                <EditButton />
            </Datagrid>
        </List>
    );
};

export default ModelList;
