# Kolibri PRD v1.2 — Section 7.4 + DPA outline (DPO2U-MCP integration)

> Artefato pronto pra anexar/inserir no PRD MVP v1.2. Estrutura espelha a numeração existente.
> Fonte: plano `/root/.claude/plans/o-mvp-de-fato-polished-rocket.md` (aprovado 2026-05-27 Chairman DPO2U).

---

## 7.4 Integrações externas obrigatórias — DPO2U-MCP

**Provedor.** DPO2U Compliance MCP Server.

**Endpoint produção.** `https://mcp.dpo2u.com` (HTTPS-only, TLS ≥ 1.2)

**SLA.** 99,5% disponibilidade mensal, alinhado com §10.2 do Kolibri. Janela de manutenção programada: domingos 02:00-04:00 BRT, anúncio 72h antes via webhook.

**Auth.** API token bearer por tenant (header `Authorization: Bearer kbr_<tenant_id>_<token>`). Rotação obrigatória a cada 90 dias.

**Modo de operação.** **Assíncrono não-bloqueante**. A indisponibilidade do MCP não impede a operação do Kolibri (cadastro, dispensação, registro de eventos), apenas atrasa o anchoring on-chain e a auditoria contínua. Reconciliação por job `traceability_anchor_worker` (intervalo 5min, retry exponencial até 24h, fallback humano após).

**Tools chamadas pelo Kolibri.** Lista canônica:

| Tool | Frequência | Propósito |
|---|---|---|
| `submit_composed_attestation` | Cada evento de planta (15 tipos) | Anchor on-chain via Composed Stack — Shadow Drive + Light + SP1 + Squads. ~$0.03/evento |
| `submit_compliance_attestation` | Fallback eventos baixo volume | Anchor genérico sem ZK/compressão |
| `fetch_compliance_attestation` | Audit trail (auditor ANVISA, recall, exportação) | Recupera attestation por PDA pra inclusão em PDF assinado |
| `submit_consent_record` | Onboarding paciente | Consentimento LGPD on-chain via `consent-manager` |
| `submit_consent_revoke` | Paciente revoga | Idem, mutação de estado |
| `verify_corpus_manifest_onchain` | Boot do tenant + diariamente | Confirma que o tenant está alinhado com a versão vigente da RDC 1.015/2026 + SNGPC pinada via `legal-source-manifest` |
| `resolve_legal_citation` | On-demand (UI ou auditor) | Resolve artigo da RDC/SNGPC citado em um evento |
| `generate_dpia` | Antes do go-live + anual | DPIA inicial obrigatório LGPD Art. 38 |
| `check_compliance` (jurisdiction=LGPD) | Onboarding tenant + mensal | Gap check inicial + monitoramento contínuo |
| `submit_hiroshima_icoc_attestation` | Opcional, futuro ML | Atestação de governança AI se houver ML no flow (classificador de defeito de planta, scoring fotométrico, etc.) |

**Dados que saem do Kolibri pra DPO2U.**

