import express from "express";
import fs from "fs";
import path from "path";
import cors from "cors";
import helmet from "helmet";
import Joi from "joi";
import sqlite3 from "sqlite3";
import swaggerUi from "swagger-ui-express";
import swaggerJsdoc from "swagger-jsdoc";

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(cors());
app.use(helmet());

// Arquivo JSON para persistência simples
const DATA_FILE = path.resolve(process.cwd(), "data.json");
function loadFromFile() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, "utf8");
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error("Erro ao ler data.json", err);
  }
  return [];
}
function saveToFile(tarefas) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(tarefas, null, 2), "utf8");
  } catch (err) {
    console.error("Erro ao salvar data.json", err);
  }
}

// Inicializa tarefas a partir do arquivo JSON
let tarefas = loadFromFile();
if (!tarefas || !Array.isArray(tarefas) || tarefas.length === 0) {
  tarefas = [
    { id: 1, titulo: "Estudar Node", concluida: false },
    { id: 2, titulo: "Fazer telas no Figma", concluida: true }
  ];
  saveToFile(tarefas);
}

// SQLite básico (arquivo local)
const DB_FILE = path.resolve(process.cwd(), "tarefas.db");
const db = new sqlite3.Database(DB_FILE);

db.serialize(() => {
  db.run(
    `CREATE TABLE IF NOT EXISTS tarefas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      titulo TEXT NOT NULL,
      concluida INTEGER NOT NULL DEFAULT 0
    )`
  );
});

// Helpers
function encontrarTarefa(id) {
  return tarefas.find((t) => t.id === Number(id));
}

// Validação com Joi
const tarefaSchema = Joi.object({
  titulo: Joi.string().trim().min(1).required(),
  concluida: Joi.boolean().optional()
});

// Swagger setup
const swaggerSpec = swaggerJsdoc({
  definition: {
    openapi: "3.0.0",
    info: { title: "API de Tarefas", version: "1.0.0" }
  },
  apis: [__filename]
});
app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

/**
 * @openapi
 * /tarefas:
 *   get:
 *     summary: Lista tarefas
 *     responses:
 *       200:
 *         description: Lista de tarefas
 */
app.get("/", (req, res) => res.send("API de Tarefas funcionando com persistência"));

// ROTA GET - listar todas tarefas (com query optional ?concluida=true|false)
app.get("/tarefas", (req, res) => {
  const { concluida } = req.query;
  if (concluida === "true" || concluida === "false") {
    const valor = concluida === "true";
    return res.json(tarefas.filter((t) => t.concluida === valor));
  }
  return res.json(tarefas);
});

// ROTA GET - obter tarefa por id
app.get("/tarefas/:id", (req, res) => {
  const tarefa = encontrarTarefa(req.params.id);
  if (!tarefa) return res.status(404).json({ erro: "Tarefa não encontrada" });
  return res.json(tarefa);
});

// ROTA POST - criar nova tarefa (salva em JSON e SQLite)
app.post("/tarefas", (req, res) => {
  const { error, value } = tarefaSchema.validate(req.body);
  if (error) return res.status(400).json({ erro: error.message });

  const novaTarefa = {
    id: tarefas.length ? tarefas[tarefas.length - 1].id + 1 : 1,
    titulo: value.titulo,
    concluida: false
  };
  tarefas.push(novaTarefa);
  saveToFile(tarefas);

  db.run(
    `INSERT INTO tarefas (titulo, concluida) VALUES (?, ?)`,
    [novaTarefa.titulo, 0],
    function (err) {
      if (err) console.error(err);
    }
  );

  return res.status(201).json(novaTarefa);
});

// ROTA PUT - atualizar tarefa inteira
app.put("/tarefas/:id", (req, res) => {
  const tarefa = encontrarTarefa(req.params.id);
  if (!tarefa) return res.status(404).json({ erro: "Tarefa não encontrada" });

  const { error, value } = tarefaSchema.validate(req.body);
  if (error) return res.status(400).json({ erro: error.message });

  tarefa.titulo = value.titulo;
  tarefa.concluida = !!value.concluida;
  saveToFile(tarefas);

  db.run(
    `UPDATE tarefas SET titulo = ?, concluida = ? WHERE id = ?`,
    [tarefa.titulo, tarefa.concluida ? 1 : 0, tarefa.id],
    (err) => {
      if (err) console.error(err);
    }
  );

  return res.json(tarefa);
});

// ROTA PATCH - atualizar parcialmente (ex: só concluir)
app.patch("/tarefas/:id", (req, res) => {
  const tarefa = encontrarTarefa(req.params.id);
  if (!tarefa) return res.status(404).json({ erro: "Tarefa não encontrada" });

  const schemaPatch = Joi.object({ titulo: Joi.string().trim().min(1), concluida: Joi.boolean() });
  const { error, value } = schemaPatch.validate(req.body);
  if (error) return res.status(400).json({ erro: error.message });

  if (value.titulo !== undefined) tarefa.titulo = value.titulo;
  if (value.concluida !== undefined) tarefa.concluida = value.concluida;

  saveToFile(tarefas);

  db.run(
    `UPDATE tarefas SET titulo = ?, concluida = ? WHERE id = ?`,
    [tarefa.titulo, tarefa.concluida ? 1 : 0, tarefa.id],
    (err) => {
      if (err) console.error(err);
    }
  );

  return res.json(tarefa);
});

// ROTA DELETE - remover tarefa
app.delete("/tarefas/:id", (req, res) => {
  const id = Number(req.params.id);
  const index = tarefas.findIndex((t) => t.id === id);
  if (index === -1) return res.status(404).json({ erro: "Tarefa não encontrada" });
  const [removida] = tarefas.splice(index, 1);
  saveToFile(tarefas);

  db.run(`DELETE FROM tarefas WHERE id = ?`, [id], (err) => {
    if (err) console.error(err);
  });

  return res.json({ mensagem: "Tarefa removida", tarefa: removida });
});

// Tratamento de erro genérico
app.use((err, req, res, next) => {
  console.error(err);
  return res.status(500).json({ erro: "Erro interno" });
});

// Inicializar servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
});
