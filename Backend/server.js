const express = require('express');
const mysql = require('mysql')
const cors = require('cors')
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const bodyParser = require('body-parser');
const path = require("path");
const multer = require("multer");
const fs = require('fs');
require('dotenv').config();


const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";
console.log("Backend API URL:", API_URL);
const SECRET_KEY = process.env.SECRET_KEY;
console.log("Your secret key is:", SECRET_KEY);

const app = express()
app.use(cors())
app.use(express.json());
app.use(bodyParser.json());

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'public/images');
  },
  filename: (req, file, cb) => {
    cb(null, file.fieldname + "_" + Date.now() + path.extname(file.originalname))
  }
})


const upload = multer({
  storage: storage
})

const db = mysql.createConnection({
    host:"localhost",
    user: 'root',
    password:'',
    database: 'intern_project'
})

app.post("/admin-login", (req, res) => {
  const { username, password } = req.body; // Only expect username and password

  if (!username || !password) {
    return res.status(400).json({ message: "Please provide username and password" });
  }

  const sql = "SELECT * FROM users WHERE username = ?";
  db.query(sql, [username], async (err, result) => {
    if (err) {
      console.error("Database Error:", err);
      return res.status(500).json({ message: "Internal server error" });
    }

    if (result.length === 0) {
      return res.status(401).json({ message: "Invalid username or password" });
    }

    const user = result[0];

    // Verify password
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ message: "Invalid username or password" });
    }

    const roleSql = "SELECT role_name FROM roles WHERE id = ?";
    db.query(roleSql, [user.role_id], (err, roleResult) => {
      if (err) {
        console.error("Error fetching user role:", err);
        return res.status(500).json({ message: "Internal server error" });
      }

      const userRole = roleResult[0]?.role_name;
      if (userRole !== "admin") {
        return res.status(403).json({ message: "Access denied: Admins only" });
      }

      // Generate JWT token for admin
      const token = jwt.sign({ id: user.id, role: userRole }, SECRET_KEY, { expiresIn: "1h" });

      res.json({
        token,
        role: userRole,
        username: user.username,
        email: user.email,
        firstname: user.firstname,
        lastname: user.lastname,
      });
    });
  });
});



app.get('/users', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const perPage = parseInt(req.query.perPage) || 10;
    const offset = (page - 1) * perPage;

    const { id = '', username = '', firstname = '', lastname = '', role = '' } = req.query;

    console.log(`Fetching users - Page: ${page}, PerPage: ${perPage}, Offset: ${offset}`);
    console.log(`Search Filters - ID: ${id}, Username: ${username}, Firstname: ${firstname}, Lastname: ${lastname}, Role: ${role}`);

    // Search filters using LIKE for case-insensitive search
    const searchQuery = `
      SELECT users.*, roles.role_name
      FROM users
      LEFT JOIN roles ON users.role_id = roles.id
      WHERE users.id LIKE ? 
      AND users.username LIKE ? 
      AND users.firstname LIKE ? 
      AND users.lastname LIKE ?
      AND roles.role_name LIKE ?
      LIMIT ? OFFSET ?
    `;

    const searchParams = [
      `%${id}%`, 
      `%${username}%`, 
      `%${firstname}%`, 
      `%${lastname}%`, 
      `%${role}%`, 
      perPage, 
      offset
    ];

    db.query(searchQuery, searchParams, (err, result) => {
      if (err) {
        console.error("❌ Database Query Error:", err.sqlMessage);
        return res.status(500).json({ message: "Database error", error: err.sqlMessage });
      }

      // Count total users matching the search criteria
      const countQuery = `
        SELECT COUNT(*) AS total
        FROM users
        LEFT JOIN roles ON users.role_id = roles.id
        WHERE users.id LIKE ?
        AND users.username LIKE ?
        AND users.firstname LIKE ?
        AND users.lastname LIKE ?
        AND roles.role_name LIKE ?
      `;

      db.query(countQuery, searchParams.slice(0, 5), (countErr, countResult) => {
        if (countErr) {
          console.error("❌ Error fetching total count:", countErr.sqlMessage);
          return res.status(500).json({ message: "Error fetching total count", error: countErr.sqlMessage });
        }

        console.log("✅ Users Fetched Successfully:", result.length);
        return res.json({ data: result, total: countResult[0].total });
      });
    });

  } catch (error) {
    console.error("❌ Unexpected Server Error:", error.message);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
});



