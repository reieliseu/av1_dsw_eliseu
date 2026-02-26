import express from "express";

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());

// Dados em memória
let tarefas = [
  { id: 1, titulo: "Estudar Node", concluida: false },
  { id: 2, titulo: "Fazer telas no Figma", concluida: true }
];

// Helpers
const encontrarTarefa = (id) => tarefas.find((t) => t.id === Number(id));

// ROTA GET - raiz
app.get("/", (req, res) => res.send("API de Tarefas funcionando"));

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

// ROTA POST - criar nova tarefa
app.post("/tarefas", (req, res) => {
  const { titulo } = req.body;
  if (!titulo || typeof titulo !== "string" || titulo.trim() === "") {
    return res.status(400).json({ erro: "O campo 'titulo' é obrigatório." });
  }
  const novaTarefa = {
    id: tarefas.length ? tarefas[tarefas.length - 1].id + 1 : 1,
    titulo: titulo.trim(),
    concluida: false
  };
  tarefas.push(novaTarefa);
  return res.status(201).json(novaTarefa);
});

// ROTA PUT - atualizar tarefa inteira
app.put("/tarefas/:id", (req, res) => {
  const tarefa = encontrarTarefa(req.params.id);
  if (!tarefa) return res.status(404).json({ erro: "Tarefa não encontrada" });

  const { titulo, concluida } = req.body;
  if (!titulo || typeof titulo !== "string" || titulo.trim() === "") {
    return res.status(400).json({ erro: "O campo 'titulo' é obrigatório." });
  }
  if (typeof concluida !== "boolean") {
    return res.status(400).json({ erro: "O campo 'concluida' deve ser booleano." });
  }

  tarefa.titulo = titulo.trim();
  tarefa.concluida = concluida;

  return res.json(tarefa);
});

// ROTA PATCH - atualizar parcialmente (ex: só concluir)
app.patch("/tarefas/:id", (req, res) => {
  const tarefa = encontrarTarefa(req.params.id);
  if (!tarefa) return res.status(404).json({ erro: "Tarefa não encontrada" });

  const { titulo, concluida } = req.body;
  if (titulo !== undefined) {
    if (typeof titulo !== "string" || titulo.trim() === "") {
      return res.status(400).json({ erro: "O campo 'titulo' inválido." });
    }
    tarefa.titulo = titulo.trim();
  }
  if (concluida !== undefined) {
    if (typeof concluida !== "boolean") {
      return res.status(400).json({ erro: "O campo 'concluida' deve ser booleano." });
    }
    tarefa.concluida = concluida;
  }

  return res.json(tarefa);
});

// ROTA DELETE - remover tarefa
app.delete("/tarefas/:id", (req, res) => {
  const id = Number(req.params.id);
  const index = tarefas.findIndex((t) => t.id === id);
  if (index === -1) return res.status(404).json({ erro: "Tarefa não encontrada" });
  const [removida] = tarefas.splice(index, 1);
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
