# Costa&Costa — Fase PR #63: backup lógico e ensaio de recuperação

**Data da verificação:** 02/11/2026 (13:37 UTC)  
**Projeto correto:** `gclhailalyrokvmkwllm` (Costa&Costa Alimentação Forte, PostgreSQL 17, `ACTIVE_HEALTHY`).  
**Plano de organização:** `Free`.  
**Status de segurança:** **BLOQUEADO PARA DROP TABLE até backup completo e restore comprovados**.  
**NESTA ETAPA: nenhum backup real foi criado ou restaurado; nenhum dado foi modificado.**

## 1. Por que a recuperação é prioridade

A documentação do Supabase informa que backups diários automáticos são oferecidos nos planos Pro/Team/Enterprise. Para **Free** recomenda exportação periódica própria com `supabase db dump`. O status da organização foi confirmado via conexão Supabase; não há acesso por este conector para atestar um backup real armazenado/recuperável.

**Nunca confundir:** arquivos de migração, `pg_dump` parcial, tabela de inventário e snapshots de contagem **não são substitutos** de um backup completo restaurado com sucesso.

### Evidência do ambiente real

| Item | Quantidade verificada |
|---|---:|
| Tabelas `public` | 37 |
| Tabelas `public` sem RLS | 0 |
| Contas `auth.users` | 4 |
| Receitas | 128 |
| Ingredientes | 1.157 |
| Planos de refeição | 10 |
| Refeições planejadas | 177 |
| Listas de compras | 2 |
| Itens de compras persistidos | 2 |
| Decisões de compras | 2 |
| Catálogo de alimentos piloto | 172 |
| Revisões de medidas piloto | 1.072 |
| Vínculos beta de receitas | 114 |
| Histórico de migrações remoto | 87 |
| Storage — `recipe-illustrations` (público) | 130 objetos |
| Storage — `personal-recipe-images` (privado) | 5 objetos |

Extensões: `pg_stat_statements`, `pgcrypto`, `plpgsql`, `supabase_vault`, `uuid-ossp`.

**Atenção:** as tabelas `shopping_list_items` possuem 2 linhas no total; o fluxo de lista gerada também usa agregação dos ingredientes planejados. Os totais devem ser interpretados conforme sua finalidade.

## 2. Divergência no histórico de migrações

- Repositório `main@63bd28f`: **86 arquivos** em `supabase/migrations`.
- Histórico remoto da base: **87 entradas**.
- Diversos nomes e timestamps não coincidem entre os registros (ex.: migrações registradas com sufixo `_cloud`, arquivos locais sem esse sufixo). Diferenças nominais **não provam** diferença estrutural.
- **Proibido nesta fase:** executar `supabase db reset`, `db push`, `migration repair` ou reescrever histórico contra a produção.
- Antes de propor reconstrução via migrações, comparar o SQL efetivamente implantado e a estrutura exportada. O dump do esquema atual é essencial.

## 3. Exportação local inicial (Windows + WSL e Docker)

Requisitos: terminal WSL em máquina confiável, Docker ativo, Supabase CLI compatível e conexão administrativa do projeto obtida diretamente no painel.

1. Verifique `supabase --version` e `docker info`.
2. Abra no dashboard do projeto correto **Connect** e escolha a connection string de **Session pooler** conforme documentação atual. Não cole a senha no chat nem faça commit da URI.
3. No clone local atualizado do repositório, acesse a branch `audit/limpeza-tabelas-segura-02nov2026` e rode:
   ```bash
   bash scripts/backup/20261102_pr63_export_local_wsl.sh
   ```
4. O script solicita a conexão **localmente, sem ecoar o que foi digitado**, verifica que contém o identificador do projeto, gera `roles.sql`, `schema.sql`, `data.sql`, `SHA256SUMS.txt` e `STATUS_BACKUP.txt` em `~/cc-secure-backups/<project-ref>/<data-UTC>/`. Não salva senha no repositório.
5. O script verifica se os arquivos foram criados e confirma checksums SHA-256. **Não executa DDL** nem restaura dados.

**Risco residual:** a CLI passa a string para subprocessos, potencialmente visível na lista de processos do equipamento enquanto roda. Execute somente em equipamento seu, sem sessão compartilhada ou gravação integral de terminal. Guardar em mídia local segura/criptografada e em cópia externa protegida; nunca em pasta pública, GitHub, chat ou OneDrive sem criptografia.

### Exportação lógica não significa backup integral

O `supabase db dump` usa filtros internos e, por padrão, a referência da CLI informa exclusão de esquemas gerenciados como **auth** e **storage**. Outros guias de restauração descrevem diferentes escopos. **É obrigatório inspecionar os arquivos produzidos para confirmar a cobertura efetiva de `auth.users` e tabelas do Storage**, sem expor dados sensíveis.

Se essas entidades não estiverem incluídas, siga as instruções oficiais de migração e um procedimento administrativo próprio para backup seguro de autenticação, garantindo recuperação das 4 contas. **Não executar consultas que exportem credenciais ou e-mails para esta conversa ou para o repositório.**


### Alternativa Windows PowerShell — WSL ausente ou com Bash quebrado (02/11/2026)

O comando `bash scripts/backup/20261102_pr63_export_local_wsl.sh` no PowerShell retornou `execvpe(/bin/bash) failed: No such file or directory`. Isso ocorre **antes de o script começar**: o executável `bash` foi encaminhado ao WSL, mas a distribuição não encontrou `/bin/bash`. Não houve tentativa de conexão, exportação nem alteração de dados por esse comando.

