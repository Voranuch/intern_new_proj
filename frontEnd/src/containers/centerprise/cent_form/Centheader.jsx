import React, { useEffect, useState } from "react";
import axios from "axios";
import { Container, Row, Col, Form, Button } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import Select from "react-select";

function Centheader() {
  const [formData, setFormData] = useState({});
  const [locations, setLocations] = useState([]);
  const [bea, setBEA] = useState([]);
  const [cp, setCP] = useState([]);
  const [spec, setSpec] = useState([]);
  const [product, setProduct] = useState([]);
  const [changedes, setChangedes] = useState([]);
  const [model, setModel] = useState([]);
  const [modelNum, setModelNum] = useState("");
  const [subOptions, setSubOptions] = useState([]);
  const [currentTime, setCurrentTime] = useState("");
  const [values, setValues] = useState({
    date: "",
    case_no:"",
    fav_level:"",
    model_std:"",
    time:"",
    ref_doc: "",
    pn_pkg_id: "",
    ref_draw:"",
    customer_cent:"",
    new_pn:"",
    change_item:""
  });

  const [productData, setProductData] = useState(null); // Define state to store product data
  const [selectedImage, setSelectedImage] = useState(null);
  const navigate = useNavigate();

  // Fetching required data on component mount
  useEffect(() => {
    axios
      .get("http://localhost:8081/getSubmission")
      .then((res) => setSubOptions(res.data))
      .catch((err) => {
        console.error("Error fetching Submission options:", err);
        alert("Error fetching Submission options.");
      });

    axios
      .get("http://localhost:8081/getAllLocations")
      .then((res) => setLocations(res.data))
      .catch((err) => {
        console.error("Error fetching locations:", err);
        alert("Error fetching locations.");
      });
    
      axios
      .get("http://localhost:8081/getAllBEA")
      .then((res) => setBEA(res.data))
      .catch((err) => {
        console.error("Error fetching locations:", err);
        alert("Error fetching locations.");
      });

      axios
      .get("http://localhost:8081/getAlltypecp")
      .then((res) => setCP(res.data))
      .catch((err) => {
        console.error("Error fetching locations:", err);
        alert("Error fetching locations.");
      });

      axios
      .get("http://localhost:8081/getAllmodel")
      .then((res) => setModel(res.data))
      .catch((err) => {
        console.error("Error fetching locations:", err);
        alert("Error fetching locations.");
      });

      axios
      .get("http://localhost:8081/getAllproduct")
      .then((res) => setProduct(res.data))
      .catch((err) => {
        console.error("Error fetching locations:", err);
        alert("Error fetching locations.");
      });

      axios
      .get("http://localhost:8081/getAllchangedes")
      .then((res) => setChangedes(res.data))
      .catch((err) => {
        console.error("Error fetching locations:", err);
        alert("Error fetching locations.");
      });

      axios
      .get("http://localhost:8081/getAllspec")
      .then((res) => setSpec(res.data))
      .catch((err) => {
        console.error("Error fetching locations:", err);
        alert("Error fetching locations.");
      });

      const intervalId = setInterval(() => {
        setCurrentTime(new Date().toLocaleTimeString()); // Update the time
      }, 1000);
  
      // Clear interval on component unmount
      return () => clearInterval(intervalId);

  }, []);

  useEffect(() => {
    if (values.model_id) {
      fetchData(values.model_id);
    }
  }, [values.model_id]);

  const fetchData = async (model_num) => {
    try {
      const productRes = await axios.get("http://localhost:8081/getProductData", {
        params: { model_num },
      });
      if (productRes.data && productRes.data.product) {
        setProductData(productRes.data.product); // Set product data
      } else {
        alert("Model ID not found in the product database.");
      }
    } catch (error) {
      console.error("Error fetching product data:", error);
      alert("There was an error fetching the data. Please try again later.");
    }
  };
  
  // Handle form submit
  const handleHeaderSubmit = async (e) => {
    e.preventDefault();
  
    // Validate required fields
    if (!values.model_id) {
      alert("Model number is required!");
      return;
    }
  
    try {
      // Check if the model_num exists in the product table
      const productResponse = await axios.get("http://localhost:8081/getProductData", {
        params: { model_num: values.model_id },
      });
  
      if (!productResponse.data || !productResponse.data.product) {
        alert("Product not found in the database! Cannot proceed with form submission.");
        return;
      }
  
      const formattedDate = values.print_date
        ? new Date(values.print_date).toISOString().split("T")[0]
        : "";
  
      const updatedValues = {
        ...values,
        model_id: values.model_id,
        print_date: formattedDate,
        time: currentTime,
      };
  
      // Prepare form data
      const formData = new FormData();
      formData.append("values", JSON.stringify(updatedValues));
      if (selectedImage) {
        formData.append("image", selectedImage);
      }
  
      // Send the form data to the backend
      const response = await axios.post("http://localhost:8081/insertFormheader", formData, {
        headers: {
          "Content-Type": "multipart/form-data", // Important for file uploads
        },
      });
  
      // Success message if insertion is successful
      if (response.data.imageUrl) {
        navigate('/buyoff_form', { 
          state: { 
            model_num: values.model_id, 
            imageUrl: response.data.imageUrl  // Ensure correct image URL from backend response
          } 
        });
      } else {
        navigate("/buyoff_form", { state: { model_num: values.model_id } });
      }
      
    } catch (error) {
      console.error("There was an error:", error);
      alert(`There was an error: ${error.message}`);
    }
  };
  
  
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedImage(file);
      setValues({ ...values, image: file });
    }
  };

  const locationOptions = locations.map((loc) => ({
    value: loc.loca_id,
    label: loc.loca_name,
  }));

  const beaOptions = bea.map((bea) => ({
    value: bea.bea_packing_no,
    label: bea.bea_packing_name,
  }));

  const cpOptions = cp.map((tcp) => ({
    value: tcp.typeofcartonpallet_id,
    label: tcp.typeofcartonpallet_name,
  }));

  const modelOptions = model.map((model) => ({
    value: model.model_id,
    label: model.model_num,
  }));

  const productOptions = product.map((prod) => ({
    value: prod.product_form_id,
    label: prod.product_form_list,
  }));

  const changedestOptions = changedes.map((cd) => ({
    value: cd.change_des_id,
    label: cd.change_des_list,
  }));
  
  const specOptions = spec.map((spec) => ({
    value: spec.spec_id,
    label: spec.spec_no,
  }));
  
  return (
    <Container  style={{ fontFamily: 'var(--font-family)', fontWeight:"bold" , marginTop:"50px"}}>
      <h1 className="text-center my-4" style={{ fontWeight:"bold", marginTop:"20px" }}>Form Submission</h1>
      <div className="mb-4">
        <h2 className="mb-3">General Information</h2>
        <Form onSubmit={handleHeaderSubmit}>
          <Row className="mb-3">
            <Col md={4}>
            <Form.Group controlId="date">
              <Form.Label>Date</Form.Label>
              <Form.Control
                  type="date"
                  value={values.date}
                  onChange={(e) => setValues({ ...values, date: e.target.value })}
                />
            </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group controlId="case_no">
                <Form.Label>Case NO.</Form.Label>
                <Form.Control
                  type="text"
                  value={values.case_no}
                  placeholder="Enter Case NO."
                  onChange={(e) => setValues({ ...values, case_no: e.target.value })}
                />
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group controlId="fav_level">
                <Form.Label>FAV LEVEL</Form.Label>
                <Form.Control
                  type="text"
                  value={0} // Always displays 0
                  readOnly // Prevents user from changing the value
                />
              </Form.Group>
            </Col>
            
          </Row>
          <Row className="mb-3">
          <Col md={4}>
              <Form.Group controlId="model_cent">
                <Form.Label>Model / STD ID</Form.Label>
                <Form.Control
                  type="text"
                  value={values.model_cent}
                  placeholder="Enter Model / STD ID"
                  onChange={(e) => setValues({ ...values, model_cent: e.target.value })}
                />
              </Form.Group> 
            </Col>
            <Col md={4}>
            <Form.Group controlId="current_time">
                <Form.Label>Current Time</Form.Label>
                <Form.Control
                  type="text"
                  value={currentTime}
                  disabled
                  placeholder="Current time will show here"
                />
              </Form.Group>
            </Col>
          <Col md={4}>
              <Form.Group controlId="ref_doc">
                <Form.Label>Reference Document no.#</Form.Label>
                <Form.Control
                  type="text"
                  value={values.ref_doc}
                  placeholder="Enter Model / STD ID"
                  onChange={(e) => setValues({ ...values, ref_doc: e.target.value })}
                />
              </Form.Group>
            </Col>
          </Row>

          <Row className="mb-3">
          <Col md={4}>
              <Form.Group controlId="pn_pkg_id">
                <Form.Label>P/N / PKG. ID</Form.Label>
                <Form.Control
                  type="text"
                  value={values.pn_pkg_id}
                  placeholder="Enter P/N / PKG. ID"
                  onChange={(e) => setValues({ ...values, pn_pkg_id: e.target.value })}
                />
              </Form.Group>
            </Col>
            
            <Col md={4}>
              <Form.Group controlId="customer_cent">
                <Form.Label>Customer</Form.Label>
                <Select
                options={specOptions} 
                value={specOptions.find(opt => opt.value === values.spec_id)} 
                onChange={(selectedOption) => setValues({ ...values, spec_id: selectedOption.value })}
                isSearchable // Enables search functionality
                placeholder="Select a type..."
              />
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group controlId="ref_draw">
                <Form.Label>Reference Drawing Spec. P/N, EC#</Form.Label>
                <Form.Control
                  type="text"
                  value={values.ref_draw}
                  placeholder="Enter Reference Drawing Spec. P/N, EC#"
                  onChange={(e) => setValues({ ...values, ref_draw: e.target.value })}
                />
              </Form.Group>
            </Col>
          
          </Row>

          <Row className="mb-3">
          <Col md={4}>
              <Form.Group controlId="new_pn">
                <Form.Label>New P/N First shipment</Form.Label>
                <Form.Control
                  type="text"
                  value={values.new_pn}
                  placeholder="Enter New P/N First shipment"
                  onChange={(e) => setValues({ ...values, new_pn: e.target.value })}
                />
              </Form.Group>
            </Col>
            <Col md={8}>
            <Form.Group controlId="change_des_id">
            <Form.Label>Change Description</Form.Label>
            <Select
                options={changedestOptions} 
                value={changedestOptions.find(opt => opt.value === values.change_des_id)} 
                onChange={(selectedOption) => setValues({ ...values, change_des_id: selectedOption.value })}
                isSearchable // Enables search functionality
                placeholder="Select a description..."
              />
          </Form.Group>
            </Col>
          
          </Row>
          <Row className="mb-3">
        <Col md={12}>
          <Form.Group controlId="imageUpload">
            <Form.Label>Upload Image</Form.Label>
            <Form.Control
              type="file"
              accept="image/*"
              onChange={handleImageChange}
            />
            {values.image && (
              <div className="mt-3" style={{ display: 'flex', flexDirection: 'row', gap: '10px' }}>
                <img
                  src={URL.createObjectURL(values.image)}
                  alt="Uploaded preview"
                  style={{ width: "200px", height: "auto" }}
                />
                <Button
                  variant="danger"
                  style={{width:'150px',height:'50px', backgroundColor:"red", color:"white", marginTop: "10px" }}
                  size="sm"
                  onClick={() => {
                    setSelectedImage(null);
                    setValues({ ...values, image: null }); // Clear image from values
                  }}
                  className="mt-2"
                >
                  Remove Image
                </Button>
              </div>
            )}
          </Form.Group>
        </Col>
      </Row>
          <div className="text-end mt-3">
          <Button type="submit" variant="primary">
            Submit
          </Button>
          </div>
        </Form>
      </div>
    </Container>
  );
}

export default Centheader;
