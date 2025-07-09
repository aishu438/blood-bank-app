const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const csvParser = require('csv-parser');
const mongoose = require('mongoose');
const stringSimilarity = require('string-similarity');

const app = express();
const PORT = process.env.PORT || 3000;

/* ─────────── Middleware ─────────── */
app.use(cors());
app.use(express.json());

/* ─────────── MongoDB Connection ─────────── */
mongoose.connect('mongodb+srv://bloodbankuser:Bss3wgcEqzjStdbx@cluster0.sqrt1lp.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0')
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

/* ─────────── Schemas ─────────── */
const userSchema = new mongoose.Schema({
  username: String,
  email: String,
  password: String
});
const donorSchema = new mongoose.Schema({
  name: String,
  bloodGroup: String,
  email: String,
  contact: String,
  date: { type: Date, default: Date.now }
});
const appointmentSchema = new mongoose.Schema({
  name: String,
  email: String,
  date: String,
  time: String
});

const User = mongoose.model('User', userSchema);
const Donor = mongoose.model('Donor', donorSchema);
const Appointment = mongoose.model('Appointment', appointmentSchema);

/* ─────────── Chatbot Q&A ─────────── */
let qaPairs = [];
try {
  qaPairs = JSON.parse(fs.readFileSync(path.join(__dirname, 'data.json'), 'utf-8'));
  console.log(`✅ Loaded ${qaPairs.length} Q&A pairs`);
} catch {
  console.warn('⚠️ data.json not found');
}

/* ─────────── CSV Loading ─────────── */
const empCsvFile = path.join(__dirname, 'employee_data.csv');
let employees = [];
function loadEmployeeCSV() {
  if (fs.existsSync(empCsvFile)) {
    fs.createReadStream(empCsvFile)
      .pipe(csvParser())
      .on('data', row => {
        const id = (row.ID || row.Id || '').toUpperCase().trim();
        if (id) {
          employees.push({
            ID: id,
            Name: (row.Name || '').trim(),
            Email: (row.Email || '').trim(),
            Phone: (row.Phone || '').trim()
          });
        }
      })
      .on('end', () => {
        console.log(`✅ Loaded ${employees.length} employees from CSV`);
      });
  } else {
    console.warn('⚠️ employee_data.csv not found');
  }
}
loadEmployeeCSV();

/* ─────────── Routes ─────────── */
app.post('/signup', async (req, res) => {
  const { username, email, password } = req.body;
  if (!username || !email || !password)
    return res.status(400).json({ message: 'All fields required' });

  const existing = await User.findOne({ email });
  if (existing)
    return res.status(400).json({ message: 'Email already registered' });

  await User.create({ username, email, password });
  res.json({ success: true, message: 'Signup successful!' });
});

app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email, password });
  if (!user)
    return res.status(401).json({ success: false, message: 'Invalid credentials' });

  res.json({ success: true, message: 'Login successful' });
});

app.post('/register', async (req, res) => {
  const { name, bloodGroup, email, contact } = req.body;
  if (!name || !bloodGroup || !email || !contact)
    return res.status(400).json({ message: 'All fields required' });

  const exists = await Donor.findOne({ email });
  if (exists)
    return res.status(400).json({ message: 'Email already registered' });

  await Donor.create({ name, bloodGroup, email, contact });
  res.json({ message: 'Donor registered successfully!' });
});

app.get('/inventory', (_, res) => {
  const r = m => Math.floor(Math.random() * m);
  const inventory = {
    'A+': r(20), 'A-': r(10), 'B+': r(15), 'B-': r(10),
    'O+': r(25), 'O-': r(8), 'AB+': r(5), 'AB-': r(3)
  };
  res.json(inventory);
});

app.post('/appointment', async (req, res) => {
  const { name, email, date, time } = req.body;
  if (!name || !email || !date || !time)
    return res.status(400).json({ message: 'All fields required' });

  await Appointment.create({ name, email, date, time });
  res.json({ message: 'Appointment scheduled successfully!' });
});

app.get('/appointment', async (_, res) => {
  const appointments = await Appointment.find();
  res.json(appointments);
});

app.get('/stories', (_, res) => res.json([
  { name: 'Rahul Sharma', message: 'Donating blood was great!' },
  { name: 'Neha Patel', message: 'I saved a life today.' },
  { name: 'Arjun Verma', message: 'Easy, fast, fulfilling.' }
]));

app.post('/chatbot', (req, res) => {
  const msg = (req.body.message || '').trim().toLowerCase();
  const results = [];

  const isNumericId = msg.match(/^\d{5,9}$/);
  if (isNumericId) {
    const inputId = msg;
    fs.createReadStream(empCsvFile)
      .pipe(csvParser())
      .on('data', row => results.push(row))
      .on('end', () => {
        const empMatch = results.find(r => r['Employee ID'] === inputId);
        const posMatch = results.find(r => r['Position ID'] === inputId);

        if (empMatch && empMatch['Name Based Email ID']) {
          return res.json({
            reply: `📧 Name Based Email ID for Employee ID ${inputId} is:\n${empMatch['Name Based Email ID']}`
          });
        }

        if (posMatch && posMatch['Designation Based Email ID']) {
          return res.json({
            reply: `📧 Designation Based Email ID for Position ID ${inputId} is:\n${posMatch['Designation Based Email ID']}`
          });
        }

        return res.json({ reply: `❌ No match found for ID: ${inputId}` });
      });
    return;
  }

  const questions = qaPairs.map(q => q.question.toLowerCase());
  const best = stringSimilarity.findBestMatch(msg, questions);
  if (best.bestMatch.rating > 0.25) {
    const ans = qaPairs.find(q => q.question.toLowerCase() === best.bestMatch.target).answer;
    return res.json({ reply: ans });
  }

  res.json({ reply: "🤖 Sorry, I don't have an answer for that." });
});

/* ─────────── Serve Frontend ─────────── */
// 👇 This is the critical fix for Render deployment
const frontendPath = path.join(__dirname, '../frontend');
app.use(express.static(frontendPath));

// 👇 This catch-all ensures all frontend routes work (about.html, contact.html, etc.)
app.get('*', (req, res) => {
  res.sendFile(path.join(frontendPath, 'index.html'));
});

/* ─────────── Start Server ─────────── */
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