app.get('/users/:id', async (req, res) => {
  const userId = req.params.id;
  const query = "SELECT * FROM users WHERE id = ?";

  db.query(query, [userId], (err, result) => {
    if (err) {
      return res.status(500).json({ message: "Error inside server" });
    }
    if (result.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.json(result[0]);  // Remove extra nesting
  });
});

// Update user by ID
app.put('/users/:id', async (req, res) => {
  const userId = req.params.id;
  const { username, firstname, lastname, email, role_id } = req.body;

  if (!username || !firstname || !lastname || !email || !role_id) {
    return res.status(400).json({ message: "All fields are required" });
  }

  // Remove id from the update query
  const updateQuery = `
    UPDATE users
    SET username = ?, firstname = ?, lastname = ?, email = ?, role_id = ?
    WHERE id = ?;
  `;
  
  db.query(updateQuery, [username, firstname, lastname, email, role_id, userId], (err, result) => {
    if (err) {
      console.error("Error updating user:", err);
      return res.status(500).json({ message: "Error updating user", error: err.message });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const selectQuery = "SELECT * FROM users WHERE id = ?";
    db.query(selectQuery, [userId], (err, userResult) => {
      if (err) {
        console.error("Error fetching updated user:", err);
        return res.status(500).json({ message: "Error fetching updated user" });
      }

      if (userResult.length === 0) {
        return res.status(404).json({ message: "User not found" });
      }

      const updatedUser = userResult[0];
      res.json({
        data: {
          id: updatedUser.id,
          username: updatedUser.username,
          firstname: updatedUser.firstname,
          lastname: updatedUser.lastname,
          email: updatedUser.email,
          role_id: updatedUser.role_id,
          created_at: updatedUser.created_at,
          updated_at: updatedUser.updated_at
        }
      });
    });
  });
});



app.get('/model', async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const perPage = parseInt(req.query.perPage) || 10;
  const model_num = req.query.model_num || '';  // Capture the search query for model_num

  const offset = (page - 1) * perPage;
  
  // Modify the query to filter by model_num if provided
  const query = `SELECT * FROM model WHERE model_num LIKE ? LIMIT ${perPage} OFFSET ${offset}`;
  const searchPattern = `%${model_num}%`;  // SQL wildcard for partial match

  db.query(query, [searchPattern], (err, result) => {
    if (err) return res.json({ Message: "Error inside server" });

    // Query to get the total number of records that match the model_num filter
    const totalQuery = `SELECT COUNT(*) AS total FROM model WHERE model_num LIKE ?`;
    
    db.query(totalQuery, [searchPattern], (err, totalResult) => {
      if (err) return res.json({ Message: "Error fetching total records" });

      const total = totalResult[0].total;

      // Return the filtered, paginated data and the total count
      res.json({
        data: result,
        total: total
      });
    });
  });
});


app.get('/model/:model_id', async (req, res) => {
  const { model_id } = req.params;  // Ensure you extract 'model_id' correctly
  const query = `SELECT * FROM model WHERE model_id = ?`;  // Use model_id in the query

  db.query(query, [model_id], (err, result) => {
    if (err) return res.json({ Message: "Error inside server" });
    if (result.length === 0) return res.status(404).json({ Message: "Model not found" });
    res.json(result[0]);  // Return the model data
  });
});


app.get('/roles', async (req, res) => {
  const query = "SELECT * FROM roles";
  db.query(query, (err, result) => {
    if (err) {
      console.error("Database query error:", err);
      return res.status(500).json({ Message: "Error inside server" });
    }

    console.log("API response:", result);  // Log the raw result

    return res.json({
      data: Array.isArray(result) ? result : []  // Ensure result is always an array
    });
  });
});




app.post("/api/register", async (req, res) => {
  const { name,firstname, lastname,  email, password } = req.body;

  if (!name || !firstname || !lastname  || !email || !password) {
    return res.status(400).json({ message: "Please complete the form" });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const sql = "INSERT INTO users (username,firstname,lastname, email, password, role_id) VALUES (?, ?, ?, ?, ?, 2)";
    db.query(sql, [name, firstname, lastname,  email, hashedPassword], (err, result) => {
      if (err) {
        return res.status(500).json({ message: "เกิดข้อผิดพลาด" });
      }
      res.status(201).json({ message: "ลงทะเบียนสำเร็จ!" });
    });
  } catch (error) {
    res.status(500).json({ message: "เกิดข้อผิดพลาด" });
  }
});

// API สำหรับ Login
app.post("/api/login", (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "กรุณากรอกอีเมลและรหัสผ่าน" });
  }

  const sql = "SELECT * FROM users WHERE email = ?";
  db.query(sql, [email], async (err, result) => {
    if (err) return res.status(500).json({ message: "เกิดข้อผิดพลาด" });

    if (result.length === 0) {
      return res.status(401).json({ message: "Invaild email or password" });
    }

    const user = result[0];
    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return res.status(401).json({ message: "Invaild email or password" });
    }
    // ดึง role จากฐานข้อมูล
    const roleSql = "SELECT role_name FROM roles WHERE id = ?";
    db.query(roleSql, [user.role_id], (err, roleResult) => {
      if (err) return res.status(500).json({ message: "เกิดข้อผิดพลาด" });

      const userRole = roleResult[0]?.role_name || "user"; 

      // ✅ ส่ง username ไปด้วย
      const token = jwt.sign({ id: user.id, role: userRole }, SECRET_KEY, { expiresIn: "1h" });

      res.json({ 
        token, 
        role: userRole, 
        username: user.username,
        firstname: user.firstname,  
        lastname: user.lastname   
      });
    });
  });
});


