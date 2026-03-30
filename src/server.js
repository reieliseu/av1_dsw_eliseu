import express from "express";
const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(express.json());

// Array simples em memória
let tarefas = [
  { id: 1, titulo: "Estudar Node", concluida: false },
  { id: 2, titulo: "Fazer telas no Figma", concluida: true },
];

// Helpers
function encontrarTarefa(id) {
  return tarefas.find((t) => t.id === Number(id));
}

// Rota raiz
app.get("/", (req, res) => {
  res.send("API de Tarefas com Express!");
});

// ROTA GET - listar todas tarefas
app.get("/tarefas", (req, res) => {
  res.json(tarefas);
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
  if (!titulo) return res.status(400).json({ erro: "Título é obrigatório" });

  const novaTarefa = {
    id: tarefas.length ? tarefas[tarefas.length - 1].id + 1 : 1,
    titulo: titulo,
    concluida: false,
  };
  tarefas.push(novaTarefa);

  return res.status(201).json(novaTarefa);
});

// ROTA PUT - atualizar tarefa
app.put("/tarefas/:id", (req, res) => {
  const tarefa = encontrarTarefa(req.params.id);
  if (!tarefa) return res.status(404).json({ erro: "Tarefa não encontrada" });

  const { titulo, concluida } = req.body;
  if (titulo !== undefined) tarefa.titulo = titulo;
  if (concluida !== undefined) tarefa.concluida = concluida;

  return res.json(tarefa);
});

// ROTA DELETE - deletar tarefa
app.delete("/tarefas/:id", (req, res) => {
  const indice = tarefas.findIndex((t) => t.id === Number(req.params.id));
  if (indice === -1)
    return res.status(404).json({ erro: "Tarefa não encontrada" });

  const tarefaDeletada = tarefas.splice(indice, 1);
  return res.json(tarefaDeletada[0]);
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
});
