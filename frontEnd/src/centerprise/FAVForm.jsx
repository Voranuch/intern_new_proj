import React, { useState, useEffect } from "react";
import axios from "axios";
import { Container, Form, Table, Row, Col, Button,Modal } from "react-bootstrap";

const FavForm = () => {
    const [stationOptions, setStationOptions] = useState([]);
    const [modelPnOptions, setModelPnOptions] = useState([]);
    const [pfpnOptions, setFPNOptions] = useState([]);
    const [prpnOptions, setRPNOptions] = useState([]);
    const [smallfipOptions, setSmallFIPOptions] = useState([]);
    const [pcbafipOptions, setPCBAFIPOptions] = useState([]);
    const [specialaccessOptions, setSpecialAccessOptions] = useState([]);
    const [anotherlabelOptions, setAnotherLabelOptions] = useState([]);
    const [referOptions, setReferOptions] = useState([]);
    const [labelESDOptions, setLabelESDOptions] = useState([]);
    const [specialLabelOptions, setSpecialLabelOptions] = useState([]);
    const [otherreqOptions, setOtherReqOptions] = useState([]);
    const [uploadedFiles, setUploadedFiles] = useState([]);
    const [viewFile, setViewFile] = useState(null);
    const [isFormSubmitted, setIsFormSubmitted] = useState(false);

  const categories = [
    { title: "Featuring", key: "featuring", fields: [
      "Station", "Model Label P/N", "Model Name on Label","Model Name by Ex Tester", "PPID on Label (Dell)","PPID by Ex Tester (DELL)","Microcode / MLC",
      "Protector - F P/N","Protector - R P/N","Small FIPS P/N","PCBA FIPS P/N","Special accessory (if have)","Another label (if have)"
    ]},
    { title: "Packing", key: "packing", fields: [
      "Station", "Label on ESD MB Bag P/N", "BSN No#","Special label (if have)"
    ]},
    { title: "Box Comp", key: "boxComp", fields: [
      "Box label / Model Name on label", "Box ID No.#", "WD Box ID no. (For dual PN)","Refer Package Sample Label doc.no#","Special label (if have)"
    ]},
    { title: "Pallet Comp", key: "palletComp", fields: [
      "Pallet ID No.", "WD Pallet ID no. (For dual PN)", "Refer Package Sample Label doc.no#", "Special label (if have)"
    ]},
    { title: "Other Requested Items", key: "otherItems", fields: ["Select Requested Item"] },
  ];

  const [formData, setFormData] = useState({
    formHeaderCentId: '',
    featuring: { station_id: '', mdl_pn_id: '', model_name_label: '', model_name_tester: '', ppid_label_dell: '', ppid_tester_dell: '', microcode_mlc: '', protector_fpn_id: '', protector_rpn_id: '', small_fips_pn_id: '',pcba_fips_pn_id: '', special_accessory_id: '',another_label_id: ''  },
    packing: { station_id: '', label_mb_id : '', bsn_no: '', rpn: '', special_label_id : ''},
    boxComp: { box_label: '', box_id_no : '', wd_box_id: '', refer_package_id: '', special_label_id : ''},
    palletComp: { pallet_id: '',wd_pallet_id : '', wd_box_id: '', refer_package_id: '', special_label_id : ''},
    otherItems: { other_req : ''},
  });
  const [teamSignatures, setTeamSignatures] = useState({
    MFG: { name: "", date: "" },
    QC: { name: "", date: "" },
    ME: { name: "", date: "" },
  });

  useEffect(() => {

    axios.get("http://localhost:8081/getStation")
      .then(response => setStationOptions(response.data))
      .catch(error => console.error("Error fetching stations:", error));
    axios.get("http://localhost:8081/getMDLPN")
      .then(response => setModelPnOptions(response.data))
      .catch(error => console.error("Error fetching model P/N:", error));
    axios.get("http://localhost:8081/getProtectorFPN")
      .then(response => setFPNOptions(response.data))
      .catch(error => console.error("Error fetching fpn:", error));
    axios.get("http://localhost:8081/getProtectorRPN")
      .then(response => setRPNOptions(response.data))
      .catch(error => console.error("Error fetching rpn:", error));
    axios.get("http://localhost:8081/getSmallFIP")
      .then(response => setSmallFIPOptions(response.data))
      .catch(error => console.error("Error fetching smallfip:", error));
    axios.get("http://localhost:8081/getPCBAFIP")
      .then(response => setPCBAFIPOptions(response.data))
      .catch(error => console.error("Error fetching pcbafip:", error));
    axios.get("http://localhost:8081/getSpecialAccess")
      .then(response => setSpecialAccessOptions(response.data))
      .catch(error => console.error("Error fetching smallfip:", error));
    axios.get("http://localhost:8081/getAnotherLabel")
      .then(response => setAnotherLabelOptions(response.data))
      .catch(error => console.error("Error fetching pcbafip:", error));
    axios.get("http://localhost:8081/getMDLPN")
      .then(response => setReferOptions(response.data))
      .catch(error => console.error("Error fetching model P/N:", error));
    axios.get("http://localhost:8081/getMDLPN")
      .then(response => setLabelESDOptions(response.data))
      .catch(error => console.error("Error fetching model P/N:", error));
    axios.get("http://localhost:8081/getSpecialLabel")
      .then(response => setSpecialLabelOptions(response.data))
      .catch(error => console.error("Error fetching model P/N:", error));
    axios.get("http://localhost:8081/getOtherreq")
      .then(response => setOtherReqOptions(response.data))
      .catch(error => console.error("Error fetching model P/N:", error));
  }, []);

  const handleFileChange = (event, category) => {
    const files = Array.from(event.target.files);

    files.forEach((file) => {
      const fileType = file.type.split('/')[0];
      const fileName = file.name;

      // Validate file types: images (jpeg, png) and pdf
      if (
        (fileType === 'image' && (fileName.endsWith('.jpeg') || fileName.endsWith('.png'))) ||
        fileType === 'application' && fileName.endsWith('.pdf')
      ) {
        setUploadedFiles((prevFiles) => [...prevFiles, { category, file }]);
      } else {
        alert('Invalid file type. Please upload a JPEG, PNG, or PDF file.');
      }
    });
  };

  const handleRemoveFile = (fileName) => {
    setUploadedFiles((prevFiles) => prevFiles.filter((file) => file.file.name !== fileName));
  };

  const handleViewFile = (file) => {
    if (file.file.type.startsWith('image')) {
      setViewFile(URL.createObjectURL(file.file)); 
    } else if (file.file.type === 'application/pdf') {
      setViewFile(URL.createObjectURL(file.file)); 
    }
  };
  
  const handleCloseModal = () => {
    setViewFile(null); 
  };

  const handleInputChange = (category, field, value) => {
    setFormData((prev) => ({
      ...prev,
      [category]: { ...prev[category], [field]: value },
    }));
  };

  const handleSignatureChange = (team, field, value) => {
    setTeamSignatures((prev) => ({
      ...prev,
      [team]: { ...prev[team], [field]: value },
    }));
  };

  return (
    <Container style={{ fontFamily: 'var(--font-family)', fontWeight:"bold" , marginTop:"50px"}}>
      <h2 className="text-center my-4">Form Submission</h2>
      <Table bordered>
        <thead>
          <tr>
            <th>Items</th>
            <th>Input</th>
            <th>MFG</th>
            <th>QC</th>
            <th>ME</th>
          </tr>
        </thead>
        <tbody>
          {categories.map(({ title, key, fields }, idx) => (
            <React.Fragment key={idx}>
              <tr><td colSpan={5}><strong>{title}</strong></td></tr>
              {fields.map((field, index) => (
                <tr key={index}>
                  <td>{field}</td>
                  <td>
                    {field === "Station" ? (
                      <Form.Select onChange={(e) => handleInputChange(key, field, e.target.value)}>
                        <option value="">Select Station</option>
                        {stationOptions.map((station) => (
                          <option key={station.id} value={station.station_id}>{station.station_name}</option>
                        ))}
                      </Form.Select>
                    ) : field === "Model Label P/N" ? (
                      <Form.Select onChange={(e) => handleInputChange(key, field, e.target.value)}>
                        <option value="">Select Model P/N</option>
                        {modelPnOptions.map((model) => (
                          <option key={model.mdl_pn_id} value={model.mdl_pn_id}>{model.mdl_pn_name}</option>
                        ))}
                      </Form.Select>
                    ) : field === "Protector - F P/N" ? (
                        <Form.Select onChange={(e) => handleInputChange(key, field, e.target.value)}>
                          <option value="">Select Protector - F P/N</option>
                          {pfpnOptions.map((fpn) => (
                            <option key={fpn.protector_fpn_id} value={fpn.protector_fpn_id}>{fpn.protector_fpn_name}</option>
                          ))}
                        </Form.Select>
                    ) : field === "Protector - R P/N" ? (
                        <Form.Select onChange={(e) => handleInputChange(key, field, e.target.value)}>
                          <option value="">Select Protector - R P/N</option>
                          {prpnOptions.map((rpn) => (
                            <option key={rpn.protector_rpn_id} value={rpn.protector_rpn_id}>{rpn.protector_rpn_name}</option>
                          ))}
                        </Form.Select>
                    ) : field === "Small FIPS P/N" ? (
                        <Form.Select onChange={(e) => handleInputChange(key, field, e.target.value)}>
                          <option value="">Select Small FIPS P/N</option>
                          {smallfipOptions.map((sfip) => (
                            <option key={sfip.small_fips_pn_id} value={sfip.small_fips_pn_id}>{sfip.small_fips_pn}</option>
                          ))}
                        </Form.Select>
                    ) : field === "PCBA FIPS P/N" ? (
                        <Form.Select onChange={(e) => handleInputChange(key, field, e.target.value)}>
                          <option value="">Select PCBA FIPS P/N</option>
                          {pcbafipOptions.map((pfip) => (
                            <option key={pfip.pcba_fips_pn_id} value={pfip.pcba_fips_pn_id}>{pfip.pcba_fips_pn}</option>
                          ))}
                            </Form.Select>
                    ) : field === "Special accessory (if have)" ? (
                        <Form.Select onChange={(e) => handleInputChange(key, field, e.target.value)}>
                          <option value="">Select Special accessory</option>
                          {specialaccessOptions.map((sp) => (
                            <option key={sp.special_accessory_id} value={sp.special_accessory_id}>{sp.special_accessory}</option>
                          ))}
                        </Form.Select>
                    ) : field === "Another label (if have)" ? (
                        <Form.Select onChange={(e) => handleInputChange(key, field, e.target.value)}>
                              <option value="">Select Another label</option>
                              {anotherlabelOptions.map((al) => (
                                <option key={al.another_label_id} value={al.another_label_id}>{al.another_label}</option>
                              ))}
                            </Form.Select>
                    ) : field === "Refer Package Sample Label doc.no#" ? (
                        <Form.Select onChange={(e) => handleInputChange(key, field, e.target.value)}>
                        <option value="">Select Refer Package</option>
                        {referOptions.map((refer) => (
                          <option key={refer.mdl_pn_id} value={refer.mdl_pn_id}>{refer.mdl_pn_name}</option>
                        ))}
                      </Form.Select>
                    ) : field === "Label on ESD MB Bag P/N" ? (
                        <Form.Select onChange={(e) => handleInputChange(key, field, e.target.value)}>
                        <option value="">Select Label on ESD MB Bag P/N</option>
                        {labelESDOptions.map((label) => (
                          <option key={label.mdl_pn_id} value={label.mdl_pn_id}>{label.mdl_pn_name}</option>
                        ))}
                      </Form.Select>
                    ) : field === "Special label (if have)" ? (
                        <Form.Select onChange={(e) => handleInputChange(key, field, e.target.value)}>
                        <option value="">Select Special label</option>
                        {specialLabelOptions.map((slabel) => (
                          <option key={slabel.special_label_id} value={slabel.special_label_id}>{slabel.special_label}</option>
                        ))}
                      </Form.Select>
                    ) : field === "Select Requested Item" ? (
                        <Form.Select onChange={(e) => handleInputChange(key, field, e.target.value)}>
                        <option value="">Select Other Requested Items</option>
                        {otherreqOptions.map((other) => (
                          <option key={other.other_req_id} value={other.other_req_id}>{other.other_req}</option>
                        ))}
                      </Form.Select>
                    ) : (
                      <Form.Control type="text" onChange={(e) => handleInputChange(key, field, e.target.value)} />
                    )}
                  </td>
                  {index === 0 && (
              <td rowSpan={fields.length} style={{ verticalAlign: "middle" }}>
                {teamSignatures.MFG.name && `${teamSignatures.MFG.name} (${teamSignatures.MFG.date})`}
              </td>
            )}
            {index === 0 && (
              <td rowSpan={fields.length} style={{ verticalAlign: "middle" }}>
                {teamSignatures.QC.name && `${teamSignatures.QC.name} (${teamSignatures.QC.date})`}
              </td>
            )}
            {index === 0 && (
              <td rowSpan={fields.length} style={{ verticalAlign: "middle" }}>
                {teamSignatures.ME.name && `${teamSignatures.ME.name} (${teamSignatures.ME.date})`}
              </td>
            )}
                </tr>
              ))}
            </React.Fragment>
          ))}
        </tbody>
      </Table>

      <Form.Group>
        <h4>File Upload</h4>

        {/* File Upload Inputs for different categories */}
        {['WI#1', 'Drawing', 'Model label sample sheet', 'Package label sample sheet', 'Visual aid', 'Actual Box label', 'Actual Pallet label'].map((category, index) => (
          <div key={index} className="mb-4">
            <Form.Label>{category}</Form.Label>
            <Form.Control
              type="file"
              multiple
              onChange={(e) => handleFileChange(e, category)}
            />
          </div>
        ))}
        </Form.Group> 
    <Table bordered className="mt-3">
    <thead>
        <tr>
        <th>File Name</th>
        <th>Category</th>
        <th>Action</th>
        </tr>
    </thead>
    <tbody>
        {uploadedFiles.map((file, index) => (
        <tr key={index}>
            <td>
            <Button variant="link" onClick={() => handleViewFile(file)}>
                {file.file.name}
            </Button>
            </td>
            <td>{file.category}</td>
            <td>
            <Button
                variant="danger"
                size="sm"
                onClick={() => handleRemoveFile(file.file.name)}
            >
                Remove
            </Button>
            </td>
        </tr>
        ))}
    </tbody>
    </Table>

    {viewFile && (
    <Modal show={true} onHide={handleCloseModal}>
        <Modal.Header closeButton>
        <Modal.Title>View File</Modal.Title>
        </Modal.Header>
        <Modal.Body>
        {/* Check if the file is a PDF or image */}
        {viewFile.endsWith('.pdf') ? (
            <a href={viewFile} target="_blank" rel="noopener noreferrer">
            Open PDF in new tab
            </a>
        ) : (
            <img src={viewFile} alt="Uploaded content" style={{ width: '100%' }} />
        )}
        </Modal.Body>
    </Modal>
    )}
      <h4>Team Signatures</h4>
      <Table bordered>
        <thead>
          <tr><th>Team</th><th>Name - Surname</th><th>Date</th></tr>
        </thead>
        <tbody>
          {Object.keys(teamSignatures).map((team) => (
            <tr key={team}>
              <td>{team}</td>
              <td>
                <Form.Control
                  type="text"
                  placeholder="Type name here"
                  value={teamSignatures[team].name}
                  onChange={(e) => handleSignatureChange(team, "name", e.target.value)}
                />
              </td>
              <td>
                <Form.Control
                  type="date"
                  value={teamSignatures[team].date}
                  onChange={(e) => handleSignatureChange(team, "date", e.target.value)}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </Table>

      <div className="text-end mt-3" style={{marginBottom:"50px"}}>
        <Button variant="primary">Submit</Button>
      </div>
    </Container>
  );
};

export default FavForm;
