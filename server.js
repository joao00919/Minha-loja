const express = require("express");
const axios = require("axios");

const app = express();
app.use(express.json());

const API_KEY = "SUA_API_AQUI";

// Rota teste
app.get("/", (req, res) => {
  res.send("Servidor funcionando 🔥");
});

// Criar pagamento PIX
app.post("/pix", async (req, res) => {
  try {
    const response = await axios.post(
      "https://api.promisse.com.br/v1/pix",
      { amount: 1000 },
      {
        headers: { Authorization: API_KEY }
      }
    );

    res.json(response.data);
  } catch (err) {
    res.status(500).json({ erro: "Erro no PIX" });
  }
});

app.listen(3000, () => console.log("Rodando..."));