Foi acrescentada uma alternativa de backup lógica usando **PowerShell Windows**, sem WSL: `scripts/backup/20261102_pr63_export_windows.ps1`. Ela exige Docker Desktop rodando e Supabase CLI (`supabase` ou `npx.cmd` instalado com Node.js). Por padrão, armazena saídas em `%LOCALAPPDATA%\\CostaCosta\\Backups\\gclhailalyrokvmkwllm\\<timestamp-UTC>`, fora da pasta do repositório e fora do OneDrive, e valida os tamanhos dos SQL gerados e hashes SHA-256. Solicita a URI por `Read-Host -AsSecureString` e não a grava em arquivo, mas a CLI ainda poderá expor o argumento durante a execução a processos locais de inspeção, razão para usar apenas máquina confiável.

Para utilizar sem trocar a branch de trabalho ou modificar arquivos locais, a partir da raiz do projeto no PowerShell:

```powershell
# Atualize apenas as referencias remotas; nao muda a branch de trabalho.
git fetch origin
$Script = Join-Path $env:TEMP 'cc_pr63_export_windows.ps1'
git show origin/audit/limpeza-tabelas-segura-02nov2026:scripts/backup/20261102_pr63_export_windows.ps1 | Set-Content -Path $Script -Encoding UTF8
powershell.exe -NoProfile -ExecutionPolicy Bypass -File $Script
```

Antes de executar, confira o conteúdo do script caso deseje: `notepad $Script`. O uso pontual de `-ExecutionPolicy Bypass` só vale para o processo iniciado; não altera permanentemente a política do Windows. A instalação inicial via `npx.cmd --yes supabase` exige conexão à internet. **Nenhuma senha ou conteúdo do backup deve ser publicado no chat ou no GitHub.**

Para diagnosticar o WSL independentemente do backup:

```powershell
wsl --list --verbose
```

Se não aparecer uma distribuição Linux instalada, a ausência de `/bin/bash` é esperada. Corrigir o WSL não é necessário para seguir com a versão PowerShell.

## 4. Storage: copiar os arquivos reais, não só metadados

A tabela PostgreSQL `storage.objects` guarda metadados; **não contém o conteúdo dos arquivos**. No momento da auditoria havia 135 objetos: 130 ilustrações públicas e 5 arquivos privados.

- Fazer cópia dos **bytes de todos os objetos**, preservando caminho/bucket, inclusive os 5 privados.
- Usar a ferramenta de download de objetos do Supabase Storage, ou cliente S3 compatível (Cyberduck/rclone) devidamente autenticado, seguindo a documentação oficial.
- Conferir quantidade, tamanho e hashes dos objetos exportados; manter arquivos privados criptografados.
- Nunca alterar a opção de bucket privado para público apenas para conseguir exportar.
- Não criar API keys/secrets no repositório.
- Em recuperação, comparar metadados **e arquivos reais**: restaurar o Postgres sem restaurar os arquivos do Storage é recuperação incompleta.

## 5. Ensaio de recuperação isolado

A restauração deve ser realizada em instância Supabase local/isolada ou projeto separado com custos e autorização previamente confirmados, **jamais na produção**.

1. Confirmar dump lógico (papéis, esquema e dados) e exportação de auth e Storage.
2. Confirmar extensões necessárias e compatibilidade do PostgreSQL 17.
3. Seguir a documentação oficial de restauração; aplicar privilégios e políticas RLS sem acesso anônimo indevido.
4. Restaurar Auth e arquivos do Storage em ambiente de teste, sem reutilizar chaves/JWT do projeto de produção em frontend de teste.
5. Executar `scripts/sql/20261102_pr63_compare_restore.sql` no original e no restaurado. Contagens e estado RLS devem ser compatíveis para um snapshot congelado na mesma data; a diferença de tempo de captura exige reconciliação.
6. Revalidar login de conta de teste autorizada, acesso anônimo (sem perfis/compras), listagem de receitas publicadas e piloto, planejamento, compras, permissões beta, administração e evolução privada.
7. Validar integridade referencial, storage privado, imagens públicas e fluxos reservados de revisão profissional e assinaturas.
8. Guardar somente logs sem segredos e checksums verificados; documentar evidência concreta de recuperação.
9. Só então discutir **quais tabelas específicas** eventualmente descontinuar, com migração versionada e plano de rollback testado, sem `CASCADE` genérico.

## 6. Portões de decisão

| Controle | Estado em 02/11/2026 |
|---|---|
| Inventário com as 37 tabelas | Concluído |
| Banco saudável, RLS e contagens de integridade | Verificados em modo leitura |
| Plano do Supabase identificado | Free |
| Histórico de migrações inspecionado | 87 remoto / 86 GitHub; divergência a conciliar |
| Script local de exportação preparado | Concluído, **ainda não executado no computador do responsável** |
| Backup local do banco comprovado | Pendente |
| Identidades Auth incluídas/verificadas | Pendente |
| 135 arquivos do Storage exportados | Pendente |
| Restauração testada em ambiente isolado | Pendente |
| Exclusão de tabelas em produção | **Bloqueada; zero tabelas excluídas** |

A decisão do responsável permanece: **manter para o futuro assinaturas e revisão nutricional profissional**, sem ativações clínicas/comerciais no beta.

## 7. Fontes oficiais

- [Supabase — Database Backups](https://supabase.com/docs/guides/platform/backups)
- [Supabase — CLI db dump](https://supabase.com/docs/reference/cli/supabase-db-dump)
- [Supabase — Backup and Restore using the CLI](https://supabase.com/docs/guides/platform/migrating-within-supabase/backup-restore)
- [Supabase — Restore Platform to Self-Hosted](https://supabase.com/docs/guides/self-hosting/restore-from-platform)
- [Supabase — Download Storage Objects](https://supabase.com/docs/guides/storage/management/download-objects)
