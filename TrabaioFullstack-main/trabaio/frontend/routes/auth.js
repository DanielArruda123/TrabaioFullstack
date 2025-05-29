var express = require('express');
var router = express.Router();
// const { jwtDecode } = require('jwt-decode'); // Não é usado diretamente neste arquivo para o fluxo atual

// URL do backend para o endpoint de login
const backendLoginUrl = process.env.BACK_URL + "/auth/login"; 

// Rota GET para exibir a página de login/cadastro
router.get('/', function(req, res, next) {
  // Se o usuário já estiver logado, redireciona para /pets (ou outra página principal)
  if (req.session.token) {
    return res.redirect('/pets'); 
  }

  let registerSuccessMessage = null;
  let registerErrorMessageObj = null; 
  let loginErrorMessageObj = null; // Para erros de login vindos do POST /login desta rota

  // Verifica se há mensagens de feedback do cadastro na URL
  if (req.query.status === 'register_success') {
    registerSuccessMessage = 'Cadastro realizado com sucesso! Faça o login.';
  } else if (req.query.status === 'register_error') {
    // Pega a mensagem de erro da URL, decodifica e formata como um objeto de erro
    registerErrorMessageObj = { error: decodeURIComponent(req.query.message || 'Erro ao realizar o cadastro.') };
  }
  
  res.render('layout', { 
    body: 'pages/login', // Ou o nome do seu arquivo EJS da página de login/cadastro
    title: 'Login/Cadastro', 
    error: loginErrorMessageObj, // Erro de login (tratado no POST abaixo)
    registerSuccess: registerSuccessMessage, // Mensagem de sucesso do cadastro
    registerError: registerErrorMessageObj,   // Mensagem de erro do cadastro
    currentUserRole: null // Usuário não está logado aqui
  });
});

// Rota POST para processar o login
router.post('/',(req,res)=>{
    const {username, password} = req.body;
    
    fetch(backendLoginUrl, { // Usando a variável para a URL do backend
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({username, password})
    })
    .then(async(apiRes) => {
        const responseBody = await apiRes.json().catch(() => ({ error: "Erro ao processar resposta do servidor de login." }));
        if (!apiRes.ok){
            throw responseBody; // Joga o erro para o catch
        }
        return responseBody;
    })
    .then((data) => {
        if (data.token) {
            req.session.token = data.token;
            res.redirect('/pets'); // Redireciona para /pets após login bem-sucedido
        } else {
            // Caso o backend responda com sucesso mas sem token (improvável, mas para segurança)
            throw { error: "Resposta de login inválida do servidor." };
        }
    })
    .catch((errorFromLogin) =>{ 
      const errorMessage = errorFromLogin.error || "Usuário ou senha inválidos.";
      // Renderiza a página de login novamente, mostrando o erro do login
      res.render('layout', {
          body: 'pages/login', 
          title: 'Login/Cadastro', 
          error: { error: errorMessage }, // Erro específico do login
          registerSuccess: null,        // Sem mensagem de sucesso de cadastro aqui
          registerError: null,          // Sem mensagem de erro de cadastro aqui
          currentUserRole: null 
      });
    })
});

// Rota GET para Logout (já adicionada e funcional)
router.get('/logout', (req, res, next) => {
  req.session.destroy(err => { 
    if (err) {
      console.error("Erro ao destruir a sessão:", err);
      return res.redirect('/'); 
    }
    res.clearCookie('connect.sid'); 
    res.redirect('/login'); 
  });
});

module.exports = router;