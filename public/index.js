console.log("index JS funcionando")

const socketClient = io();

let user;
Swal.fire({
    title: 'Perfil',
    html: `<input type="email" id="email" class="swal2-input" placeholder="Correo electrónico">
    <input type="text" id="name" class="swal2-input" placeholder="Nombre">
    <input type="text" id="lastname" class="swal2-input" placeholder="Apellido">
    <input type="number" id="edad" class="swal2-input" placeholder="Edad">
    <input type="text" id="alias" class="swal2-input" placeholder="Alias">
    <input type="text" id="avatar" class="swal2-input" placeholder="imageUrl avatar">`,
    confirmButtonText: 'Confirmar',
    focusConfirm: false,
    preConfirm: () => {
        const email = Swal.getPopup().querySelector('#email').value
        const name = Swal.getPopup().querySelector('#name').value
        const lastname = Swal.getPopup().querySelector('#lastname').value
        const edad = Swal.getPopup().querySelector('#edad').value
        const alias = Swal.getPopup().querySelector('#alias').value
        const avatar = Swal.getPopup().querySelector('#avatar').value
        if (!email || !name || !lastname || !edad || !alias || !avatar) {
        Swal.showValidationMessage(`Por favor complete todo el formulario`)
        }
        return { email, name, lastname, edad, alias, avatar }
    },
    allowOutsideClick:false
    }).then((result) => {
    Swal.fire(`
        Correo: ${result.value.email}
        Nombre: ${result.value.name}
        Apellido: ${result.value.lastname}
        Edad: ${result.value.edad}
        Alias: ${result.value.alias}
        Avatar: ${result.value.avatar}
    `.trim())
    //console.log(result.value)
    user = result.value
    document.getElementById("username").innerHTML=`<strong>${user.name} ${user.lastname}</strong>`;
    })

//enviar producto a traves de sockets
const productForm = document.getElementById("formProducto");
productForm.addEventListener("submit", (event)=>{
    
    event.preventDefault();
    const product = {
        title: document.getElementById("title").value,
        price: document.getElementById("price").value,
        thumbnail: document.getElementById("thumbnail").value
    }
     document.getElementById("formProducto").reset();
    //enviar el producto por medio de socket
    socketClient.emit("newProduct", product);
});

const listadoContainer = document.getElementById("listadoContainer");

socketClient.on("productsArray", async(msg)=>{
    //console.log("Data recibida por socket: ",msg)
    const templateTable = await fetch("./templates/productos.handlebars");
    //console.log(templateTable)
    //convertimos a formato del template
    const templateFormat = await templateTable.text();
    // console.log(template)
    const template = Handlebars.compile(templateFormat);
    //generamos el html con el template y con los datos de los productos
    const html = template({productos:msg.data});
    listadoContainer.innerHTML = html;
})

// normalizacion
// 1 definir esquemas para normalizar
const authorSchema = new normalizr.schema.Entity("authors",{},{idAttribute:"email"}) //id con el valor del campo email
const messageSchema = new normalizr.schema.Entity("messages",{author:authorSchema});
const chatSchema = new normalizr.schema.Entity("chats",{messages: [messageSchema]});

const msg = document.getElementById("messageChat")
msg.addEventListener("focus", function(e){
    //console.log("estoy en el foco de mensaje",e.target.value)
    //capturar el nombre del usuario
    if(document.getElementById("username").innerHTML===""){
      console.log("username vacio")
    }
})

const emailRegex = 
 new RegExp(/^[A-Za-z0-9_!#$%&'*+\/=?`{|}~^.-]+@[A-Za-z0-9.-]+$/, "gm");

//enviar un mensaje a nuestro servidor
const chatForm = document.getElementById("chatForm");

chatForm.addEventListener("submit",(event)=>{
    //prevenir que se recarge la pagina cuando se envia el formulario
    event.preventDefault();

    let continuar=false

    if(document.getElementById("username").innerHTML===""){
      console.log("username vacio")
          
    }else{
        continuar=true
    }

    if(continuar){
        
        const message = {
            author:user,
            text:document.getElementById("messageChat").value,
            fecha:new Date().toLocaleString().
            replace(/T/, ' ').      // replace T with a space
            replace(/\..+/, ''),
        }
        document.getElementById("messageChat").value=""
        //envia nuevo mensaje
        socketClient.emit("newMsg", message)
    }
    
    
})
const chatContainer = document.getElementById("chatContainer");

socketClient.on("messagesChat",async (messages)=>{
    //console.log("all mensajes",messages)
    console.log("normalizada: ",JSON.stringify(messages, null, "\t").length);
    const data = normalizr.denormalize(messages.result,chatSchema,messages.entities)
    //console.log("data denormalizada: ",data)
    console.log("denormalizada: ",JSON.stringify(data, null, "\t").length);
    const templateTable = await fetch("./templates/mensajes.handlebars");
    //console.log(templateTable)
    //convertimos a formato del template
    const templateFormat = await templateTable.text();
    // console.log(template)
    const template = Handlebars.compile(templateFormat);
    //generamos el html con el template y con los datos de los productos
    const percent = Math.round((JSON.stringify(data, null, "\t").length - JSON.stringify(messages, null, "\t").length) / JSON.stringify(messages, null, "\t").length * 100)
    document.getElementById("porcentaje").innerHTML=`(Compresión: ${percent}%)`
    const html = template({mensajes:data.messages});
    chatContainer.innerHTML = html;
})