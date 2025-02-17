import React, { useEffect, useState } from "react";
import axios from "axios";
import { Container, Row, Col, Form, Button } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import Select from "react-select";

function Centheader() {
  const [formData, setFormData] = useState([]);
  const [productCent, setproductCent] = useState([]);
  const [newPN, setnewPN] = useState([]);
  const [changeitem, setChangeitem] = useState([]);
  const [fav, setFAV] = useState([]);
  const [modelNum, setModelNum] = useState("");
  const [subOptions, setSubOptions] = useState([]);
  const [currentTime, setCurrentTime] = useState("");
  const [values, setValues] = useState({
    date: "",
    case_no:"",
    product_cent_id:"",
    model_std_id: "",
    pn: "",
    pkg_id:"",
    customer_cent: "",
    ref_doc_no:"",
    ref_draw_id:"",
    fav_level_id: "",
    change_item_id:"", 
    newpn_id:"",
    time:"",
  });

  const navigate = useNavigate();

  // Fetching required data on component mount
  useEffect(() => {
    axios
      .get("http://localhost:8081/getProductCent")
      .then((res) => setproductCent(res.data))
      .catch((err) => {
        console.error("Error fetching ProductCent:", err);
        alert("Error fetching ProductCent.");
      });

    axios
      .get("http://localhost:8081/getNewPNCent")
      .then((res) => setnewPN(res.data))
      .catch((err) => {
        console.error("Error fetching NewPNCent:", err);
        alert("Error fetching NewPNCent.");
      });
    
      axios
      .get("http://localhost:8081/getChangeitem")
      .then((res) => setChangeitem(res.data))
      .catch((err) => {
        console.error("Error fetching Changeitem:", err);
        alert("Error fetching Changeitem.");
      });

      axios
      .get("http://localhost:8081/getFavlevel")
      .then((res) => setFAV(res.data))
      .catch((err) => {
        console.error("Error fetching Favlevel:", err);
        alert("Error fetching Favlevel.");
      });

      setValues(prevState => ({
        ...prevState,
        fav_level_id: 1, // Set this explicitly to "level0" by setting fav_level_id to 1
      }));
    
      const intervalId = setInterval(() => {
        setCurrentTime(new Date().toLocaleTimeString()); // Update the time every second
      }, 1000);
    
      return () => clearInterval(intervalId);

  }, []);
  
  // Handle form submit
  const handleHeaderSubmit = async (e) => {
    e.preventDefault();
  
    const updatedValues = {
      date: values.date,
      case_no: values.case_no,
      product_cent_id: values.product_cent_id,
      model_std_id: values.model_std_id,
      pn: values.pn,
      pkg_id: values.pkg_id,
      customer_cent: values.customer_cent,
      ref_doc_no: values.ref_doc_no,
      ref_draw_id: values.ref_draw_id,
      change_item_id: values.change_item_id,
      newpn_id: values.newpn_id,
      fav_level_id: values.fav_level_id || 1,
      time: currentTime,
    };
  
    console.log("Form data being sent:", updatedValues); // Log the data being sent
  
    try {
      const response = await axios.post("http://localhost:8081/insertCentFormheader", updatedValues);
      if (response.data) {
        navigate('/FavForm', { 
          state: { formData: updatedValues }
        });
      }
    } catch (error) {
      console.error("Error during form submission:", error.response?.data || error.message);
      alert(`Error: ${error.response?.data?.message || error.message}`);
    }
  };
  
  
  const productCentOptions = productCent.map((product) => ({
    value: product.product_cent_id,
    label: product.product_cent_name,
  }));

  const newPNOptions = newPN.map((newpn) => ({
    value: newpn.newpn_id,
    label: newpn.newpn_cent_name,
  }));

  const changeitemOptions = changeitem.map((citem) => ({
    value: citem.change_item_id,
    label: citem.change_item_name,
  }));
  
  const favlevelOptions = fav.map((fav) => ({
    value: fav.fav_level_id,
    label: fav.fav_level_name,
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
              <Form.Group controlId="fav_level_id">
                <Form.Label>FAV LEVEL</Form.Label>
                <Select
                  options={favlevelOptions} 
                  value={favlevelOptions.find(opt => opt.value === 1)} // Find and set level0 (fav_level_id = 1) as the default
                  onChange={() => {}} // Disable the select box by not updating the state
                  isDisabled // This makes the select box read-only
                  isSearchable={false} // Optionally, disable search functionality since it's read-only
                />
              </Form.Group>
            </Col>
          </Row>
          <Row className="mb-3">
          <Col md={4}>
              <Form.Group controlId="product_cent_id">
                <Form.Label>Product</Form.Label>
                <Select
                options={productCentOptions} 
                value={productCentOptions.find(opt => opt.value === values.product_cent_id)} 
                onChange={(selectedOption) => setValues({ ...values, product_cent_id: selectedOption.value })}
                isSearchable // Enables search functionality
                placeholder="Select a product..."
              />
              </Form.Group>
            </Col>
          <Col md={4}>
              <Form.Group controlId="model_std_id">
                <Form.Label>Model / STD ID</Form.Label>
                <Form.Control
                  type="text"
                  value={values.model_std_id}
                  placeholder="Enter Model / STD ID"
                  onChange={(e) => setValues({ ...values, model_std_id: e.target.value })}
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
         
          </Row>

          <Row className="mb-3">
          <Col md={4}>
              <Form.Group controlId="ref_doc_no">
                <Form.Label>Reference Document no.#</Form.Label>
                <Form.Control
                  type="text"
                  value={values.ref_doc_no}
                  placeholder="Enter Reference Document no.#"
                  onChange={(e) => setValues({ ...values, ref_doc_no: e.target.value })}
                />
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group controlId="ref_draw_id">
                <Form.Label>Reference Drawing Spec. P/N, EC#</Form.Label>
                <Form.Control
                  type="text"
                  value={values.ref_draw_id}
                  placeholder="Enter Reference Drawing Spec. P/N, EC#"
                  onChange={(e) => setValues({ ...values, ref_draw_id: e.target.value })}
                />
              </Form.Group>
            </Col>
          <Col md={4}>
              <Form.Group controlId="pn">
                <Form.Label>P/N</Form.Label>
                <Form.Control
                  type="text"
                  value={values.pn}
                  placeholder="Enter P/N"
                  onChange={(e) => setValues({ ...values, pn: e.target.value })}
                />
              </Form.Group>
            </Col>
            
          </Row>

          <Row className="mb-3">
          <Col md={4}>
              <Form.Group controlId="pkg_id">
                <Form.Label>PKG. ID</Form.Label>
                <Form.Control
                  type="text"
                  value={values.pkg_id}
                  placeholder="Enter PKG. ID"
                  onChange={(e) => setValues({ ...values, pkg_id: e.target.value })}
                />
              </Form.Group>
            </Col>
          <Col md={4}>
              <Form.Group controlId="customer_cent">
                <Form.Label>Customer</Form.Label>
                <Form.Control
                  type="text"
                  value={values.customer_cent}
                  placeholder="Enter Customer"
                  onChange={(e) => setValues({ ...values, customer_cent: e.target.value })}
                />
              </Form.Group>
            </Col>
          <Col md={4}>
              <Form.Group controlId="new_pn">
                <Form.Label>New P/N First shipment</Form.Label>
                <Select
                options={newPNOptions} 
                value={newPNOptions.find(opt => opt.value === values.newpn_id)} 
                onChange={(selectedOption) => setValues({ ...values, newpn_id: selectedOption.value })}
                isSearchable // Enables search functionality
                placeholder="Select..."
              />
              </Form.Group>
            </Col>
          
          </Row>
          <Row className="mb-3">
          <Col md={12}>
            <Form.Group controlId="change_item_id">
            <Form.Label>Change Description</Form.Label>
            <Select
                options={changeitemOptions} 
                value={changeitemOptions.find(opt => opt.value === values.change_item_id)} 
                onChange={(selectedOption) => setValues({ ...values, change_item_id: selectedOption.value })}
                isSearchable // Enables search functionality
                placeholder="Select..."
              />
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
