# Pesquisa - Condições de Trabalho Profissional

Sistema web para coleta e análise de respostas sobre condições de trabalho de profissionais da área de Serviço Social/Saúde.

## Funcionalidades

- Formulário completo com questões 11-16
- Relatórios com gráficos de barras
- Exportação em CSV e JSON
- Banco de dados SQLite persistente

## Executar localmente

```bash
# Instalar dependências
npm install

# Iniciar servidor
npm start

# Acessar em http://localhost:3000
```

## Deploy no Render

1. Crie um repositório no GitHub com este código
2. Acesse [render.com](https://render.com) e faça login
3. Clique em "New" → "Web Service"
4. Conecte seu repositório GitHub
5. O Render detectará automaticamente as configurações do `render.yaml`
6. Clique em "Create Web Service"

**Importante:** O Render usa um disco persistente para o SQLite. O plano gratuito inclui 1GB.

## Estrutura do projeto

```
├── server.js          # Servidor Express + API
├── package.json       # Dependências Node.js
├── render.yaml        # Configuração do Render
├── public/
│   ├── index.html     # Formulário
│   ├── relatorios.html # Página de relatórios
│   ├── styles.css     # Estilos
│   └── app.js         # JavaScript frontend
└── data/
    └── pesquisa.db    # Banco SQLite (criado automaticamente)
```

## API Endpoints

- `POST /api/respostas` - Salvar nova resposta
- `GET /api/respostas` - Listar todas as respostas
- `GET /api/estatisticas` - Estatísticas agregadas
- `DELETE /api/respostas` - Limpar todas as respostas
