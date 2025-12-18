import express from "express";
import session from "express-session";
import cookieParser from "cookie-parser";

const app = express();
const host = "0.0.0.0";
const porta = 3000;


let interessados = [];
let pets = [];
let adocoes = [];


app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use(
  session({
    secret: "adocaoPets",
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 1000 * 60 * 30 }
  })
);


function verificarUsuarioLogado(req, res, next) {
  if (req.session.usuario?.logado) next();
  else res.redirect("/login");
}

function dataBR(data) {
  return data.toLocaleDateString("pt-BR") + " " + data.toLocaleTimeString("pt-BR");
}

function emailValido(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function telefoneValido(telefone) {
  const apenasNumeros = telefone.replace(/\D/g, "");
  return apenasNumeros.length === 10 || apenasNumeros.length === 11;
}

function idadeValida(idade) {
  const n = Number(idade);
  return Number.isInteger(n) && n >= 0;
}

function pagina(titulo, conteudo, ultimoAcesso = "") {
  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<title>${titulo}</title>
<link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">

<style>
body {
  background: linear-gradient(135deg, #f7f7f7, #eaeaea);
  font-family: Arial, Helvetica, sans-serif;
}

.caixa {
  background: #fff;
  border-radius: 12px;
  padding: 25px;
  border: 1px solid #ccc;
  box-shadow: 4px 4px 12px rgba(0,0,0,0.08);
}

.topo {
  border-bottom: 1px solid #ddd;
  margin-bottom: 15px;
  padding-bottom: 10px;
}

.menu {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.link-menu {
  padding: 12px 18px;
  background: #f1f1f1;
  border: 1px solid #aaa;
  border-radius: 8px;
  text-decoration: none;
  color: #000;
  transition: 0.2s;
}

.link-menu:hover {
  background: #dedede;
}

.info {
  font-size: 14px;
  margin-bottom: 10px;
  color: #555;
}

.erro {
  background: #ffe6e6;
  border: 1px solid #cc9999;
  padding: 10px;
  border-radius: 6px;
  color: #800000;
}
</style>
</head>

<body>
<div class="container mt-5 mb-5">
  ${ultimoAcesso ? `<div class="info">🕒 Último acesso: <b>${ultimoAcesso}</b></div>` : ""}
  <div class="caixa">
    ${conteudo}
  </div>
</div>
</body>
</html>
`;
}


app.get("/login", (req, res) => {
  res.send(pagina("Login", `
<h3 class="topo">🔐 Login do Sistema</h3>

<form method="POST">
  <input class="form-control mb-3" name="usuario" placeholder="Usuário">
  <input class="form-control mb-3" type="password" name="senha" placeholder="Senha">
  <button class="btn btn-secondary">Entrar</button>
</form>
`));
});

app.post("/login", (req, res) => {
  const { usuario, senha } = req.body;

  if (usuario === "admin" && senha === "admin") {
    req.session.usuario = { logado: true };
    res.redirect("/");
  } else {
    res.send(pagina("Erro", `
<div class="erro">❌ Usuário ou senha inválidos</div>
<br><a href="/login">Voltar</a>
`));
  }
});


app.get("/logout", (req, res) => {
  req.session.destroy();
  res.redirect("/login");
});


app.get("/", verificarUsuarioLogado, (req, res) => {
  const ultimo = req.cookies.ultimoAcesso;
  res.cookie("ultimoAcesso", dataBR(new Date()));

  res.send(pagina("Menu", `
<h2 class="topo">🐾 Menu do Sistema</h2>

<div class="menu">
  <a class="link-menu" href="/cadastroInteressado">👤 Interessados</a>
  <a class="link-menu" href="/cadastroPet">🐶 Pets</a>
  <a class="link-menu" href="/adotar">❤️ Adoção</a>
  <a class="link-menu" href="/logout">🚪 Sair</a>
</div>
`, ultimo));
});


app.get("/cadastroInteressado", verificarUsuarioLogado, (req, res) => {
  const lista = interessados.map(i =>
    `<tr><td>${i.nome}</td><td>${i.email}</td><td>${i.telefone}</td></tr>`
  ).join("");

  res.send(pagina("Interessados", `
<h3 class="topo">👤 Cadastro de Interessados</h3>

<form method="POST">
  <input class="form-control mb-2" name="nome" placeholder="Nome">
  <input class="form-control mb-2" name="email" placeholder="Email">
  <input class="form-control mb-2" name="telefone" placeholder="Telefone">
  <button class="btn btn-secondary mt-2">Cadastrar</button>
</form>

<table class="table table-bordered mt-4">
<tr><th>Nome</th><th>Email</th><th>Telefone</th></tr>
${lista}
</table>

<a href="/">⬅️ Voltar ao menu</a>
`));
});

app.post("/cadastroInteressado", verificarUsuarioLogado, (req, res) => {
  const { nome, email, telefone } = req.body;

  if (!nome || !email || !telefone) {
    return res.send(pagina("Erro", `<div class="erro">⚠️ Preencha todos os campos</div><br><a href="/cadastroInteressado">Voltar</a>`));
  }

  if (!emailValido(email)) {
    return res.send(pagina("Erro", `<div class="erro">📧 Email inválido</div><br><a href="/cadastroInteressado">Voltar</a>`));
  }

  if (!telefoneValido(telefone)) {
    return res.send(pagina("Erro", `<div class="erro">📞 Telefone inválido</div><br><a href="/cadastroInteressado">Voltar</a>`));
  }

  interessados.push({ nome, email, telefone });
  res.redirect("/cadastroInteressado");
});


app.get("/cadastroPet", verificarUsuarioLogado, (req, res) => {
  const lista = pets.map(p =>
    `<tr><td>${p.nome}</td><td>${p.raca}</td><td>${p.idade}</td></tr>`
  ).join("");

  res.send(pagina("Pets", `
<h3 class="topo">🐶 Cadastro de Pets</h3>

<form method="POST">
  <input class="form-control mb-2" name="nome" placeholder="Nome">
  <input class="form-control mb-2" name="raca" placeholder="Raça">
  <input class="form-control mb-2" name="idade" placeholder="Idade">
  <button class="btn btn-secondary mt-2">Cadastrar</button>
</form>

<table class="table table-bordered mt-4">
<tr><th>Nome</th><th>Raça</th><th>Idade</th></tr>
${lista}
</table>

<a href="/">⬅️ Voltar ao menu</a>
`));
});

app.post("/cadastroPet", verificarUsuarioLogado, (req, res) => {
  const { nome, raca, idade } = req.body;

  if (!nome || !raca || idade === "") {
    return res.send(pagina("Erro", `<div class="erro">⚠️ Preencha todos os campos</div><br><a href="/cadastroPet">Voltar</a>`));
  }

  if (!idadeValida(idade)) {
    return res.send(pagina("Erro", `<div class="erro">🐾 Idade inválida</div><br><a href="/cadastroPet">Voltar</a>`));
  }

  pets.push({ nome, raca, idade: Number(idade) });
  res.redirect("/cadastroPet");
});


app.get("/adotar", verificarUsuarioLogado, (req, res) => {
  const opI = interessados.map((i, idx) => `<option value="${idx}">${i.nome}</option>`).join("");
  const opP = pets.map((p, idx) => `<option value="${idx}">${p.nome}</option>`).join("");

  const lista = adocoes.map(a =>
    `<li>${a.interessado} adotou ${a.pet} em ${a.data}</li>`
  ).join("");

  res.send(pagina("Adoção", `
<h3 class="topo">❤️ Registro de Adoção</h3>

<form method="POST">
  <select class="form-select mb-2" name="interessado">${opI}</select>
  <select class="form-select mb-2" name="pet">${opP}</select>
  <button class="btn btn-secondary mt-2">Registrar</button>
</form>

<ul class="mt-4">
${lista}
</ul>

<a href="/">⬅️ Voltar ao menu</a>
`));
});

app.post("/adotar", verificarUsuarioLogado, (req, res) => {
  const { interessado, pet } = req.body;

  if (interessado === undefined || pet === undefined) {
    return res.send(pagina("Erro", `<div class="erro">⚠️ Selecione interessado e pet</div><br><a href="/adotar">Voltar</a>`));
  }

  adocoes.push({
    interessado: interessados[interessado].nome,
    pet: pets[pet].nome,
    data: dataBR(new Date())
  });

  res.redirect("/adotar");
});


app.listen(porta, host, () => {
  console.log(`Servidor rodando em http://${host}:${porta}`);
});
