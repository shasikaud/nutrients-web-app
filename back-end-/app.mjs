import express from "express";
import cache from "./cache.mjs";
import usersCache from "./usersCache.mjs";
import { v4 as uuidv4 } from "uuid";
import dotenv from "dotenv";
import cors from "cors";
import { use } from "chai";
import bcrypt from "bcrypt";
import jwt from 'jsonwebtoken';

dotenv.config();
const ENV = process.env.NODE_ENV || "prd";
const JWT_SECRET = process.env.JWT_SECRET || "e28e3a4b-e748-4710-a93c-d01e29b0b641";

const corsOptions ={
  origin:'*', 
  credentials:true,            //access-control-allow-credentials:true
  optionSuccessStatus:200,
}

const app = express();
app.use(cors(corsOptions))
app.use(express.json());
if (ENV === 'dev') app.use(express.urlencoded({ extended: true }));

// add a user
app.post("/app/users/register", async (req, res) => {
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
app.post("/app/users/login", async (req, res) => {
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

// add a book - request body should contain a title, status and an author
app.post("/app/books", (req, res) => {
  const { title, author, status } = req.body;
  const uuid = uuidv4();
  if (!(status === "read" || status === "to_read" || status === "reading")) {
    return res.status(400).json({
      error: "Status is invalid. Accepted statuses: read | to_read | reading",
    });
  }
  if (!title || !author || !status) {
    return res.status(400).json({ error: "Title, Status or Author is empty" });
  }
  const value = { uuid, title, author, status };
  cache.set(uuid, value, 86400);
  return res.status(201).json({ uuid, title, author });
});

// update status of a book by uuid
app.put("/reading-list/books/:uuid", (req, res) => {
  const uuid = req.params.uuid;
  const { status } = req.body;
  if (!uuid || typeof uuid !== "string") {
    return res.status(400).json({ error: "missing or invalid UUID" });
  }
  if (!cache.has(uuid)) {
    return res.status(404).json({ error: "UUID does not exist" });
  }
  if (!(status === "read" || status === "to_read" || status === "reading")) {
    return res.status(400).json({
      error: "Status is invalid. Accepted statuses: read | to_read | reading",
    });
  }
  const value = cache.get(uuid);
  value.status = status;
  cache.set(uuid, value);
  return res.json({ uuid, status });
});

// get the list of books
app.get("/app/books", (_, res) => {
  const keys = cache.keys();
  const allData = {};
  for (const key of keys) {
    allData[key] = cache.get(key);
  }
  return res.json(allData);
});

// get a book by uuid
app.get("/reading-list/books/:uuid", (req, res) => {
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

// delete a book by uuid
app.delete("/reading-list/books/:uuid", (req, res) => {
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
