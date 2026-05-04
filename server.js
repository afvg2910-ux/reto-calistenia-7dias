/**
 * Servidor Express para capturar emails desde la landing page.
 * POST /subscribe → guarda en data/subscribers.json → envía email día 1
 * GET  /          → sirve index.html
 *
 * Uso: npm install && node server.js
 */

require('dotenv').config();
const express    = require('express');
const nodemailer = require('nodemailer');
const cors       = require('cors');
const fs         = require('fs');
const path       = require('path');

const app     = express();
const PORT    = process.env.PORT || 3000;
const SUBS    = path.join(__dirname, 'data/subscribers.json');

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type'],
}));
app.options('*', cors());
app.use(express.json());
app.use(express.static(__dirname));

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_PASS },
});

app.post('/subscribe', async (req, res) => {
  const { email, name } = req.body;
  if (!email || !email.includes('@')) {
    return res.status(400).json({ error: 'Email inválido' });
  }

  // Cargar y actualizar subscribers
  let subs = [];
  try { subs = JSON.parse(fs.readFileSync(SUBS, 'utf8')); } catch (_) {}

  if (subs.find(s => s.email === email)) {
    return res.status(409).json({ error: 'Ya estás registrado' });
  }

  const sub = {
    email,
    name: name || '',
    registeredAt: new Date().toISOString(),
    lastDaySent: 0,
    completed: false,
  };
  subs.push(sub);
  fs.writeFileSync(SUBS, JSON.stringify(subs, null, 2));

  // Enviar email de bienvenida + Día 1
  try {
    await transporter.sendMail({
      from: `"Reto Calistenia" <${process.env.GMAIL_USER}>`,
      to: email,
      subject: '🔥 Bienvenido al Reto Calistenia 7 Días',
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;background:#0a0a0a;color:white;padding:32px;border-radius:12px">
          <h1 style="color:#FF6B00">¡Bienvenido${name ? ', ' + name : ''}!</h1>
          <p style="color:#ccc;font-size:18px">Estás dentro del <strong>Reto Calistenia 7 Días</strong>.</p>
          <p style="color:#ccc">Durante los próximos 7 días recibirás un ejercicio diario. Sin gym. Sin equipo. Solo tu cuerpo.</p>
          <div style="background:#1a1a1a;padding:16px;border-radius:8px;margin:24px 0;border-left:4px solid #FF6B00">
            <strong>Día 1 — Mañana empieza:</strong><br>
            <span style="color:#FF6B00;font-size:24px">FLEXIONES</span><br>
            <span style="color:#ccc">3 series × 10 repeticiones</span>
          </div>
          <p style="color:#888;font-size:14px">Revisa tu bandeja mañana. El reto comienza.</p>
        </div>`,
    });
    sub.lastDaySent = 0;
    fs.writeFileSync(SUBS, JSON.stringify(subs, null, 2));
  } catch (err) {
    console.error('Email error:', err.message);
  }

  res.json({ ok: true, message: 'Registro exitoso. Revisa tu email.' });
});

app.get('/subscribers', (req, res) => {
  try {
    const subs = JSON.parse(fs.readFileSync(SUBS, 'utf8'));
    res.json({ total: subs.length, completed: subs.filter(s => s.completed).length });
  } catch (_) {
    res.json({ total: 0, completed: 0 });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor en http://localhost:${PORT}`);
});
