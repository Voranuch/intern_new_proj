import { DataProvider } from 'react-admin';
import {
  RaRecord,
  GetListParams,
  QueryFunctionContext,
  GetListResult,
  DeleteParams,
  DeleteResult,
  DeleteManyParams,
  DeleteManyResult,
} from 'react-admin';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8081';

// Helper function to fetch data from API
export const fetchData = async (endpoint: string) => {
  try {
    const response = await axios.get(`${API_URL}/${endpoint}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching data:', error);
    throw new Error('Failed to fetch data');
  }
};

// Data provider implementation for React Admin
export const dataProvider: DataProvider = {
  // Fetch list of records
  getList: async <RecordType extends RaRecord>(
    resource: string,
    params: GetListParams & QueryFunctionContext
  ): Promise<GetListResult<RecordType>> => {
    try {
      const url = `${API_URL}/${resource}`;
  
      const pagination = params.pagination || { page: 1, perPage: 10 };
  
      const response = await axios.get(url, {
        params: { page: pagination.page, perPage: pagination.perPage, ...params.filter },
      });
  
      console.log('Fetched data:', response.data); // Log raw response to inspect structure
  
      // Handle different resources (users or model)
      let data;
      if (resource === 'model') {
        // For model, we assume 'model_id' is the unique identifier
        data = response.data.data || response.data;
      } else if (resource === 'users') {
        // For users, we expect a different response structure
        data = response.data.data || response.data;
      } else {
        // If the resource is something else, you might want to adjust accordingly
        data = response.data.data || response.data;
      }
  
      if (!Array.isArray(data)) {
        throw new Error('Invalid API response format');
      }
  
      // Map the data to ensure consistency
      const mappedData = data.map((item: any) => ({
        ...item,
        id: item.id || item.model_id, // Handle different possible ID field names
      }));
  
      return {
        data: mappedData,
        total: response.data.total || data.length, // Use 'total' from API or fallback to the data length
      };
    } catch (error) {
      console.error(`Error fetching ${resource} data:`, error);
      throw new Error('Failed to fetch data');
    }
  },
  
  getOne: async (resource, params) => {
    try {
      const url = `${API_URL}/${resource}/${params.id}`;
      const { data } = await axios.get(url);
  
      if (resource === 'model') {
        if (!data.model_id) {
          throw new Error('Model does not have a model_id field');
        }
        data.id = data.model_id; // Map 'model_id' to 'id' for consistency
      } else {
        if (!data.id) {
          throw new Error('Record does not have an id field');
        }
      }
  
      return { data };
    } catch (error) {
      console.error(`Error fetching ${resource} record by id ${params.id}:`, error);
      throw new Error('Failed to fetch record');
    }
  },
  
  
  // Create a new record
  create: async (resource, params) => {
    try {
        const { data } = await axios.post(`${API_URL}/${resource}`, params.data);

        // Ensure the response has an 'id'
        if (!data.data?.id) {
            throw new Error('Invalid API response: missing id field');
        }

        return { data: data.data }; // ✅ Ensure correct response format
    } catch (error) {
        console.error(`Error creating ${resource}:`, error);
        throw new Error('Failed to create record');
    }
},



  // Update an existing record
  update: async (resource, params) => {
    const { data } = await axios.put(`${API_URL}/${resource}/${params.id}`, params.data);
    console.log('Update response:', data);
  
    // Ensure that the response is wrapped in a 'data' object
    return { data: data.data }; 
  },
  
  
  
  // Delete a record
  delete: async <RecordType extends RaRecord>(
    resource: string,
    params: DeleteParams<RecordType>
  ): Promise<DeleteResult<RecordType>> => {
    try {
      await axios.delete(`${API_URL}/${resource}/${params.id}`);
      return { data: params.previousData! }; // Ensure previousData is defined
    } catch (error) {
      console.error(`Error deleting ${resource}:`, error);
      throw new Error('Failed to delete record');
    }
  },

  // Delete multiple records
  deleteMany: async <RecordType extends RaRecord>(
    resource: string,
    params: DeleteManyParams<RecordType>
  ): Promise<DeleteManyResult<RecordType>> => {
    try {
      await Promise.all(params.ids.map((id) => axios.delete(`${API_URL}/${resource}/${id}`)));
      return { data: params.ids };
    } catch (error) {
      console.error(`Error deleting multiple records from ${resource}:`, error);
      throw new Error('Failed to delete multiple records');
    }
  },

  // Fetch multiple records by IDs
  getMany: async (resource, params) => {
  try {
    const response = await axios.get(`${API_URL}/${resource}`, {
      params: { ids: params.ids.join(',') },
    });

    console.log('Fetched getMany response:', response); // Log full response to inspect structure

    const data = response.data.data || response.data; // Handle different response formats

    if (!Array.isArray(data)) {
      throw new Error('Invalid API response format: Expected an array inside data');
    }

    return { data };  // Return the expected array
  } catch (error) {
    console.error(`Error fetching multiple records from ${resource}:`, error);
    throw new Error('Failed to fetch multiple records');
  }
},


  // Handle many-to-many relationships (e.g., references)
  getManyReference: async () => ({ data: [], total: 0 }),

  // Update multiple records at once
  updateMany: async () => ({ data: [] }),
};

export default dataProvider;
