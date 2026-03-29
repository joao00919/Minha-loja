const express = require("express");
const axios = require("axios");
const fs = require("fs");

const app = express();
app.use(express.json());
app.use(express.static("public"));

const API_KEY = process.env.API_KEY;

const produtos = JSON.parse(fs.readFileSync("produtos.json"));
let estoque = JSON.parse(fs.readFileSync("estoque.json"));

app.get("/produtos", (req, res) => {
  res.json(produtos);
});

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

app.listen(3000, () => console.log("🔥 Rodando"));
