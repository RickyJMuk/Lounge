require('dotenv').config();
const express = require('express')
const session = require('express-session');
const bcrypt = require('bcrypt');
const saltRounds = 3;
const mysql = require('mysql2')
const path = require('path')
const validator = require('validator'); // Import the validator library

const app = express()
const PORT = process.env.PORT || 4400
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'savannahloungebookings',
  });
  
  db.connect((err) => {
    if (err) {
      throw err;
    }
    console.log('Connected to MySQL database');
  });

  app.use(session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: true
  }));

app.set('view engine', 'ejs')
app.use(express.static(path.join(__dirname, 'public')));
app.use('/', express.static(path.join(__dirname, 'public')));

app.use(express.urlencoded({ extended: true }))

app.get('/', (req, res) => {
    res.render('index')
})

app.get('/menu', (req, res) => {
    res.render('menu')
})


app.post('/book-a-room', (req, res) => {
    let user = req.body;

    // Perform validation
    if (!isValidBookingData(user)) {
        console.error('Error: Invalid data provided for booking');
        return res.render('index', { error: 'Error: Invalid data provided for booking' });
    }

    // Sanitize the input data
    const sanitizedName = validator.escape(user.name);
    const sanitizedEmail = validator.escape(user.email);
    const sanitizedPhone = validator.escape(user.phone);
    const sanitizedDate = validator.escape(user.date);
    const sanitizedTime = validator.escape(user.time);
    const sanitizedPeople = validator.escape(user.people);

    const sql = `INSERT INTO bookings (name, email, phone, date, time, people) VALUES ('${sanitizedName}', '${sanitizedEmail}', '${sanitizedPhone}', '${sanitizedDate}', '${sanitizedTime}', '${sanitizedPeople}')`;

    db.query(sql, (err, result) => {
        if (err) {
            console.error('Error in database operation:', err);
            return res.render('index', { error: 'Error in database operation' });
        } else {
            console.log('Booking successfully added to the database');
            return res.render('index', { alert: 'Booking request sent. We will confirm via email or phone. Thank you!' });
        }
    });
});

// Function to validate booking data
function isValidBookingData(user) {
    // Check if all required fields are present
    if (
        !user.name || !user.email || !user.phone || !user.date || !user.time || !user.people ||
        !validator.isEmail(user.email) || !validator.isDate(user.date) || !validator.isNumeric(user.people)
    ) {
        return false;
    }

    // Add more specific validation rules as needed

    return true;
}



// Display admin page with bookings
app.get('/admin', (req, res) => {
    const sql = 'SELECT * FROM bookings';
    db.query(sql, (err, result) => {
      if (err) {
        throw err;
      }
      res.render('admin', { bookings: result });
    });
  });
  
  // Delete booking
  app.post('/admin/delete/:id', (req, res) => {
    const bookingId = req.params.id;
    const sql = 'DELETE FROM bookings WHERE id = ?';
    db.query(sql, [bookingId], (err) => {
      if (err) {
        throw err;
      }
      res.redirect('/admin');
    });
  });


  app.post('/conference-booking', (req, res) => {
    const { name, email, phone, fromDate, toDate } = req.body;
  
    // Validate input
    if (!validator.isLength(name, { min: 1, max: 50 }) ||
        !validator.isEmail(email) ||
        !validator.isMobilePhone(phone, 'any', { strictMode: false }) ||
        !validator.isISO8601(fromDate) ||
        !validator.isISO8601(toDate)) {
      return res.status(400).send('Invalid input data');
    }
  
    // Insert data into MySQL database
    const sql = `INSERT INTO conference_bookings (name, email, phone, from_date, to_date) VALUES ('${name}', '${email}', '${phone}', '${fromDate}', '${toDate}')`;

    const values = [name, email, phone, fromDate, toDate];
  
    db.query(sql, values, (error, results) => {
      if (error) {
        console.error('Error inserting into database:', error);
        res.status(500).send('Internal Server Error');
      } else {
        console.log('Conference booking added to the database');
        return res.render('index', { alert: 'Conference reservation was successful. Thank you!' });
      }
    });
  });


  app.get('/admin-login', (req, res) => {
    res.render('admin-login');
  });

  app.post('/admin-login', async (req, res) => {
    const { email, password } = req.body;
    
    if (email === process.env.ADMIN_EMAIL && await bcrypt.compare(password, process.env.ADMIN_PASSWORD_HASH)) {
      req.session.isAdmin = true;
      res.redirect('/dashboard');
    } else {
      res.render('admin-login', { error: 'Invalid credentials' });
    }
  });

  app.get('/logout', (req, res) => {
    req.session.destroy(err => {
      if (err) {
        console.error('Error destroying session:', err);
      }
      res.redirect('/admin-login');
    });
  });

  app.get('/dashboard', (req, res) => {
    res.render('dashboard')
  })

  // app.get('/conference', (req, res) => {
  //   res.render('conference')
  // })

  app.get('/conference', (req, res) => {
    const sql = 'SELECT * FROM conference_bookings';
    db.query(sql, (err, result) => {
      if (err) {
        throw err;
      }
      res.render('conference', { bookings: result });
    });
  });

  // Delete conference booking

  app.post('/delete-conference/:id', (req, res) => {
    const conferenceId = req.params.id;

    // Perform validation on conferenceId if needed

    const sql = 'DELETE FROM conference_bookings WHERE id = ?';

    db.query(sql, [conferenceId], (error, results) => {
        if (error) {
            console.error('Error deleting data from database:', error);
            res.status(500).send('Internal Server Error');
        } else {
            console.log('Conference booking deleted from the database');
            res.redirect('/conference'); // Redirect to the conference page after deletion
        }
    });
});








app.listen(PORT, () => console.log(`Server listening on port ${PORT}`))