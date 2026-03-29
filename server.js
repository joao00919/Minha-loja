const express = require("express");
const app = express();

app.use(express.json());

// rota principal (IMPORTANTE)
app.get("/", (req, res) => {
  res.send("Servidor funcionando 🔥");
});

// webhook simples
app.post("/webhook", (req, res) => {
  console.log("Webhook:", req.body);
  res.sendStatus(200);
});

// porta obrigatória Railway
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Rodando na porta", PORT));
