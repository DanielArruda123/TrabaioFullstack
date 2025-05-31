var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
require('../node_modules/dotenv').config({path:'../.env'});
var rateLimit = require('express-rate-limit');
var session = require('express-session');

const cors = require('cors');
const setTokenFromSessionForBrowser = require('./auth/setTokenFromSessionForBrowser');

// Swagger
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');

var app = express();

// Configuração do Swagger JSDoc
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'API do Pet Shop',
      version: '1.0.0',
      description: 'Documentação da API do sistema de Pet Shop. Lembre-se de obter um token via /auth/login e autorizar no botão abaixo para testar as rotas protegidas.',
    },
    servers: [
      {
        url: `http://localhost:4000`, // Porta correta do backend
        description: 'Servidor de Desenvolvimento Backend',
      },
    ],
    tags: [ // Definindo todas as tags globalmente
      { name: 'Auth', description: 'Autenticação de usuários e painel administrativo' },
      { name: 'Users', description: 'Gerenciamento de Usuários' },
      { name: 'Pets', description: 'Gerenciamento de Pets' },
      { name: 'Services', description: 'Gerenciamento de Serviços' },
      { name: 'Products', description: 'Gerenciamento de Produtos' },
      { name: 'Tutors', description: 'Gerenciamento de Tutores' },
      { name: 'Solicitations', description: 'Gerenciamento de Solicitações' }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        }
      },
      schemas: { // Definindo todos os schemas globalmente
        User: {
          type: 'object',
          properties: {
            id: { type: 'integer', description: 'ID auto-gerado do usuário.', readOnly: true },
            username: { type: 'string', description: 'Nome de usuário único.' },
            password: { type: 'string', description: 'Senha do usuário.', format: 'password', writeOnly: true },
            email: { type: 'string', format: 'email', description: 'Email único do usuário.' },
            phone: { type: 'string', description: 'Telefone único do usuário.' },
            role: { type: 'string', description: 'Papel do usuário (user ou ADM).', enum: ['user', 'ADM'], default: 'user' }
          },
          required: ['username', 'password', 'email', 'phone'],
          example: { id: 1, username: 'johndoe', email: 'johndoe@example.com', phone: "11999998888", role: "user" }
        },
        UserResponse: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            username: { type: 'string' },
            email: { type: 'string' },
            phone: { type: 'string' },
            role: { type: 'string' }
          }
        },
        NewUser: {
          type: 'object',
          required: ['username', 'password', 'email', 'phone'],
          properties: {
            username: { type: 'string' },
            password: { type: 'string', format: 'password' },
            email: { type: 'string', format: 'email' },
            phone: { type: 'string' }
          }
        },
        LoginCredentials: {
          type: 'object',
          required: ['username', 'password'],
          properties: {
            username: { type: 'string', description: 'Nome de usuário para login.' },
            password: { type: 'string', format: 'password', description: 'Senha do usuário.' }
          }
        },
        LoginResponse: {
          type: 'object',
          properties: {
            message: { type: 'string', example: 'Login com sucesso' },
            token: { type: 'string', description: 'Token JWT para autenticação.' }
          }
        },
        AdminLoginCredentials: {
          type: 'object',
          properties: {
            username: { type: 'string' },
            password: { type: 'string', format: 'password' }
          }
        },
        Pet: {
          type: 'object',
          properties: {
            id: { type: 'integer', description: 'ID auto-gerado do pet.', readOnly: true },
            name: { type: 'string', description: 'Nome do pet.' },
            race: { type: 'string', description: 'Raça do pet.' },
            colour: { type: 'string', description: 'Cor do pet.' },
            gender: { type: 'string', description: 'Gênero do pet.' }
          },
          example: { id: 1, name: "Rex", race: "Labrador", colour: "Dourado", gender: "Macho" }
        },
        NewPet: {
          type: 'object',
          required: ['name'],
          properties: {
            name: { type: 'string' },
            race: { type: 'string' },
            colour: { type: 'string' },
            gender: { type: 'string' }
          }
        },
        Service: {
          type: 'object',
          properties: {
            id: { type: 'integer', readOnly: true },
            nome: { type: 'string' },
            descricao: { type: 'string' },
            preco: { type: 'number', format: 'float'}
          },
          required: ['nome', 'preco']
        },
        NewService: {
          type: 'object',
          properties: {
            nome: { type: 'string' },
            descricao: { type: 'string' },
            preco: { type: 'number', format: 'float'}
          },
          required: ['nome', 'preco']
        },
        Product: {
          type: 'object',
          properties: {
            id: { type: 'integer', readOnly: true },
            nome: { type: 'string' },
            descricao: { type: 'string' },
            preco: { type: 'number', format: 'float' },
            estoque: { type: 'integer' },
            categoria: { type: 'string' },
            animal: { type: 'string', nullable: true },
            images: { type: 'string', description: 'JSON stringified array of image URLs or paths', nullable: true }
          }
        },
        NewProduct: {
          type: 'object',
          properties: {
            nome: { type: 'string' },
            descricao: { type: 'string' },
            preco: { type: 'number', format: 'float' },
            estoque: { type: 'integer' },
            categoria: { type: 'string' },
            animal: { type: 'string', nullable: true },
            images: { type: 'array', items: { type: 'string' }, description: 'Array of image URLs or paths', nullable: true }
          }
        },
        Tutor: {
          type: 'object',
          properties: {
            id: { type: 'integer', readOnly: true },
            nome: { type: 'string' },
            contato: { type: 'string' },
            endereco: { type: 'string' },
            pets_associados: { type: 'string', nullable: true }
          },
          required: ['nome', 'contato', 'endereco']
        },
        NewTutor: {
          type: 'object',
          properties: {
            nome: { type: 'string' },
            contato: { type: 'string' },
            endereco: { type: 'string' },
            pets_associados: { type: 'string', nullable: true }
          },
          required: ['nome', 'contato', 'endereco']
        },
        Solicitation: {
          type: 'object',
          properties: {
            id: { type: 'integer', readOnly: true },
            tutor: { type: 'string', description: 'Nome do tutor ou ID do usuário' },
            pet: { type: 'string', description: 'Nome ou ID do pet' },
            servico: { type: 'string', description: 'Nome ou ID do serviço' },
            data_hora: { type: 'string', format: 'date-time' },
            status: { type: 'string' }
          }
        },
        NewSolicitation: {
          type: 'object',
          properties: {
            // 'tutor' virá do token JWT (req.user.username) no backend
            pet: { type: 'string', description: 'Nome ou ID do pet' },
            servico: { type: 'string', description: 'Nome ou ID do serviço' },
            data_hora: { type: 'string', format: 'date-time' },
            status: { type: 'string' }
          },
          required: ['pet', 'servico', 'data_hora', 'status']
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            error: { type: 'string' }
          }
        }
      }
    },
    security: [{ // Aplica a segurança globalmente
      bearerAuth: []
    }]
  },
  apis: ['./routes/*.js'], 
};

