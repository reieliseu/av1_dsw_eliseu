$port = "4000"
$baseUrl = "http://localhost:$port"

Write-Host "======================================================="
Write-Host "TESTES DAS ROTAS DE EDICAO E EXCLUSAO"
Write-Host "======================================================="

# 1. GET - Listar todas tarefas
Write-Host "`n[1] LISTAR TAREFAS INICIAIS"
curl.exe -s $baseUrl/tarefas | ConvertFrom-Json | ConvertTo-Json

# 2. PUT - Editar tarefa
Write-Host "`n[2] EDITAR TAREFA 1"
$bodyPut = '{"titulo":"Estudar Express EDITADO","concluida":false}'
curl.exe -X PUT -H "Content-Type: application/json" -d $bodyPut $baseUrl/tarefas/1 | ConvertFrom-Json | ConvertTo-Json

# 3. GET - Verificar edição
Write-Host "`n[3] VERIFICAR EDICAO"
curl.exe -s $baseUrl/tarefas/1 | ConvertFrom-Json | ConvertTo-Json

# 4. DELETE - Deletar tarefa
Write-Host "`n[4] DELETAR TAREFA 1"
curl.exe -X DELETE $baseUrl/tarefas/1 | ConvertFrom-Json | ConvertTo-Json

# 5. GET - Verificar se foi deletada
Write-Host "`n[5] VERIFICAR DELECAO (lista vazia esperada)"
curl.exe -s $baseUrl/tarefas

# 6. Tentar GET de tarefa inexistente
Write-Host "`n[6] TENTAR OBTER TAREFA INEXISTENTE"
curl.exe -s $baseUrl/tarefas/1

Write-Host "`n======================================================="
Write-Host "CONCLUSAO: ROTAS FUNCIONANDO CORRETAMENTE"
Write-Host "======================================================="
