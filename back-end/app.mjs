import express from "express";
import cache from "./cache.mjs";
import { v4 as uuidv4 } from "uuid";
import bcrypt from "bcrypt";
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import usersCache from './usersCache.mjs';
import cors from 'cors';

dotenv.config();
const ENV = process.env.ENV || "prd";
const JWT_SECRET = process.env.JWT_SECRET || "e28e3a4b-e748-4710-a93c-d01e29b0b641";

const corsOptions ={
  origin:'*', 
  credentials:true,            //access-control-allow-credentials:true
  optionSuccessStatus:200,
}

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
if (ENV === 'dev') app.use(cors(corsOptions));

// register a new user
app.post("/nutrients-calculator/users", async (req, res) => {
  const { email, password } = req.body;
  const uuid = uuidv4();
  if (!email || !password) {
    return res.status(400).json({ error: "Invalid request" });
  }
  const keys = usersCache.keys();
  for (const key of keys) {
    const value = usersCache.get(key);
    if (value.email === email) {
      return res.status(409).json({ error: "Email already exists" });
    }
  }
  const hashedPassword = await bcrypt.hash(password, 10);
  const value = { email, password: hashedPassword };
  usersCache.set(uuid, value, 86400);
  return res.status(201).json({ id: uuid });
});

// login
app.post("/nutrients-calculator/users/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "Invalid request" });
  }
  const keys = usersCache.keys();
  for (const key of keys) {
    const value = usersCache.get(key);
    if (value.email === email) {
      const match = await bcrypt.compare(password, value.password);
      if (match) {
        const token = jwt.sign({ id: key }, JWT_SECRET, { expiresIn: '1h' });
        return res.json({ email, token });
      }
    }
  }
  return res.status(401).json({ error: "Invalid email or password" });
});

// add a new calculation
app.post("/nutrients-calculator/calculations", (req, res) => {
  const { id, calculation } = req.body;
  const uuid = uuidv4();
  cache.set(uuid, { id, calculation }, 86400);
  return res.status(201).json({ uuid });
});

// update status of a calculation by uuid
app.put("/nutrients-calculator/calculations/:uuid", (req, res) => {
  const uuid = req.params.uuid;
  const { status } = req.body;
  if (!uuid || typeof uuid !== "string") {
    return res.status(400).json({ error: "missing or invalid UUID" });
  }
  if (!cache.has(uuid)) {
    return res.status(404).json({ error: "UUID does not exist" });
  }
  const value = cache.get(uuid);
  value.status = status;
  cache.set(uuid, value);
  return res.json({ uuid, status });
});

// get the list of calculations
app.get("/nutrients-calculator/calculations", (_, res) => {
  const keys = cache.keys();
  const allData = {};
  for (const key of keys) {
    allData[key] = cache.get(key);
  }
  return res.json(allData);
});

// get a calculation by uuid
app.get("/nutrients-calculator/calculations/:uuid", (req, res) => {
  const uuid = req.params.uuid;
  if (!uuid || typeof uuid !== "string") {
    return res.status(400).json({ error: "missing or invalid UUID" });
  }
  if (!cache.has(uuid)) {
    return res.status(404).json({ error: "UUID does not exist" });
  }
  const value = cache.get(uuid);
  return res.json(value);
});

// delete a calculation by uuid
app.delete("/nutrients-calculator/calculations/:uuid", (req, res) => {
  const uuid = req.params.uuid;
  if (!uuid || typeof uuid !== "string") {
    return res.status(400).json({ error: "missing or invalid UUID" });
  }
  if (!cache.has(uuid)) {
    return res.status(404).json({ error: "UUID does not exist" });
  }
  cache.del(uuid);
  return res.json({ uuid });
});

// health check
app.get("/healthz", (_, res) => {
  return res.sendStatus(200);
});

app.use((err, _req, res, next) => {
  if (res.headersSent) {
    return next(err);
  }
  console.error(err);
  res.status(500);
  res.json({ error: err.message });
});

app.use("*", (_, res) => {
  return res
    .status(404)
    .json({ error: "the requested resource does not exist on this server" });
});

export default app;