const checkRole = (roles) => (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ message: "Unauthorized" });

  const token = authHeader.split(" ")[1];
  jwt.verify(token, SECRET_KEY, (err, user) => {
    if (err) return res.status(403).json({ message: "Invalid Token" });

    if (!roles.includes(user.role)) {
      return res.status(403).json({ message: "Access Denied" });
    }

    req.user = user;
    next();
  });
};

// ใช้ Middleware ตรวจสิทธิ์
app.get("/admin", checkRole(["admin"]), (req, res) => {
  res.json({ message: "Welcome, Admin!" });
});


app.get('/getData', (req,res)=>{
    const query = "SELECT * FROM buyoff_item";
    db.query(query, (err, result)=>{
        if(err) return res.json({Message: "Error inside server"});
        return res.json(result);
    })
})

app.get('/', (req, res) => {
  res.json({ success: true, message: "Data fetched successfully!" });
});
// Fetch Dropdown ENUM Options
app.get('/getRohsOptions', (req, res) => {
    const query = "SHOW COLUMNS FROM buyoff_item LIKE 'rohs'";
    db.query(query, (err, result) => {
      if (err) {
        console.error('Error fetching dropdown options:', err);
        res.status(500).send('Error fetching data');
      } else {
        // Extract ENUM values
        const enumValues = result[0].Type.replace(/(enum\(|\)|')/g, '').split(',');
        res.json(enumValues);
      }
    });
  });

  app.get('/getMIT', (req, res) => {
    const query = "SHOW COLUMNS FROM buyoff_item LIKE 'madeinthai'";
    db.query(query, (err, result) => {
      if (err) {
        console.error('Error fetching dropdown options:', err);
        res.status(500).send('Error fetching data');
      } else {
        // Extract ENUM values
        const enumValues = result[0].Type.replace(/(enum\(|\)|')/g, '').split(',');
        res.json(enumValues);
      }
    });
  });

  app.get('/getC_MIT', (req, res) => {
    const query = "SHOW COLUMNS FROM buyoff_item LIKE 'c_madeinthai'";
    db.query(query, (err, result) => {
      if (err) {
        console.error('Error fetching dropdown options:', err);
        res.status(500).send('Error fetching data');
      } else {
        // Extract ENUM values
        const enumValues = result[0].Type.replace(/(enum\(|\)|')/g, '').split(',');
        res.json(enumValues);
      }
    });
  });

  app.get('/getMANUFAC', (req, res) => {
    const query = "SHOW COLUMNS FROM buyoff_item LIKE 'manufac_wd'";
    db.query(query, (err, result) => {
      if (err) {
        console.error('Error fetching dropdown options:', err);
        res.status(500).send('Error fetching data');
      } else {
        // Extract ENUM values
        const enumValues = result[0].Type.replace(/(enum\(|\)|')/g, '').split(',');
        res.json(enumValues);
      }
    });
  });

  app.get('/getHDDP', (req, res) => {
    const query = "SHOW COLUMNS FROM buyoff_item LIKE 'hdd_p'";
    db.query(query, (err, result) => {
      if (err) {
        console.error('Error fetching dropdown options:', err);
        res.status(500).send('Error fetching data');
      } else {
        // Extract ENUM values
        const enumValues = result[0].Type.replace(/(enum\(|\)|')/g, '').split(',');
        res.json(enumValues);
      }
    });
  });

  app.post("/get-product", (req, res) => {
    const { model_num } = req.body;
    const query = "SELECT * FROM product WHERE model_id = ?";
    
    db.query(query, [model_num], (err, results) => {
      if (err) {
        res.status(500).json({ success: false, error: "Database error" });
      } else if (results.length > 0) {
        res.json({ success: true, product: results[0] });
      } else {
        res.json({ success: false, message: "Product not found" });
      }
    });
  });

  app.get('/getSubmission', (req, res) => {
    const query = "SHOW COLUMNS FROM form_header LIKE 'submission'";
    db.query(query, (err, result) => {
      if (err) {
        console.error('Error fetching dropdown options:', err);
        res.status(500).send('Error fetching data');
      } else {
        // Extract ENUM values
        const enumValues = result[0].Type.replace(/(enum\(|\)|')/g, '').split(',');
        res.json(enumValues);
      }
    });
  });


  app.get("/getProductByModel", (req, res) => {
    const { model_num } = req.query;
  
    // Validate model_num
    if (!model_num) {
      return res.status(400).json({ error: 'Model number is required' });
    }
  
    // Query the database
      db.query('SELECT * FROM product WHERE model_num = ?', [model_num], (err, results) => {
      if (err) {
        console.error("SQL Error:", err);  // Log the SQL error
        return res.status(500).json({ error: 'Database error: ' + err.message });  // Send the error message to the client
      }
  
      if (results.length === 0) {
        return res.status(404).json({ error: 'No product found for the given model number' });
      }
  
      // Send the results back
      res.json(results);
    });
  });

  app.get("/checkModelNum", async (req, res) => {
    const { model_num } = req.query;
    try {
      const result = await db.query("SELECT 1 FROM form_header WHERE model_num = ?", [model_num]);
      if (result.length > 0) {
        res.json({ exists: true });
      } else {
        res.json({ exists: false });
      }
    } catch (error) {
      res.status(500).json({ message: "Error checking model_num", error });
    }
  });
  
  
  app.get('/getAllLocations', (req, res) => {
    const query = `SELECT * FROM location`;
  
    db.query(query, (err, result) => {
      if (err) {
        console.error('Error fetching locations:', err);
        res.status(500).send('Error fetching data');
      } else {
        console.log('Fetched locations:', result); // Log the fetched data
        res.json(result); // Send the data as JSON
      }
    });
  });

  app.get('/getAllBEA', (req, res) => {
    const query = `SELECT * FROM bea_packing`;
  
    db.query(query, (err, result) => {
      if (err) {
        console.error('Error fetching locations:', err);
        res.status(500).send('Error fetching data');
      } else {
        console.log('Fetched locations:', result); // Log the fetched data
        res.json(result); // Send the data as JSON
      }
    });
  });

  app.get('/getAlltypecp', (req, res) => {
    const query = `SELECT * FROM typeofcartonpallet`;
  
    db.query(query, (err, result) => {
      if (err) {
        console.error('Error fetching locations:', err);
        res.status(500).send('Error fetching data');
      } else {
        console.log('Fetched locations:', result); // Log the fetched data
        res.json(result); // Send the data as JSON
      }
    });
  });

  app.get('/getAllproduct', (req, res) => {
    const query = `SELECT * FROM product_form`;
  
    db.query(query, (err, result) => {
      if (err) {
        console.error('Error fetching locations:', err);
        res.status(500).send('Error fetching data');
      } else {
        console.log('Fetched locations:', result); // Log the fetched data
        res.json(result); // Send the data as JSON
      }
    });
  });

  app.get('/getAllchangedes', (req, res) => {
    const query = `SELECT * FROM change_des`;
  
    db.query(query, (err, result) => {
      if (err) {
        console.error('Error fetching locations:', err);
        res.status(500).send('Error fetching data');
      } else {
        console.log('Fetched locations:', result); // Log the fetched data
        res.json(result); // Send the data as JSON
      }
    });
  });

  app.get('/getAllspec', (req, res) => {
    const query = `SELECT * FROM specification`;
  
    db.query(query, (err, result) => {
      if (err) {
        console.error('Error fetching locations:', err);
        res.status(500).send('Error fetching data');
      } else {
        console.log('Fetched locations:', result); // Log the fetched data
        res.json(result); // Send the data as JSON
      }
    });
  });


  app.get('/getAllmodel', (req, res) => {
    const query = `SELECT * FROM model`;
  
    db.query(query, (err, result) => {
      if (err) {
        console.error('Error fetching locations:', err);
        res.status(500).send('Error fetching data');
      } else {
        console.log('Fetched locations:', result); // Log the fetched data
        res.json(result); // Send the data as JSON
      }
    });
  });


  app.get('/getProductData', (req, res) => {
    const { model_num } = req.query; // Access the model number from the query parameters
    console.log('Received model_num:', model_num);
    if (!model_num) {
      return res.status(400).json({ success: false, message: 'Model number is required' });
    }
  
    // Input validation for model_num (ensure it is a string and within a valid length range)
    if (typeof model_num !== 'string' || model_num.length < 1 || model_num.length > 50) {
      return res.status(400).json({ success: false, message: 'Invalid model number format' });
    }
  
    const query = `
      SELECT product.*, model.model_num 
      FROM product 
      JOIN model ON product.model_id = model.model_id
      WHERE model.model_id = ?
    `;
    
    db.query(query, [model_num], (err, result) => {
      if (err) {
        console.error('Error fetching product data:', err);
        return res.status(500).json({ error: 'Error fetching product data' });
      }
  
      if (result.length > 0) {
        return res.json({ success: true, product: result[0] });
      } else {
        return res.json({ success: false, message: 'Product not found' });
      }
    });
  });
  
  
  app.listen(5000, () => console.log("Server running on port 5000"));


app.post('/insertBuyoffItem', (req, res) => {
  const {
    model_id,
    model_hgst,
    upc,
    ccc,
    workweek,
    qalot_id,
    qty,
    package_id,
    driverserial_num_1,
    driverserial_num_2,
    driverserial_num_3,
    driverserial_num_4,
    customer_id, 
    customer,
    rohs,
    country_code,
    date_MFG,
    madeinthai,
    c_madeinthai,
    manufac_wd,
    hdd_p,
    LogoVerification,
    customerserial_num_1,
    customerserial_num_2,
    ds_hkmodel,
    mlc,
    capacity,
    weight,
  } = req.body;

  const query = `INSERT INTO buyoff_item (
    model_id, model_hgst, upc, ccc, workweek, qalot_id, qty, package_id,
    driverserial_num_1, driverserial_num_2, driverserial_num_3, driverserial_num_4,
    customer_id, customer, rohs, country_code, date_MFG, madeinthai, c_madeinthai,
    manufac_wd, hdd_p, LogoVerification, customerserial_num_1, customerserial_num_2,
    ds_hkmodel, mlc, capacity, weight
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

  db.query(
    query,
    [
      model_id, model_hgst, upc, ccc, workweek, qalot_id, qty, package_id,
      driverserial_num_1, driverserial_num_2, driverserial_num_3, driverserial_num_4,
      customer_id, customer, rohs, country_code, date_MFG, madeinthai, c_madeinthai,
      manufac_wd, hdd_p, LogoVerification, customerserial_num_1, customerserial_num_2,
      ds_hkmodel, mlc, capacity, weight,
    ],
    (err, result) => {
      if (err) {
        console.error('Error inserting buyoff item:', err);
        return res.status(500).json({ success: false, message: 'Error inserting buyoff item' });
      }
      return res.status(200).json({ success: true, message: 'Buyoff item inserted successfully', result });
    }
  );
});

app.use('/images', express.static(path.join(__dirname, 'public', 'images')));
app.post("/insertFormheader", upload.single('image'), async (req, res) => {
  try {
    console.log("Request Body:", req.body);
    console.log("Uploaded File:", req.file);

    if (!req.file) {
      return res.status(400).json({ success: false, message: "No image uploaded" });
    }

    const parsedValues = JSON.parse(req.body.values);

    const {
      loca_id, bea_packing_no, change_des_id, product_form_id, autocarton_mit,
      a_mti_ver, print_date, submission, time, spec_id, typeofcartonpallet_id,
      model_id
    } = parsedValues;

    if (!model_id || isNaN(parseInt(model_id))) {
      return res.status(400).json({ success: false, message: "Valid model number is required." });
    }

    const modelIdInt = parseInt(model_id);

    // Save image path relative to /images directory
    let imagePath = req.file ? `/images/${req.file.filename}` : null;

    const query = `
      INSERT INTO form_header (
        loca_id, bea_packing_no, change_des_id, product_form_id, autocarton_mit,
        a_mti_ver, print_date, submission, time, spec_id, typeofcartonpallet_id,
        model_id, image
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    db.query(
      query,
      [
        loca_id, bea_packing_no, change_des_id, product_form_id, autocarton_mit,
        a_mti_ver, print_date, submission, time, spec_id, typeofcartonpallet_id,
        model_id, imagePath,
      ],
      (err, result) => {
        if (err) {
          console.error("Database error:", err);
          return res.status(500).json({ success: false, message: "Internal server error." });
        }

        res.json({
          success: true,
          message: "Form header inserted successfully!",
          imageUrl: imagePath, // Send the relative image path back to the frontend
        });
      }
    );
  } catch (error) {
    console.error("Unexpected error:", error);
    res.status(500).json({ success: false, message: "Internal server error." });
  }
});


  app.get('/customerid', (req,res)=> {
      const sql = "SELECT * FROM customer"
      db.query(sql, (err,data)=>{
          if(err) return res.json(err);
          return res.json(data);
      })
  })

  app.get('/customerhpnid', (req,res)=> {
    const sql = "SELECT * FROM customer_hpn"
    db.query(sql, (err,data)=>{
        if(err) return res.json(err);
        return res.json(data);
    })
})
  app.listen(8081, ()=> {
      console.log("listening");
  })
