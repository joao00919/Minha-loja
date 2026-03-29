const express = require("express");
const axios = require("axios");
const fs = require("fs");

const app = express();
app.use(express.json());
app.use(express.static("public"));

const API_KEY = process.env.API_KEY;

const produtos = JSON.parse(fs.readFileSync("produtos.json"));
let estoque = JSON.parse(fs.readFileSync("estoque.json"));

// listar produtos
app.get("/produtos", (req, res) => {
  res.json(produtos);
});

// checkout
app.post("/checkout", async (req, res) => {
  const { itens } = req.body;

  let total = 0;
  itens.forEach(id => {
    const p = produtos.find(x => x.id == id);
    total += p.preco;
  });

  const response = await axios.post(
    "https://api.promisse.com.br/v1/pix",
    { amount: total },
    { headers: { Authorization: API_KEY } }
  );

  res.json(response.data);
});

// ✅ WEBHOOK (FORA DE TUDO)
app.post("/webhook", (req, res) => {
  try {
    const data = req.body;
    console.log("Webhook recebido:", data);

    if (data.status === "paid") {
      const produtoId = data.metadata?.produtoId;

      let estoque = JSON.parse(fs.readFileSync("estoque.json"));
      const item = estoque[produtoId]?.shift();

      fs.writeFileSync("estoque.json", JSON.stringify(estoque, null, 2));

      console.log("ENTREGAR:", item);
    }

    res.sendStatus(200);
  } catch (err) {
    console.error(err);
    res.sendStatus(200);
  }
});

// porta correta pro Railway
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("🔥 Rodando"));
