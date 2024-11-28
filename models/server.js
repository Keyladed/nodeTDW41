const express = require('express');
const mysql = require('mysql')
const session = require('express-session');
const bcrypt = require('bcrypt');

class Server {
    constructor() {
        this.app = express();
        this.conectarBD();
        this.port = process.env.PORT;

        this.middlewares();
        this.routes();
        this.listen();

    }

    conectarBD() {
        this.con = mysql.createPool({
            host: "localhost",
            user: "root",
            password: "Key3009.",
            database: "usuariobd",
        });
    }
    middlewares() {
        this.app.use(express.static('./Public'))
        this.app.use(express.json());
        this.app.use(express.urlencoded());
        this.app.set("view engine", "ejs");
        this.app.set('trust proxy');
        this.app.use(session({
            secret: 'clave',
            resave: false,
            saveUninitialized: true,
            cookie: { secure: false }
        }));

    }
    routes() {
        this.app.get('/service', (req, res) => {
            let usuario = req.session.user;
            let rol = req.session.rol;
            if(req.session.user){
                if(req.session.rol == "admin"){
                    res.render('service',{user: usuario, rol: rol});
                } 
                else if(req.session.rol == "visitante"){
                    res.render('service', {user: usuario, rol: rol});
                    //res.render('service', {usuario: "alex", rol: "admin"});
                }
            }else{
                res.render('error', {mensaje: 'No iniciaste sesion'});
            }
        });
        this.app.get('/hola', (req, res) => {
            if (req.session.usuario) {
                res.send('hola ' + req.session.usuario);
            } else {
                res.send('No iniciaste sesión');
            }
        });

        this.app.post("/login", (req, res) => {
            let user = req.body.usuario;
            let pass = req.body.cont;

            console.log("Ruta login...");
            console.log(user);
            console.log(pass);

           this.con.query("SELECT * FROM usuarios WHERE usuario = ?", [user], (err, result) => {
                if (err) throw err;
   
                if (result.length > 0) {
                    if (bcrypt.compareSync(pass, result[0].cont)) {
                        console.log('Credenciales correctas');
                        req.session.user = user;
                        req.session.rol = result[0].rol;
                        res.render("inicio", { user, rol: "admin" });
                    } else {
                        console.log('Contraseña incorrecta');
                        res.render('error', { mensaje: "Contraseña incorrecta" });
                    }
                } else {
                    console.log('Usuario no existe');
                    res.render('error', { mensaje: "Usuario o contraseña incorrectos" });
                }
            });
        });
        this.app.post('/registrar', (req, res) => {
            let user = req.body.usuario;
            let cont = req.body.cont;
            //cifrar contrasena
            let salt = bcrypt.genSaltSync(12); 
            let hashedCont = bcrypt.hashSync(cont, salt);
            /////////////
            let datos = [user, hashedCont, 'general'];
            let sql = "Insert into usuarios values (?,?,?)";
            this.con.query(sql, datos, (err, result) => {
                if (err) throw err;
                console.log("Usuario guardado...");
                res.redirect('/');
            });
        });

    }
    listen() {
        this.app.listen(this.port, () => {
            console.log("Servidor escuchando: http://127.0.0.1:" + this.port);
        });
    }
}

module.exports = Server;