| Categoria | Inclui | NÃO inclui |
|---|---|---|
| Metadados | `tenant_id`, `batch_id` (ULID), `event_type` (1-15), `cultivar_code`, `emitted_at`, `legal_basis_code` | — |
| Hashes | `payload_hash` (sha256 do payload off-chain canonicalizado) | — |
| URIs | `storage_uri` (ipfs:// ou shadow://) | URLs com PII no path |
| Identificadores | `authority_pubkey` (cultivador/dispensário/lab via `agent-registry`) | CPF, CNS, dados clínicos, endereço, condição médica |
| **PII** | **Nenhum dado pessoal trafega** | Tudo é hash off-chain, payload original fica em Postgres do Kolibri ou Shadow Drive cifrado |

**Base legal LGPD da relação Kolibri ↔ DPO2U.**

- **DPO2U = operador** (Art. 5, VII LGPD)
- **Kolibri = controlador** ou **controlador conjunto com dispensário** (Art. 5, IX) — define-se em contrato bilateral
- **DPA (Data Processing Agreement) bilateral obrigatório** — minuta na Seção 7.4.1 abaixo
- DPO2U não usa os dados para outra finalidade. Não há cross-tenant pooling.

**Posicionamento na Seção 12 (Riscos).**

> *Risco: Dependência crítica de fornecedor de auditoria externa (DPO2U-MCP).*
> *Probabilidade: Baixa. Impacto: Médio.*
> *Mitigação: (1) modo assíncrono — indisponibilidade não trava operação; (2) cache local de `last-known-good attestation`; (3) retry exponencial até 24h; (4) fallback manual via SDK direto na chain Solana; (5) DPA com SLA contratual e exit-clause de 90 dias com export completo dos dados anchored.*

**Cláusula contratual sugerida (anexa ao contrato master Kolibri-Dispensário).**

> "O dispensário declara estar ciente de que o Kolibri opera sobre infraestrutura de auditoria contínua de conformidade fornecida por DPO2U Ltda. (CNPJ XX.XXX.XXX/0001-XX), na qualidade de operador LGPD. Os dados trafegados ao DPO2U-MCP limitam-se a metadados de eventos e hashes criptográficos, não incluindo dados pessoais ou clínicos do paciente. Em caso de cessação do contrato Kolibri-DPO2U, o dispensário será notificado com 90 dias de antecedência e receberá exportação completa das attestations on-chain referentes ao seu tenant."

---

## 7.4.1 Outline da DPA Operador LGPD (DPO2U ↔ Kolibri)

> Esqueleto pra advogado fechar. DPO2U fornece versão final assinável quando Kolibri entrar em S0.

### Cláusulas obrigatórias

1. **Partes**
   - Controlador: Kolibri Tech Ltda. (CNPJ ...) — ou Pedro Pelicioni MEI/EI até constituição
   - Operador: DPO2U Ltda. (CNPJ ...) — Frederico Santana, DPO/Founder

2. **Objeto**
   - Tratamento de dados pessoais e metadados de eventos de rastreabilidade de cannabis medicinal para fins de auditoria contínua de conformidade LGPD/RDC 1.015/2026/SNGPC, conforme Art. 39 LGPD.

3. **Finalidade específica**
   - Receber, processar e anchored on-chain (Solana mainnet via Composed Stack) **hashes e metadados** de eventos de rastreabilidade
   - Gerar relatórios de DPIA, ROPA, gap analysis e atestações de conformidade
   - **Fora de finalidade:** marketing, perfilamento, cross-tenant analytics, treinamento de modelos de IA com dados do controlador

4. **Categorias de dados tratados**
   - Metadados de eventos (não-PII): batch_id, event_type, cultivar_code, emitted_at, authority_pubkey, payload_hash, storage_uri
   - **Não trafega:** dados pessoais, dados sensíveis de saúde (Art. 11), receita médica, prescritor, paciente

5. **Categorias de titulares**
   - Pacientes (apenas via hash anônimo, NUNCA dado identificável)
   - Médicos prescritores (CRM como public key on-chain via agent-registry)
   - Profissionais do dispensário (público no contrato master)

6. **Duração**
   - Vigência casada com o contrato master Kolibri-DPO2U
   - Retenção de attestations on-chain: **perene** (natureza da blockchain — não há "deleção" de bloco confirmado)
   - Retenção de metadados em backend DPO2U: 12 meses rolling, com purge automático

7. **Segurança e medidas técnicas (Art. 46 LGPD)**
   - TLS 1.2+ em trânsito
   - AES-256-GCM em repouso (Postgres + Shadow Drive)
   - Rotação de chaves API a cada 90 dias
   - Audit logs imutáveis (próprio MCP atesta on-chain os calls recebidos via Composed Stack)
   - Hardening Docker (no-new-privileges, capabilities drop, pids/memory limits)
   - SOPS pra secrets em repos
   - Self-DPIA DPO2U disponível em `06-Memory/Strategic/2026-05-11-dpo2u-self-dpia.md`
   - Threat model: `06-Memory/Strategic/2026-05-11-threat-model.md`

8. **Subprocessadores autorizados**
   - Solana (RPC Helius/QuickNode/Triton) — anchoring on-chain (público, imutável, sem PII)
   - Shadow Drive (Genesys Go) — armazenamento imutável de payloads (cifrados client-side pelo Kolibri ANTES de envio)
   - Light Protocol — compressão de leaves (público)
   - Squads V4 — multisig pra deploys de programas (não toca em dados de tenant)
   - Lista pública atualizada em `https://dpo2u.com/subprocessors`

9. **Direitos do titular (Art. 18 LGPD)**
   - Confirmação/acesso: DPO2U responde pedidos via MCP `dsr_*` endpoints; resposta em até 15 dias úteis
   - Correção: como os dados são hashes, correção off-chain no Kolibri gera novo evento de retificação anchored
   - **Anonimização/eliminação (Art. 18, IV):** dado off-chain (Postgres do controlador) é deletável; dado on-chain (hash) é **anonimização irreversível** pela destruição da chave de descifragem do payload original — atestada via `erase_attestation_payload`
   - Portabilidade: export completo em JSON via MCP `fetch_compliance_attestation` por batch_id

10. **Incidente de segurança (Art. 48 LGPD)**
    - DPO2U notifica controlador em até 24h da detecção
    - Apoio à comunicação à ANPD via `report_ai_incident` (tool MCP)
    - Plano de resposta validável via `simulate_breach`

11. **Auditoria pelo controlador**
    - Direito anual de auditoria com 30 dias de aviso prévio
    - Relatórios de compliance via `audit_infrastructure` + `calculate_privacy_score` disponíveis on-demand
    - Logs imutáveis on-chain por padrão

12. **Cessação do contrato**
    - Aviso prévio: 90 dias
    - DPO2U fornece dump completo dos dados anchored (JSON + provas Merkle)
    - Operador NÃO retém metadados após 30 dias da cessação (purge automático)
    - Atestações on-chain permanecem (natureza imutável; controlador continua proprietário dos PDAs)

13. **Foro e lei aplicável**
    - Lei brasileira (LGPD Lei 13.709/2018)
    - Foro: comarca da sede do Kolibri OU arbitragem CAM-CCBC à escolha do controlador

---

## 7.4.2 Checklist de onboarding DPO2U pra Kolibri (S0)

Antes do Kolibri abrir o primeiro tenant em devnet:

- [ ] DPA assinada (modelo Seção 7.4.1)
- [ ] API token tenant gerado (rotação 90d agendada)
- [ ] Webhook de incidente configurado (`incident-webhook.kolibri.com.br/dpo2u`)
- [ ] `agent-registry` PDA criado pra cada cultivador/dispensário/lab piloto (formato `name="cultivator:CNPJ"`)
- [ ] `legal-source-manifest` boot — verificar que `jurisdiction="ANVISA-RDC-1015-2026"` e `"SNGPC"` estão pinadas (se não, criar)
- [ ] `submit_consent_record` smoke test com paciente-fantoche (devnet)
- [ ] DPIA inicial via `generate_dpia` — output validado pelo DPO do Kolibri
- [ ] ROPA inicial registrado
- [ ] Cron `traceability_anchor_worker` configurado e monitorado

---

## Notas finais

Este documento substitui/expande a referência ao DPO2U-MCP que existia como "dependência crítica não documentada" no PRD v1.0 → v1.1 (§4.1, único item crítico remanescente do Bloco 1).

Após inserção no PRD v1.2, atualizar:
- US-CMP-001: renomear pra "Auditoria contínua de conformidade" (remover "DPO2U-MCP" do título)
- Seção 12 (Riscos): inserir linha "Dependência crítica de fornecedor de auditoria externa" com mitigações desta seção
- Seção 15 (Glossário): adicionar entradas "DPO2U-MCP", "Composed Stack", "agent-registry", "legal-source-manifest"

**Próximos passos pro Pedro:**
1. Validar a redação desta Section 7.4 com seu time
2. Anexar como parte do PRD v1.2
3. Combinar data pra fechar a DPA (DPO2U envia versão assinável)
4. Iniciar S0 (scaffold do repo `kolibri`) — DPO2U fornece SDK + sample apps quando o repo estiver vivo
