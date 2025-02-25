import React, { useEffect, useState } from "react";
import axios from "axios";
import successGif from "../successGif.gif";
import { Modal, Button } from "react-bootstrap"; 
import { useLocation, useNavigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import Zoom from 'react-medium-image-zoom';
import 'react-medium-image-zoom/dist/styles.css';


const FormB = () => {
  const location = useLocation();
  const { model_num, imageUrl } = location.state || {}; 
  const [productData, setProductData] = useState(null);
  const [selectedForm, setSelectedForm] = useState('');
  const navigate = useNavigate(); 
  const [formData, setFormData] = useState({
    model_id: "", model_hgst: "", upc: "", ccc: "", workweek: "", qalot_id: "", qty: "", package_id: "", driverserial_num_1: "", driverserial_num_2: "", driverserial_num_3: "", driverserial_num_4: "", customer_id: "", customer_hpn_id: "",customer:"", rohs: "",
    country_code: "", date_MFG: "", madeinthai: "", c_madeinthai:"", manufac_wd:"", hdd_p:"", LogoVerification: "", customerserial_num_1: "", customerserial_num_2: "", ds_hkmodel: "", mlc: "", capacity: "", weight: "",
  });
 
  const [masterData, setMasterData] = useState({});
  const [rohsOptions, setRohsOptions] = useState([]);
  const [madeinthai, setMIT] = useState([]);
  const [c_madeinthai, setC_MIT] = useState([]);
  const [manufac_wd, setMANUFAC] = useState([]);
  const [hdd_p, setHDDP] = useState([]);
  const [verifyResults, setVerifyResults] = useState({});
  const [showModal, setShowModal] = useState(false);
  const [locations, setLocations] = useState([]);
  const [customerid, setCustomerid] = useState([]);
  const [customerhpnid, setCustomerHpnid] = useState([]);
  const [loading, setLoading] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const [formSubmitted, setFormSubmitted] = useState(false);
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [
          rohsRes, mitRes, cMitRes, manufacRes, hddRes, customerRes, customerhpnRes, locationsRes, productRes
        ] = await Promise.all([
          axios.get("http://localhost:8081/getRohsOptions"),
          axios.get("http://localhost:8081/getMIT"),
          axios.get("http://localhost:8081/getC_MIT"),
          axios.get("http://localhost:8081/getMANUFAC"),
          axios.get("http://localhost:8081/getHDDP"),
          axios.get("http://localhost:8081/customerid"),
          axios.get("http://localhost:8081/customerhpnid"),
          axios.get("http://localhost:8081/getAllLocations"),
          axios.get("http://localhost:8081/getProductData", { params: { model_num } })
        ]);

        console.log("Fetched Product Data:", productRes.data);  // Add this line to inspect the product data
        
        setRohsOptions(rohsRes.data);
        setMIT(mitRes.data);
        setC_MIT(cMitRes.data);
        setMANUFAC(manufacRes.data);
        setHDDP(hddRes.data);
        setCustomerid(customerRes.data);
        setCustomerHpnid(customerhpnRes.data);
        setLocations(locationsRes.data);

        const formatDate = (date) => {
          if (!date) return "N/A";
          const localDate = new Date(date);
          return `${localDate.getFullYear()}-${String(localDate.getMonth() + 1).padStart(2, "0")}-${String(localDate.getDate()).padStart(2, "0")}`;
      };
      
      if (productRes.data.product) {
          const processedData = { ...productRes.data.product };
          if (processedData.date_MFG) {
              processedData.date_MFG = formatDate(processedData.date_MFG);
          }
          setProductData(processedData);
          setMasterData(processedData);
      } else {
          setAlertMessage("Model ID not found in the product database.");
      }
        } catch (error) {
            console.error("Error fetching data:", error);
            setAlertMessage("There was an error fetching the data. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    fetchData();
}, [model_num]);

  useEffect(() => {
    if (model_num) {
      console.log("Received model number:", model_num);
      // You can now use the model_num for further operations, e.g., fetch related data, display it, etc.
    } else {
      console.log("No model number passed.");
    }
  }, [model_num]);

  

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  useEffect(() => {
    const results = {};

    Object.keys(formData).forEach((key) => {
        let formValue = formData[key];
        let masterValue = key === "model_id" ? masterData.model_num : masterData[key];

        // Format Date Properly (Fix Time Zone Issues)
        const formatDate = (dateString) => {
            if (!dateString) return "N/A";
            const date = new Date(dateString);
            if (isNaN(date)) return "N/A"; // Handle invalid dates
            return date.toISOString().split("T")[0]; // Keep only YYYY-MM-DD
        };

        if (key === "date_MFG") {
            formValue = formatDate(formData[key]); 
            masterValue = formatDate(masterData[key]);
        } else {
            formValue = formValue?.toString().trim();
            masterValue = masterValue?.toString().trim();
        }

        console.log(`Comparing: ${key} | Form Value: ${formValue} | Master Value: ${masterValue}`);

        if (!masterValue || masterValue === "N/A") {
            results[key] = "N/A"; 
        } else if (!formValue || formValue === "N/A") {
            results[key] = "N/A";
        } else if (formValue === masterValue) {
            results[key] = "Passed";
        } else {
            results[key] = "Failed";
        }
    });

    console.log("Verification Results:", results);
    setVerifyResults(results);
}, [formData, masterData, model_num]);
  

  const disabledItems = [
    "model_id","upc","ccc","workweek","qalot_id","driverserial_num_3","driverserial_num_4","country_code","customer_id","customer_hpn_id","customer", "LogoVerification", "customerserial_num_1", "customerserial_num_2", "ds_hkmodel", "mlc", "capacity", "weight",
  ];

  // Mapping of field keys to alternative names
  const alternativeNames = {
    model_id: "Model Number",
    model_hgst: "Model HGST",
    upc: "UPC",
    ccc: "CCC",
    workweek: "Work Week",
    qalot_id: "QA lot ID (Only L-W)",
    qty: "Qty. / (Q)QTY",
    package_id: "Package ID / BOX ID",
    driverserial_num_1: "Driver Serial Number: 1st of left hand-side",
    driverserial_num_2: "Driver Serial Number: 2nd of left hand-side",
    driverserial_num_3: "Driver Serial Number: 3rd of left hand-side",
    driverserial_num_4: "Driver Serial Number: 4th of left hand-side",
    customer_id: "Customer",
    customer_hpn_id: "Customer HPN",
    customer:"Customer",
    rohs: "RoHS",
    madeinthai: "Made In Thailand",
    c_madeinthai: "Country of origin: Made in Thailand",
    manufac_wd: "Manufacturer: Western Digital",
    hdd_p:"Product: Hard Disk Drive",
    country_code: "QTY./Country code (20/TH)",
    date_MFG: "Date of MFG",
    LogoVerification: "Logo Verification",
    customerserial_num_1: "Customer Serial Number: 1st of left hand-side",
    customerserial_num_2: "Customer Serial Number: 2nd of left hand-side",
    ds_hkmodel: "DS /HK model",
    mlc: "MLC",
    capacity: "Capacity",
    weight: "Weight",
  };

  const fieldLabels = {
    model_id: "Model Number",
    model_hgst: "Model HGST",
    upc: "UPC",
    ccc: "CCC",
    workweek: "Workweek",
    qalot_id: "QALot ID",
    qty: "Quantity",
    package_id: "Package ID",
    driverserial_num_1: "Driver Serial Number 1",
    driverserial_num_2: "Driver Serial Number 2",
    driverserial_num_3: "Driver Serial Number 3",
    driverserial_num_4: "Driver Serial Number 4",
    customer_id: "Customer ID",
    customer_hpn_id: "Customer HPN ID",
    customer: "Customer Name",
    rohs: "RoHS Compliance",
    madeinthai: "Made in Thailand",
    c_madeinthai: "Contract Manufacturer Made in Thailand",
    manufac_wd: "Manufacturer Warranty",
    hdd_p: "HDD Part Number",
    country_code: "Country Code",
    date_MFG: "Manufacturing Date",
    LogoVerification: "Logo Verification",
    customerserial_num_1: "Customer Serial Number 1",
    customerserial_num_2: "Customer Serial Number 2",
    ds_hkmodel: "DS HK Model",
    mlc: "MLC",
    capacity: "Capacity",
    weight: "Weight"
  };
  

     
  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Form Data Before Submit:", formData);  // Log form data before submission
    console.log("Master Data Before Submit:", masterData);  // Log master data before submission

    setFormSubmitted(true);

    const requiredFields = [
      "model_id", "model_hgst", "upc", "ccc", "workweek", "qalot_id", "qty", "package_id", 
      "driverserial_num_1", "driverserial_num_2", "driverserial_num_3", "driverserial_num_4", 
      "customer_id","customer_hpn_id", "customer", "rohs", "madeinthai", "c_madeinthai", "manufac_wd", "hdd_p", 
      "country_code", "date_MFG", "LogoVerification", "customerserial_num_1", "customerserial_num_2", 
      "ds_hkmodel", "mlc", "capacity", "weight"
    ];

    const emptyFields = requiredFields.filter(field => 
        !disabledItems.includes(field) && (!formData[field] || formData[field].trim() === "")
      );

    if (emptyFields.length > 0) {
      const missingFields = emptyFields.map(field => fieldLabels[field] || field);
      setAlertMessage(`Please fill out all required fields: ${missingFields.join(", ")}`);
      return;
    }

    const hasFailedItems = Object.values(verifyResults).some(value => value === "Failed");

    if (hasFailedItems) {
      setAlertMessage("Submission failed. Please correct the errors before proceeding.");
      return;
    }

    const formDataWithModelId = {
      ...formData,
      model_id: masterData.model_id || formData.model_id
    };

    console.log("Form Data With Model ID:", formDataWithModelId);  // Log final form data with model ID

    axios.post("http://localhost:8081/insertBuyoffItem", formDataWithModelId)
      .then((res) => {
        console.log("Response from Server:", res);  // Log the response from the server
        if (res.data.success) {
          setShowModal(true);
          setFormData({
            model_id: "", model_hgst: "", upc: "", ccc: "", workweek: "", qalot_id: "", qty: "", package_id: "",
            driverserial_num_1: "", driverserial_num_2: "", driverserial_num_3: "", driverserial_num_4: "",
            customer_id: "",customer_hpn_id: "", customer: "", rohs: "", country_code: "", date_MFG: "", madeinthai: "", c_madeinthai: "",
            manufac_wd: "", hdd_p: "", LogoVerification: "", customerserial_num_1: "", customerserial_num_2: "",
            ds_hkmodel: "", mlc: "", capacity: "", weight: "",
          });
          setAlertMessage(""); 
        } else {
          setAlertMessage("Failed to insert buyoff item: " + res.data.message);
        }
      })
      .catch((err) => {
        console.error("Error inserting buyoff item:", err);
        setAlertMessage("An error occurred while inserting the buyoff item.");
      });
  };
  return (
    <>
    <style>
      {`
        .blurred {
          filter: blur(5px);
          transition: filter 0.3s ease-in-out;
          pointer-events: none; /* Prevent clicking or dragging */
          user-select: none; /* Disable text selection */
        }
        .unblurred {
          filter: none;
        }
      `}
    </style>


    <div className="container mt-5" style={{ fontFamily: 'var(--font-family)', fontWeight:"bold" , marginTop:"50px"}}>
      <h2 className="mb-4" style={{ fontWeight:"bold", marginLeft: "-70px"}}>3.5” Dual brand with PN</h2>
  
      {loading ? (
        <div className="text-center">Loading...</div>
      ) : (
        <div className="row">
        <div className="col-md-8" style={{ marginLeft: "-70px" }}>
        <form>
        {alertMessage && (
            <div className="alert alert-danger text-center" role="alert">
            {alertMessage}
            </div>
        )}
          <table className="table table-bordered table-hover">
            <thead className="table-primary text-center">
              <tr>
                <th style={{padding: "5px", width: "42%"}}>Buyoff Item</th>
                <th style={{padding: "5px", width: "30%"}}>Master Info</th>
                <th style={{padding: "5px", width: "30%"}}>Input</th>
                <th style={{padding: "5px", width: "25%"}}>Result</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(alternativeNames)
                .filter(([key]) => !disabledItems.includes(key)) // Remove disabled items
                .map(([key, label], index) => {
                  return (
                    <tr key={index} style={{ height: "30px" }}>
                      <td style={{ padding: "5px" }}>{label}</td>
                      <td 
                        style={{ padding: "5px" }}
                        className={verifyResults[key] === "Passed" ? "unblurred" : "blurred"}
                      >

                          {key === "model_id" ? (
                            masterData.model_num || "N/A"
                          ) : key === "customer_id" ? (
                            customerid.find((c) => c.customer_id === masterData[key])?.customer_name || "N/A"
                          ) : key === "customer_hpn_id" ? (
                            customerhpnid.find((c) => c.customer_hpn_id === masterData[key])?.customer_hpn_list || "N/A"
                          ) : (
                            masterData[key] || "N/A"
                          )}
                        </td>

                      <td style={{ padding: "5px" }}>
                        {["rohs", "madeinthai", "c_madeinthai", "manufac_wd", "hdd_p", "customer_id", "customer_hpn_id"].includes(key) ? (
                          <select
                            className="form-select"
                            name={key}
                            value={formData[key] || ""}
                            onChange={handleChange}
                          >
                            <option value="">Select Option</option>
                            {key === "rohs" &&
                              rohsOptions.map((option, idx) => <option key={idx} value={option}>{option}</option>)}
                            {key === "customer_id" &&
                              customerid.map((cus) => (
                                <option key={cus.customer_id} value={cus.customer_id}>{cus.customer_name}</option>
                              ))}
                            {key === "customer_hpn_id" &&
                              customerhpnid.map((cus) => (
                                <option key={cus.customer_hpn_id} value={cus.customer_hpn_id}>{cus.customer_hpn_list}</option>
                              ))}
                            {key === "madeinthai" &&
                              madeinthai.map((option, idx) => <option key={idx} value={option}>{option}</option>)}
                            {key === "c_madeinthai" &&
                              c_madeinthai.map((option, idx) => <option key={idx} value={option}>{option}</option>)}
                            {key === "manufac_wd" &&
                              manufac_wd.map((option, idx) => <option key={idx} value={option}>{option}</option>)}
                            {key === "hdd_p" &&
                              hdd_p.map((option, idx) => <option key={idx} value={option}>{option}</option>)}
                          </select>
                        ) : key === "date_MFG" ? (
                          <input
                          type="date"
                          className="form-control"
                          name={key}
                          value={formData[key] || ""}
                          onChange={handleChange}
                        />
                        ) : (
                          <input
                            type="text"
                            className="form-control"
                            name={key}
                            value={formData[key] || ""}
                            onChange={handleChange}
                          />
                        )}
                      </td>
                      <td className="text-center">
                        {verifyResults[key] ? (
                          <span
                            className={`badge ${
                              verifyResults[key] === "Passed" ? "bg-success" : verifyResults[key] === "Failed" ? "bg-danger" : "bg-secondary"
                            }`}
                          >
                            {verifyResults[key]}
                          </span>
                        ) : (
                          <span className="text-muted">N/A</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
  
          <div className="text-end mt-4" style={{marginBottom:"30px"}}>
            <button type="submit" className="btn btn-success btn-lg ms-3" onClick={handleSubmit}>
              Submit
            </button>
          </div>
        </form>

        {/* ✅ Bootstrap Modal for success message */}
        <Modal show={showModal} onHide={() => setShowModal(false)} centered>
            <Modal.Body className="text-center">
            <img src={successGif} alt="Success" width="80" height="80" className="mb-3"/>
            <h4>Submit Successfully!</h4>
            </Modal.Body>
            <Modal.Footer>
            <Button variant="success" onClick={() => {
                setShowModal(false); 
                navigate("/formheader");
                }}> CLOSE </Button>
            </Modal.Footer>
        </Modal>
        </div>

        <div className="col-md-4">
        {imageUrl ? (
          <div>
            <h3>Uploaded Image:</h3>
            <Zoom>
              <img 
                src={`http://localhost:8081${imageUrl}`} 
                alt="Uploaded Image" 
                style={{ width: "145%", height: "auto", cursor: "pointer" }} 
              />
            </Zoom>
          </div>
        ) : (
          <p>No image uploaded.</p>
        )}
      </div>
      </div>
    
  )}
  </div>
  </>
);
};

export default FormB;
