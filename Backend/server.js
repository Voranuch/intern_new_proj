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


app.post("/users", async (req, res) => {
  try {
    const { username, firstname, lastname, email, password, role_id } = req.body;

    if (!username || !firstname || !lastname || !email || !password || !role_id) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const insertQuery = `
      INSERT INTO users (username, firstname, lastname, email, password, role_id, created_at, updated_at) 
      VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())
    `;

    db.query(insertQuery, [username, firstname, lastname, email, hashedPassword, role_id], (err, result) => {
      if (err) {
        console.error("Error inserting user:", err);
        return res.status(500).json({ message: "Database error", error: err.sqlMessage });
      }

      const newUserId = result.insertId;

      const selectQuery = "SELECT * FROM users WHERE id = ?";
      db.query(selectQuery, [newUserId], (err, userResult) => {
        if (err) {
          console.error("Error fetching new user:", err);
          return res.status(500).json({ message: "Error fetching new user" });
        }

        if (userResult.length === 0) {
          return res.status(404).json({ message: "User not found after creation" });
        }

        const newUser = userResult[0];

        res.status(201).json({
          data: {
            id: newUser.id,  // ✅ Make sure 'id' is included
            username: newUser.username,
            firstname: newUser.firstname,
            lastname: newUser.lastname,
            email: newUser.email,
            role_id: newUser.role_id,
            created_at: newUser.created_at,
            updated_at: newUser.updated_at
          }
        });
      });
    });
  } catch (error) {
    console.error("Unexpected error:", error.message);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
});

app.delete('/users', async (req, res) => {
  const { userIds } = req.body; // Expecting an array of user IDs

  if (!Array.isArray(userIds) || userIds.length === 0) {
    return res.status(400).json({ message: "Invalid request, provide an array of user IDs" });
  }

  const deleteQuery = `DELETE FROM users WHERE id IN (?)`;
  try {
    db.query(deleteQuery, [userIds], (err, result) => {
      if (err) {
        return res.status(500).json({ message: 'Error deleting user', error: err.sqlMessage });
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({ message: 'User not found' });
      }

      const maxIdQuery = 'SELECT MAX(id) AS maxId FROM users';
        db.query(maxIdQuery, (err, maxResult) => {
          if (err) {
            return res.status(500).json({ message: 'Error fetching max ID', error: err.sqlMessage });
          }

          const newAutoIncrement = (maxResult[0].maxId || 0) + 1;

          // Step 3: Reset AUTO_INCREMENT
          const resetQuery = `ALTER TABLE users AUTO_INCREMENT = ${newAutoIncrement}`;
          db.query(resetQuery, (err) => {
            if (err) {
              return res.status(500).json({ message: 'Error resetting auto-increment', error: err.sqlMessage });
            }

            res.json({ message: 'User deleted and AUTO_INCREMENT reset successfully' });
          });
        });
    });
  } catch (error) {
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
});

app.delete('/users/:id', async (req, res) => {
  const userId = req.params.id;

  try {
    // Step 1: Delete the user
    const deleteQuery = 'DELETE FROM users WHERE id = ?';
    db.query(deleteQuery, [userId], async (err, result) => {
      if (err) {
        return res.status(500).json({ message: 'Error deleting user', error: err.sqlMessage });
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Step 2: Get the highest existing ID
      const maxIdQuery = 'SELECT MAX(id) AS maxId FROM users';
      db.query(maxIdQuery, (err, maxResult) => {
        if (err) {
          return res.status(500).json({ message: 'Error fetching max ID', error: err.sqlMessage });
        }

        const newAutoIncrement = (maxResult[0].maxId || 0) + 1;

        // Step 3: Reset AUTO_INCREMENT
        const resetQuery = `ALTER TABLE users AUTO_INCREMENT = ${newAutoIncrement}`;
        db.query(resetQuery, (err) => {
          if (err) {
            return res.status(500).json({ message: 'Error resetting auto-increment', error: err.sqlMessage });
          }

          res.json({ message: 'User deleted and AUTO_INCREMENT reset successfully' });
        });
      });
    });
  } catch (error) {
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
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

app.put('/model/:model_id', async (req, res) => {
  const modelId = req.params.model_id;
  const { model_num } = req.body;

  if (!model_num) {
    return res.status(400).json({ message: "model_num is required" });
  }

  // Optional: Validate model_num format (e.g., number or string length)
  if (typeof model_num !== 'string' || model_num.trim().length === 0) {
    return res.status(400).json({ message: "Invalid model_num format" });
  }

  // Update query, passing model_num and modelId
  const updateQuery = `
    UPDATE model
    SET model_num = ? WHERE model_id = ?;
  `;

  db.query(updateQuery, [model_num, modelId], (err, result) => {
    if (err) {
      console.error("Error updating model:", err);
      return res.status(500).json({ message: "Error updating model", error: err.message });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Model not found" });
    }

    // Optionally fetch and return the updated model to ensure accuracy
    const fetchQuery = `
      SELECT * FROM model WHERE model_id = ?;
    `;

    db.query(fetchQuery, [modelId], (fetchErr, fetchResult) => {
      if (fetchErr) {
        console.error("Error fetching updated model:", fetchErr);
        return res.status(500).json({ message: "Error fetching updated model", error: fetchErr.message });
      }

      const updatedModel = fetchResult[0];

      // Ensure the response has an 'id' field, and return the updated model
      res.json({
        data: {
          id: updatedModel.model_id, // Ensure 'id' is included
          model_num: updatedModel.model_num, // Add other fields if needed
        }
      });
    });
  });
});

app.post('/model', async (req, res) => {
  try{
  const { model_num } = req.body;

  if (!model_num) {
    return res.status(400).json({ message: "Model number is required" });
  }

  const insertQuery = `INSERT INTO model (model_num) VALUES (?)`;

  db.query(insertQuery, [model_num], (err, result) => {
    if (err) {
      console.error("Error inserting model:", err);
      return res.status(500).json({ message: "Database error", error: err.message || err.sqlMessage });
    }

    const newModelId = result.insertId;

    const selectQuery = "SELECT * FROM model WHERE model_id = ?";
    db.query(selectQuery, [newModelId], (err, modelResult) => {
      if (err) {
        console.error("Error fetching new model:", err);
        return res.status(500).json({ message: "Error fetching new model", error: err.message || err.sqlMessage });
      }

      if (modelResult.length === 0) {
        return res.status(404).json({ message: "Model not found after creation" });
      }

      const newmodel = modelResult[0];

      // Ensure the response format is correct
      res.status(201).json({
        data: {
          id: newmodel.model_id, // Make sure you are sending 'id' here
          model_num: newmodel.model_num
        }
      });
    });
  });
}catch(error){
  console.error("Unexpected error:", error.message);
  res.status(500).json({ message: "Internal server error", error: error.message });
}
});

app.delete('/model', async (req, res) => {
  const { modelIds } = req.body; // Expecting an array of model IDs

  if (!Array.isArray(modelIds) || modelIds.length === 0) {
    return res.status(400).json({ message: "Invalid request, provide an array of model IDs" });
  }

  const deleteQuery = `DELETE FROM model WHERE model_id IN (?)`;
  try {
    db.query(deleteQuery, [modelIds], (err, result) => {
      if (err) {
        return res.status(500).json({ message: 'Error deleting model', error: err.sqlMessage });
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({ message: 'Model not found' });
      }

      const maxIdQuery = 'SELECT MAX(model_id) AS maxId FROM model';
        db.query(maxIdQuery, (err, maxResult) => {
          if (err) {
            return res.status(500).json({ message: 'Error fetching max ID', error: err.sqlMessage });
          }

          const newAutoIncrement = (maxResult[0].maxId || 0) + 1;

          // Step 3: Reset AUTO_INCREMENT
          const resetQuery = `ALTER TABLE model AUTO_INCREMENT = ${newAutoIncrement}`;
          db.query(resetQuery, (err) => {
            if (err) {
              return res.status(500).json({ message: 'Error resetting auto-increment', error: err.sqlMessage });
            }

            res.json({ message: 'Model deleted and AUTO_INCREMENT reset successfully' });
          });
        });
    });
  } catch (error) {
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
});

// Delete a model by ID
app.delete('/model/:model_id', async (req, res) => {
  const modelId = req.params.model_id;

  try {
    // Step 1: Delete the user
    const deleteQuery = 'DELETE FROM model WHERE model_id = ?';
    db.query(deleteQuery, [modelId], async (err, result) => {
      if (err) {
        return res.status(500).json({ message: 'Error deleting model', error: err.sqlMessage });
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({ message: 'Model not found' });
      }

      // Step 2: Get the highest existing ID
      const maxIdQuery = 'SELECT MAX(model_id) AS maxId FROM model';
      db.query(maxIdQuery, (err, maxResult) => {
        if (err) {
          return res.status(500).json({ message: 'Error fetching max ID', error: err.sqlMessage });
        }

        const newAutoIncrement = (maxResult[0].maxId || 0) + 1;

        // Step 3: Reset AUTO_INCREMENT
        const resetQuery = `ALTER TABLE model AUTO_INCREMENT = ${newAutoIncrement}`;
        db.query(resetQuery, (err) => {
          if (err) {
            return res.status(500).json({ message: 'Error resetting auto-increment', error: err.sqlMessage });
          }

          res.json({ message: 'Model deleted and AUTO_INCREMENT reset successfully' });
        });
      });
    });
  } catch (error) {
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
});

app.get('/bea', async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const perPage = parseInt(req.query.perPage) || 10;
  const bea_packing_name = req.query.bea_packing_name || '';  // Capture the search query for bea_packing_name

  const offset = (page - 1) * perPage;

  const query = `SELECT * FROM bea_packing WHERE bea_packing_name LIKE ? LIMIT ${perPage} OFFSET ${offset}`;
  const searchPattern = `%${bea_packing_name}%`;  // SQL wildcard for partial match

  db.query(query, [searchPattern], (err, result) => {
    if (err) return res.json({ Message: "Error inside server" });

    const totalQuery = `SELECT COUNT(*) AS total FROM bea_packing WHERE bea_packing_name LIKE ?`;
    
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

app.get('/bea/:bea_packing_no', async (req, res) => {
  const { bea_packing_no } = req.params;  // Ensure you extract 'model_id' correctly
  const query = `SELECT * FROM bea_packing WHERE bea_packing_no = ?`;  // Use model_id in the query

  db.query(query, [bea_packing_no], (err, result) => {
    if (err) return res.json({ Message: "Error inside server" });
    if (result.length === 0) return res.status(404).json({ Message: "Model not found" });
    res.json(result[0]);  // Return the model data
  });
});

app.put('/bea/:bea_packing_no', async (req, res) => {
  const beaId = req.params.bea_packing_no;
  const { bea_packing_name } = req.body;

  if (!bea_packing_name) {
    return res.status(400).json({ message: "bea is required" });
  }
  if (typeof bea_packing_name !== 'string' || bea_packing_name.trim().length === 0) {
    return res.status(400).json({ message: "Invalid bea format" });
  }
  const updateQuery = `
    UPDATE bea_packing
    SET bea_packing_name = ? WHERE bea_packing_no = ?;
  `;

  db.query(updateQuery, [bea_packing_name, beaId], (err, result) => {
    if (err) {
      console.error("Error updating bea:", err);
      return res.status(500).json({ message: "Error updating model", error: err.message });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "BEA no. not found" });
    }
    const fetchQuery = `
      SELECT * FROM bea_packing WHERE bea_packing_no = ?;
    `;

    db.query(fetchQuery, [beaId], (fetchErr, fetchResult) => {
      if (fetchErr) {
        console.error("Error fetching updated bea:", fetchErr);
        return res.status(500).json({ message: "Error fetching updated bea", error: fetchErr.message });
      }
      const updatedBea = fetchResult[0];
      res.json({
        data: {
          id: updatedBea.bea_packing_no,
          bea_packing_name: updatedBea.bea_packing_name,
        }
      });
    });
  });
});

app.post('/bea', async (req, res) => {
  try{
  const { bea_packing_name } = req.body;

  if (!bea_packing_name) {
    return res.status(400).json({ message: "BEA number is required" });
  }

  const insertQuery = `INSERT INTO bea_packing (bea_packing_name) VALUES (?)`;

  db.query(insertQuery, [bea_packing_name], (err, result) => {
    if (err) {
      console.error("Error inserting bea:", err);
      return res.status(500).json({ message: "Database error", error: err.message || err.sqlMessage });
    }

    const newBeaId = result.insertId;

    const selectQuery = "SELECT * FROM bea_packing WHERE bea_packing_no = ?";
    db.query(selectQuery, [newBeaId], (err, beaResult) => {
      if (err) {
        console.error("Error fetching new bea:", err);
        return res.status(500).json({ message: "Error fetching new bea", error: err.message || err.sqlMessage });
      }

      if (beaResult.length === 0) {
        return res.status(404).json({ message: "Bea not found after creation" });
      }

      const newbea = beaResult[0];

      res.status(201).json({
        data: {
          id: newbea.bea_packing_no,
          bea_packing_name: newbea.bea_packing_name
        }
      });
    });
  });
}catch(error){
  console.error("Unexpected error:", error.message);
  res.status(500).json({ message: "Internal server error", error: error.message });
}
});

app.delete('/bea', async (req, res) => {
  const { beaId } = req.body; // Expecting an array of model IDs

  if (!Array.isArray(beaId) || beaId.length === 0) {
    return res.status(400).json({ message: "Invalid request, provide an array of bea IDs" });
  }

  const deleteQuery = `DELETE FROM bea_packing WHERE bea_packing_no IN (?)`;
  try {
    db.query(deleteQuery, [beaId], (err, result) => {
      if (err) {
        return res.status(500).json({ message: 'Error deleting bea no.', error: err.sqlMessage });
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({ message: 'BEA not found' });
      }

      const maxIdQuery = 'SELECT MAX(bea_packing_no) AS maxId FROM bea_packing';
        db.query(maxIdQuery, (err, maxResult) => {
          if (err) {
            return res.status(500).json({ message: 'Error fetching max ID', error: err.sqlMessage });
          }

          const newAutoIncrement = (maxResult[0].maxId || 0) + 1;

          // Step 3: Reset AUTO_INCREMENT
          const resetQuery = `ALTER TABLE bea_packing AUTO_INCREMENT = ${newAutoIncrement}`;
          db.query(resetQuery, (err) => {
            if (err) {
              return res.status(500).json({ message: 'Error resetting auto-increment', error: err.sqlMessage });
            }

            res.json({ message: 'BEA deleted and AUTO_INCREMENT reset successfully' });
          });
        });
    });
  } catch (error) {
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
});

// Delete a model by ID
app.delete('/bea_packing/:bea_packing_no', async (req, res) => {
  const beaId = req.params.bea_packing_no;

  try {
    // Step 1: Delete the user
    const deleteQuery = 'DELETE FROM bea_packing WHERE bea_packing_no = ?';
    db.query(deleteQuery, [beaId], async (err, result) => {
      if (err) {
        return res.status(500).json({ message: 'Error deleting bea', error: err.sqlMessage });
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({ message: 'BEA no. not found' });
      }

      // Step 2: Get the highest existing ID
      const maxIdQuery = 'SELECT MAX(bea_packing_no) AS maxId FROM bea_packing';
      db.query(maxIdQuery, (err, maxResult) => {
        if (err) {
          return res.status(500).json({ message: 'Error fetching max ID', error: err.sqlMessage });
        }

        const newAutoIncrement = (maxResult[0].maxId || 0) + 1;

        // Step 3: Reset AUTO_INCREMENT
        const resetQuery = `ALTER TABLE bea_packing AUTO_INCREMENT = ${newAutoIncrement}`;
        db.query(resetQuery, (err) => {
          if (err) {
            return res.status(500).json({ message: 'Error resetting auto-increment', error: err.sqlMessage });
          }

          res.json({ message: 'BEA deleted and AUTO_INCREMENT reset successfully' });
        });
      });
    });
  } catch (error) {
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
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

  function cleanValue(value) {
    return value === "" ? null : value;
  }

  const values = [
    cleanValue(model_id),
    cleanValue(model_hgst),
    cleanValue(upc),
    cleanValue(ccc),
    cleanValue(workweek),
    cleanValue(qalot_id),
    cleanValue(qty ? parseInt(qty) : null), // Convert qty to integer
    cleanValue(package_id),
    cleanValue(driverserial_num_1),
    cleanValue(driverserial_num_2),
    cleanValue(driverserial_num_3),
    cleanValue(driverserial_num_4),
    cleanValue(customer_id ? parseInt(customer_id) : null), // Convert to integer
    cleanValue(customer),
    cleanValue(rohs),
    cleanValue(country_code),
    cleanValue(date_MFG), // Ensure correct date format
    cleanValue(madeinthai),
    cleanValue(c_madeinthai),
    cleanValue(manufac_wd),
    cleanValue(hdd_p),
    cleanValue(LogoVerification),
    cleanValue(customerserial_num_1),
    cleanValue(customerserial_num_2),
    cleanValue(ds_hkmodel),
    cleanValue(mlc),
    cleanValue(capacity),
    cleanValue(weight)
  ];

  const query = `
    INSERT INTO buyoff_item (
      model_id, model_hgst, upc, ccc, workweek, qalot_id, qty, package_id,
      driverserial_num_1, driverserial_num_2, driverserial_num_3, driverserial_num_4,
      customer_id, customer, rohs, country_code, date_MFG, madeinthai, c_madeinthai,
      manufac_wd, hdd_p, LogoVerification, customerserial_num_1, customerserial_num_2,
      ds_hkmodel, mlc, capacity, weight
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

  // ✅ Execute Query
  db.query(query, values, (err, result) => {
    if (err) {
      console.error('🔥 Error inserting buyoff item:', err);
      return res.status(500).json({ success: false, message: 'Error inserting buyoff item', error: err.message });
    }
    return res.status(200).json({ success: true, message: 'Buyoff item inserted successfully', result });
  });
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
