let carrinho = [];

async function carregar() {
  const res = await fetch("/produtos");
  const produtos = await res.json();

  produtos.forEach(p => {
    document.getElementById("produtos").innerHTML += `
      <div class="produto">
        <h3>${p.nome}</h3>
        <p>R$${p.preco/100}</p>
        <button onclick="addCarrinho(${p.id})">Adicionar</button>
      </div>
    `;
  });
}

function addCarrinho(id) {
  carrinho.push(id);
  document.getElementById("lista").innerHTML += `<li>Produto ${id}</li>`;
}

async function finalizar() {
  const res = await fetch("/checkout", {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({ itens: carrinho })
  });

  const data = await res.json();

  document.getElementById("pix").innerHTML =
    `<h3>PIX:</h3><p>${data.pixCode}</p>`;
}

carregar();
