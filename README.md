# 🚀 SENAI Flow - Sistema Tecnológico para Gestão e Comunicação Educacional

> Trabalho de Conclusão de Curso (TCC) apresentado ao SENAI Almirante Tamandaré para obtenção do título de Técnico em Desenvolvimento de Sistemas.

---

## 📌 Sobre o Projeto

O **SENAI Flow** é uma plataforma integrada (Web e Mobile) desenvolvida para modernizar a gestão de infraestrutura, logística de reserva de salas e comunicação institucional da unidade SENAI Almirante Tamandaré (São Bernardo do Campo). 

O sistema resolve gargalos operacionais como conflitos de ensalamento, relatos informais de avarias em equipamentos via QR Code, rastreabilidade patrimonial por NIF e alocação de espaços em conformidade com as diretrizes da coordenação e CIPA.

---
## 👥 Equipa de Desenvolvimento

| Integrante | Função | Responsabilidades Principais |
| :--- | :--- | :--- |
| **Arthur Henrique Vieira Silva** | Scrum Master / Engenheiro de Requisitos | Gestão do projeto, engenharia de requisitos (RF/RNF), regras de negocio e mediação com a orientação. |
| **Giovanna Menezes Machado** | UI/UX Designer / Frontend Developer | Prototipagem no Figma, desenvolvimento de componentes em Next.js/React e estilização em SCSS. |
| **Julia Lima do Carmo** | Modeladora de Dados / DBA | Modelagem MER/DER, dicionário de dados, schemas no Prisma ORM e gestão do PostgreSQL. |
| **Julio de Souza Gonçalves** | Backend Developer / Arquiteto & Product Owner | Arquitetura da API REST em Node.js com Express e TypeScript, e implementação das regras de negócio. |
| **Matheus Fernandes Braga** | Engenheiro de Segurança & QA | Implementação de autenticação (JWT/BcryptJS), upload de arquivos (Multer) e testes de integração. |

### 👨‍🏫 Orientador
* Prof. **Edgard Coutinho Silva**
* Prof. **Tiago Reis**
---

## 🛠️ Stack Tecnológica

### **Frontend**
* **Framework Web:** [Next.js](https://nextjs.org/) + [React](https://react.dev/)
* **Linguagem:** TypeScript
* **Estilização:** Sass (SCSS)
* **Comunicação HTTP:** Axios
* **UI Components & Notificações:** Lucide React (Ícones) + Sonner (Toasts/Notificações)

### **Backend**
* **Ambiente de Execução:** [Node.js](https://nodejs.org/)
* **Framework Web:** Express
* **Linguagem:** TypeScript
* **ORM:** Prisma ORM
* **Segurança e Autenticação:** JWT (JSON Web Token) + BcryptJS
* **Upload de Ficheiros:** Multer (para fotos de avarias em equipamentos)
* **Outros:** CORS, Dotenv (.env)

### **Banco de Dados**
* **SGBD Relacional:** [PostgreSQL](https://www.postgresql.org/)

---

## 📁 Estrutura do Repositório

```text
senai-flow/
├── docs/                 # Documentação acadêmica e TCC
│   ├── monografia.pdf    # Texto da Monografia / TCC
│   ├── diagramas/        # MER, DER e Casos de Uso
│   └── briefings/        # Questionários e dados coletados
├── src/                  # Código-fonte do sistema
│   ├── backend/          # API e regras de negócio
│   └── frontend/         # Aplicação Web/Mobile
├── .gitignore
└── README.md
