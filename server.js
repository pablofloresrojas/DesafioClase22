import express from 'express';
import path from "path";
import { fileURLToPath } from 'url';
import { Server } from "socket.io";
import handlebars from 'express-handlebars';
import { Router, text } from 'express';
import Contenedor from "./contenedor.js";
import Chat from './chat.js';
import { normalize, schema } from "normalizr";
import { faker } from "@faker-js/faker";

const { commerce, image} = faker;
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const viewsFolder = path.join(__dirname,"views")
const app = express();

const PORT = 8080;

app.use(express.urlencoded({extended: true}));
app.use(express.json());
app.use(express.static("public"))


app.engine("handlebars",handlebars.engine())

app.set("view engine", "handlebars")
app.set("views",viewsFolder)

const manejador = new Contenedor("productos.txt");
const chat = new Chat("mensajes.txt");

const routerProductos = Router();

const server = app.listen( PORT, ()=>{
    console.log(`Servidor escuchando el puerto: ${PORT}`);
});

routerProductos.get("/",async(req,res)=>{
    try {
        const resp = await manejador.getAll();
        res.status(resp.status).send(resp.data);
    } catch (error) {
        res.status(error.status).send(error.message);
    }
});

routerProductos.get("/:id",async (req,res)=>{
    try {
        const resp = await manejador.getById(req.params.id);    
        res.status(resp.status).json(resp.data)
    } catch (error) {
        res.status(error.status).send(error.message);
    }
    
});

routerProductos.post("/",async (req,res)=>{
    try {
        const resp = await manejador.save(req.body);
        res.status(resp.status).json(resp.message)
    } catch (error) {
        res.status(error.status).send(error.message);
    }
})

routerProductos.delete("/:id",async (req,res)=>{
    //console.log("deleteProducto: ",req.params.id);
    try {
        const resp = await manejador.deleteById(req.params.id);
        res.status(resp.status).send(resp.message);
    } catch (error) {
        res.status(error.status).send(error.message);
    }
});

routerProductos.delete("/",async (req,res)=>{
    //console.log("deleteProducto: ",req.params.id);
    try {
        const resp = await manejador.deleteAll();
        res.status(resp.status).send(resp.message);
    } catch (error) {
        res.status(error.status).send(error.message);
    }
});

app.use('/api/productos', routerProductos);

app.get("/productos-test",async (req,res)=>{

    const data = [];

    for(let x=0;x<5;x++){
        data.push({
            title: commerce.productName(),
            price: commerce.price(),
            thumbnail:image.imageUrl(),
            id:(x+1)
        })
    }

    res.render("listado",{
        productos: data,
        total: data.length
    })
})

app.post("/productos", async (req, res) => {
    const resp = await manejador.save(req.body);
    res.redirect('/')
})
app.get("/productos",async (req,res)=>{

    const resp = await manejador.getAll();

    console.log("productos: ",resp.data)

    res.render("listado",{
        productos: resp.data,
        total: resp.data.length
    })
})

// normalizacion
// 1 definir esquemas para normalizar
const authorSchema = new schema.Entity("authors",{},{idAttribute:"email"}) //id con el valor del campo email
const messageSchema = new schema.Entity("messages",{author:authorSchema});
// esquema global (padre)
const chatSchema = new schema.Entity("chats",{messages: [messageSchema]});
//2 aplicar la normalizacion
//funcion normaliza datos
const normalizarData = (data)=>{
    //console.log("data pura: ",data)
    const dataNormalizada = normalize({id:"chatHistory", messages: data},chatSchema)
    console.log("data normalizada: ",JSON.stringify(dataNormalizada))
    return dataNormalizada;
}
//3 normalizar mensajes
//funcion normalizar mensajes
const normalizarMensajes = async ()=>{
    const resp = await chat.getMessages();
    //console.log("respuesta data: ",resp.data)
    const normalizedMessages = normalizarData(resp.data);
    return normalizedMessages;
}


//configurar el socket del lado del backend
const io = new Server(server);
io.on("connection", async(socket)=>{
    console.log("nuevo cliente conectado");
    
    //cada vez que el socket se conecte le enviamos los productos
    socket.emit("productsArray", await manejador.getAll());

    //recibir el producto
    socket.on("newProduct", async(data)=>{
        //console.log("nuevo producto: ",data)
        //data es el producto que recibo del formulario
        try {
            const resp = await manejador.save(data);
        } catch (error) {
            console.log("error: ",error)
        }

        //enviar todos los productos actualizados
        io.sockets.emit("productsArray", await manejador.getAll());

    })

    //chat
    //enviar los mensajes al cliente
    socket.emit("messagesChat", await normalizarMensajes()); //await chat.getMessages());

    //recibimos el mensaje
    socket.on("newMsg", async (msg)=>{
        console.log("nuevo mensaje: ",msg)
        await chat.postMessage(msg)
        //enviamos los mensajes a todos los sockets que esten conectados.
        const messages = await chat.getMessages();
        io.sockets.emit("messagesChat",  await normalizarMensajes())
    })
})

