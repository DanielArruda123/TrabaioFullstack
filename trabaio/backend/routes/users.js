var express = require('express');
var router = express.Router();
var sqlite3 = require('sqlite3');

const db = new sqlite3.Database('./database/database.db')

// Modificação: Adicionar a coluna 'role' com um valor padrão 'user'
db.run(`CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE,
  password TEXT,
  email TEXT UNIQUE,
  phone TEXT UNIQUE,
  role TEXT DEFAULT 'user' 
)`, (err) => {
  if (err) {
      console.error('Erro ao criar a tabela users: ', err);
  } else {
      console.log('Tabela users criada com sucesso (com campo role)!');
  }
});

router.post('/register', (req,res) =>{
  console.log(req.body)
<<<<<<< Updated upstream
  const { username, password, email, phone} = req.body
  db.run('INSERT INTO users (username, password, email, phone) VALUES(?,?,?,?)', [username, password, email, phone], (err)=>{
    if(err){
      console.log('Erro ao inserir usuário: ', err);
      return res.status(500).send({error: 'Erro ao criar o usuário'})
    }else{
      res.status(201).send({message: "Usuário criado com sucesso"})
=======
  const { username, password, email, phone} = req.body;
  // Definir um papel padrão para novos usuários.
  // Se você quiser que alguns usuários sejam ADN no cadastro,
  // você precisaria de uma lógica aqui para determinar isso,
  // ou um campo 'role' vindo do formulário (req.body.role).
  // Por simplicidade, vamos definir todos como 'user' por padrão.
  // Um usuário 'ADN' teria que ser definido manualmente no banco por enquanto,
  // ou através de uma futura função de admin.
  const userRole = 'user'; // Ou req.body.role se você adicionar ao seu formulário de registro

  db.get('SELECT * FROM users WHERE username = ?', username, (err,row) =>{
    if(row){
      console.log("Usuário já existe", err)
      return res.status(400).send({error: 'Nome do usuário já existe'})
    }else{
      bcrypt.hash(password,10,(err, hash) => {
        if (err) {
          console.log("Erro ao criar o hash da senha", err)
          return res.status(400).send({error: 'Erro ao criar o hash da senha'})
        }else{
            // Modificação: Incluir 'role' no INSERT
            db.run('INSERT INTO users (username, password, email, phone, role) VALUES(?,?,?,?,?)', 
                   [username, hash, email, phone, userRole], (err)=>{ // Adicionado userRole
              if(err){
                console.log('Erro ao inserir usuário: ', err);
                return res.status(500).send({error: 'Erro ao criar o usuário'})
              }else{
                res.status(201).send({message: "Usuário criado com sucesso"})
            }
          })
        }
      })
>>>>>>> Stashed changes
    }
  })
});

/* GET users listing. */
router.get('/', function(req, res, next) {
  db.all(`SELECT id, username, email, phone, role FROM users`, (err, users) => { // Modificação: Adicionado 'role' ao SELECT
    if (err) {
      console.log("Usuários não foram encontrados", err);
      return res.status(500).send({ error: "Usuários não encontrados" });
    } else {
      // Modificação: Removido o password do retorno por segurança
      const usersWithoutPassword = users.map(user => {
        const { password, ...userWithoutPass } = user;
        return userWithoutPass;
      });
      res.status(200).send(usersWithoutPassword);
    }
  });
});

/* GET single user by ID. */
router.get('/:id', function(req, res, next) {
  const { id } = req.params;
  // Modificação: Adicionado 'role' ao SELECT e removido 'password'
  db.get('SELECT id, username, email, phone, role FROM users WHERE id = ?', [id], (err, row) => {
    if (err) {
      console.error('Usuário não encontrado', err);
      return res.status(500).json({ error: 'Usuário não encontrado' });
    }
    if (!row) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }
    res.status(200).json(row);
  });
});


/* PUT update a user. */
router.put('/:id', function(req, res, next) {
  const { id } = req.params;
  // Modificação: Adicionado 'role' aos campos que podem ser atualizados
  const { username, password, email, phone, role } = req.body;
  
  // É uma boa prática não atualizar a senha diretamente assim sem verificar a senha antiga
  // ou usar uma rota específica para mudança de senha.
  // E se a senha for atualizada, ela deve ser hasheada novamente com bcrypt.
  // Por simplicidade, vou manter como está, mas CUIDADO com a atualização de senha aqui.
  // Se for atualizar a senha, precisa gerar o hash dela antes de salvar.

  // Construir a query dinamicamente para atualizar apenas os campos fornecidos
  // e hashear a senha se ela for fornecida.
  let fieldsToUpdate = [];
  let valuesToUpdate = [];

  if (username) {
    fieldsToUpdate.push("username = ?");
    valuesToUpdate.push(username);
  }
  if (email) {
    fieldsToUpdate.push("email = ?");
    valuesToUpdate.push(email);
  }
  if (phone) {
    fieldsToUpdate.push("phone = ?");
    valuesToUpdate.push(phone);
  }
  if (role) { // Adicionado role
    fieldsToUpdate.push("role = ?");
    valuesToUpdate.push(role);
  }

  // Lógica para atualizar a senha (IMPORTANTE: hashear a nova senha)
  if (password) {
    bcrypt.hash(password, 10, (err, hash) => {
      if (err) {
        console.log("Erro ao criar o hash da nova senha", err);
        return res.status(500).send({ error: 'Erro ao processar nova senha' });
      }
      const tempFieldsToUpdate = [...fieldsToUpdate]; // Clona para não afetar outras chamadas
      const tempValuesToUpdate = [...valuesToUpdate]; // Clona
      
      tempFieldsToUpdate.push("password = ?");
      tempValuesToUpdate.push(hash);
      tempValuesToUpdate.push(id);

      if (tempFieldsToUpdate.length === 0) {
        return res.status(400).json({ error: 'Nenhum campo válido fornecido para atualização' });
      }

      db.run(
        `UPDATE users SET ${tempFieldsToUpdate.join(', ')} WHERE id = ?`,
        tempValuesToUpdate,
        function(err) {
          if (err) {
            console.error('Erro ao atualizar o usuário com nova senha', err);
            return res.status(500).json({ error: 'Erro ao atualizar o usuário' });
          }
          if (this.changes === 0) {
            return res.status(404).json({ error: 'Usuário não encontrado' });
          }
          res.status(200).json({ message: 'Usuário atualizado com sucesso' });
        }
      );
    });
  } else {
    // Se não houver senha para atualizar, prossegue sem hashear
    if (fieldsToUpdate.length === 0) {
      return res.status(400).json({ error: 'Nenhum campo válido fornecido para atualização' });
    }
    valuesToUpdate.push(id);
    db.run(
      `UPDATE users SET ${fieldsToUpdate.join(', ')} WHERE id = ?`,
      valuesToUpdate,
      function(err) {
        if (err) {
          console.error('Erro ao atualizar o usuário', err);
          return res.status(500).json({ error: 'Erro ao atualizar o usuário' });
        }
        if (this.changes === 0) {
          return res.status(404).json({ error: 'Usuário não encontrado' });
        }
        res.status(200).json({ message: 'Usuário atualizado com sucesso' });
      }
    );
  }
});


/* PATCH partially update a user. */
// A lógica do PUT acima já funciona como um PATCH mais seguro,
// mas se quiser manter o PATCH separado:
router.patch('/:id', function(req, res, next) {
  const { id } = req.params;
  const fields = req.body;
  const keys = Object.keys(fields);
  let values = Object.values(fields);

  if (keys.length === 0) {
    return res.status(400).json({ error: 'Nenhum campo fornecido para atualização' });
  }

  let setClauseArr = [];
  let finalValues = [];

  // Se 'password' estiver entre os campos para atualizar, ele precisa ser hasheado
  const passwordIndex = keys.indexOf('password');
  if (passwordIndex > -1) {
    const plainPassword = values[passwordIndex];
    bcrypt.hash(plainPassword, 10, (err, hash) => {
      if (err) {
        console.error('Erro ao criar hash para PATCH:', err);
        return res.status(500).json({ error: 'Erro ao processar senha para atualização' });
      }
      
      keys.forEach((key, index) => {
        setClauseArr.push(`${key} = ?`);
        if (index === passwordIndex) {
          finalValues.push(hash);
        } else {
          finalValues.push(values[index]);
        }
      });
      finalValues.push(id);

      const setClause = setClauseArr.join(', ');
      db.run(`UPDATE users SET ${setClause} WHERE id = ?`, finalValues, function(err) {
        if (err) {
          console.error('Erro ao atualizar o usuário parcialmente (com senha)', err);
          return res.status(500).json({ error: 'Erro ao atualizar o usuário parcialmente' });
        }
        if (this.changes === 0) {
          return res.status(404).json({ error: 'Usuário não encontrado' });
        }
        res.status(200).json({ message: 'Usuário atualizado parcialmente com sucesso' });
      });
    });
  } else {
    // Se não tem senha, continua normal
    setClauseArr = keys.map((key) => `${key} = ?`);
    finalValues = [...values, id];
    const setClause = setClauseArr.join(', ');

    db.run(`UPDATE users SET ${setClause} WHERE id = ?`, finalValues, function(err) {
      if (err) {
        console.error('Erro ao atualizar o usuário parcialmente', err);
        return res.status(500).json({ error: 'Erro ao atualizar o usuário parcialmente' });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Usuário não encontrado' });
      }
      res.status(200).json({ message: 'Usuário atualizado parcialmente com sucesso' });
    });
  }
});


/* DELETE a user. */
router.delete('/:id', function(req, res, next) {
  const { id } = req.params;
  db.run('DELETE FROM users WHERE id = ?', [id], function(err) {
    if (err) {
      console.error('Erro ao deletar o usuário', err);
      return res.status(500).json({ error: 'Erro ao deletar o usuário' });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }
    res.status(200).json({ message: 'Usuário deletado com sucesso' });
  });
});


module.exports = router;