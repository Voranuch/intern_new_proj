import React, { useEffect, useState } from "react";
import axios from "axios";
import { Container, Row, Col, Form, Button } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import Select from "react-select";

function FormHeader() {
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
    loca_id: "",
    bea_packing_no:"",
    change_des_id:"",
    product_form_id: "",
    autocarton_mit:"",
    a_mti_ver:"",
    print_date: "",
    submission: "",
    time:"",
    spec_id: "",
    typeofcartonpallet_id:"",
    image: "",
    model_id: "", // Add model_num here
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
  
    if (!values.typeofcartonpallet_id) {
      alert("Please select a Carton / Pallet Label!");
      return;
    }
  
    if (!values.model_id) {
      alert("Model number is required!");
      return;
    }
  
    try {
      const formData = new FormData();
      formData.append("values", JSON.stringify(values));
      if (selectedImage) {
        formData.append("image", selectedImage);
      }
  
      // ส่งข้อมูลไปยัง backend
      const response = await axios.post("http://localhost:8081/insertFormheader", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
  
      // ตรวจสอบว่ามี URL ของรูปภาพที่อัปโหลดหรือไม่
      const imageUrl = response.data.imageUrl || null;
  
      // สร้าง object สำหรับการ navigate พร้อมกับข้อมูลที่ต้องการส่งไป
      const navigationData = {
        state: {
          model_num: values.model_id,
          imageUrl: imageUrl,
        },
      };
  
      // เปลี่ยนเส้นทางไปยัง Form ที่ถูกต้อง
      if (values.typeofcartonpallet_id === 1) {
        navigate("/formA", navigationData);
      } else if (values.typeofcartonpallet_id === 2) {
        navigate("/formB", navigationData);
      } else if (values.typeofcartonpallet_id === 3) {
        navigate("/formC", navigationData);
      } else {
        alert("Invalid selection! Please choose a valid option.");
      }
  
    } catch (error) {
      console.error("Error submitting the form:", error);
      alert(`Submission failed: ${error.message}`);
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
            <Form.Group controlId="loca_id">
              <Form.Label>Location</Form.Label>
              <Select
                options={locationOptions} 
                value={locationOptions.find(opt => opt.value === values.loca_id)} 
                onChange={(selectedOption) => setValues({ ...values, loca_id: selectedOption.value })}
                isSearchable // Enables search functionality
                placeholder="Select a location..."
              />
            </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group controlId="bea_pack">
                <Form.Label>BEA / PACKING NO.</Form.Label>
                <Select
                options={beaOptions} 
                value={beaOptions.find(opt => opt.value === values.bea_packing_no)} 
                onChange={(selectedOption) => setValues({ ...values, bea_packing_no: selectedOption.value })}
                isSearchable // Enables search functionality
                placeholder="Select a BEA / PACKING NO..."
              />
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group controlId="typeofcartonpallet_label">
                <Form.Label>Carton / Pallet Label</Form.Label>
                <Select
                options={cpOptions} 
                value={cpOptions.find(opt => opt.value === values.typeofcartonpallet_id)} 
                onChange={(selectedOption) => setValues({ ...values, typeofcartonpallet_id: selectedOption.value })}
                isSearchable // Enables search functionality
                placeholder="Select a type..."
              />
              </Form.Group>
            </Col>
            
          </Row>
          <Row className="mb-3">
          <Col md={4}>
              <Form.Group controlId="printdate">
                <Form.Label>Print Date</Form.Label>
                <Form.Control
                  type="date"
                  value={values.print_date}
                  onChange={(e) => setValues({ ...values, print_date: e.target.value })}
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
              <Form.Group controlId="product_form_id">
                <Form.Label>Product</Form.Label>
                <Select
                options={productOptions} 
                value={productOptions.find(opt => opt.value === values.product_form_id)} 
                onChange={(selectedOption) => setValues({ ...values, product_form_id: selectedOption.value })}
                isSearchable // Enables search functionality
                placeholder="Select a product..."
              />
              </Form.Group>
            </Col>
          </Row>

          <Row className="mb-3">
          <Col md={4}>
              <Form.Group controlId="autocarton_mit">
                <Form.Label>AUTO CARTON or MITECSDPS S/W</Form.Label>
                <Form.Control
                  type="text"
                  value={values.autocarton_mit}
                  placeholder="Enter AUTO CARTON or MITECSDPS S/W"
                  onChange={(e) => setValues({ ...values, autocarton_mit: e.target.value })}
                />
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group controlId="a_mti_ver">
                <Form.Label>ASDCPS or MTI VERSION</Form.Label>
                <Form.Control
                  type="text"
                  value={values.a_mti_ver}
                  placeholder="Enter ASDCPS or MTI VERSION"
                  onChange={(e) => setValues({ ...values, a_mti_ver: e.target.value })}
                />
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group controlId="spec_id">
                <Form.Label>SPEC NO.</Form.Label>
                <Select
                options={specOptions} 
                value={specOptions.find(opt => opt.value === values.spec_id)} 
                onChange={(selectedOption) => setValues({ ...values, spec_id: selectedOption.value })}
                isSearchable // Enables search functionality
                placeholder="Select a type..."
              />
              </Form.Group>
            </Col>
          
          </Row>

          <Row className="mb-3">
          <Col md={6}>
              <Form.Group controlId="submission">
                <Form.Label>Submission</Form.Label>
                <Form.Select
                  value={values.submission}
                  onChange={(e) => setValues({ ...values, submission: e.target.value })}
                >
                  <option value="">Select option</option>
                  {subOptions.map((submission, index) => (
                    <option key={index} value={submission}>
                      {submission}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group controlId="model_id">
                <Form.Label>Model Number</Form.Label>
                <Select
                  options={modelOptions}
                  value={modelOptions.find(opt => opt.value === values.model_id)}  // This binds the selected model_num
                  onChange={(selectedOption) => setValues({ ...values, model_id: selectedOption.value })}  // Update the model_num
                  isSearchable
                  placeholder="Select a model..."
                />
              </Form.Group>
            </Col>
          
          </Row>
          <Row className="mb-3">
          <Col md={12}>
          
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

export default FormHeader;
