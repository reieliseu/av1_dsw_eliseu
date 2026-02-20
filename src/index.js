import {
  listarTarefas,
  criarTarefa,
  atualizarTarefa,
  excluirTarefa
} from "./tarefas.js";

listarTarefas();

console.log("Adicionando nova tarefa");
criarTarefa("Estudando para o enem");

atualizarTarefa(1, "", true);
excluirTarefa(2);

listarTarefas();