const swaggerDocs = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// Middlewares Globais
app.use(cors());
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

app.use(session({
  secret: process.env.TOKEN || 'fallback_secret_key_для_dev_session', // Adicionado fallback
  resave: false,
  saveUninitialized: true,
  cookie: { 
    secure: false, 
    httpOnly: true,
    sameSite: 'lax' 
  }
}));

app.use(setTokenFromSessionForBrowser);

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public')));

const limiter = rateLimit({
  windowMS: 15 * 60 * 1000,
  max: 200, // Aumentado um pouco o limite
  keyGenerator: (req, res) => req.headers['x-forwarded-for'] || req.connection.remoteAddress
});

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var petsRouter = require('./routes/pets');
var servicesRouter = require('./routes/services');
var productsRouter = require('./routes/products');
var tutorsRouter = require('./routes/tutors');
var solicitationsRouter = require('./routes/solicitations');
var authRouter = require('./routes/auth');

app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/pets', petsRouter);
app.use('/tutors', tutorsRouter);
app.use('/services', servicesRouter);
app.use('/products', productsRouter);
app.use('/solicitations', solicitationsRouter);
app.use('/auth', limiter, authRouter);

app.use(function(req, res, next) {
  next(createError(404));
});

app.use(function(err, req, res, next) {
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};
  res.status(err.status || 500);
  res.send({ error: err.message || 'Ocorreu um erro no servidor', details: (req.app.get('env') === 'development' ? err : undefined) });
});

module.exports = app;