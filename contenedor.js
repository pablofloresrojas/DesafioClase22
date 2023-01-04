import fs from "fs";

export class Contenedor {

    constructor(filename){
        this.filename=filename
    }

    getMaxId(arr){
        let idx = arr.length;
        let maxId = arr[idx-1].id;
        while (idx--){
            if(arr[idx].id > maxId){
                maxId = arr[idx].id
            }else if(arr[idx].id === maxId){
                maxId++
            }
        }
        return maxId;
    };

    async save(producto){
        try {
            if(fs.existsSync(this.filename)){
                const resp = await this.getAll();
                const productos = resp.data
                if(productos.length>0){
                    const idx = this.getMaxId(productos)
                    producto.id = idx;
                    productos.push(producto);
                    await fs.promises.writeFile(this.filename, JSON.stringify(productos,null,2));
                }else{
                    producto.id = 1;
                    await fs.promises.writeFile(this.filename, JSON.stringify([producto],null,2));
                }
            }else{
                producto.id = 1;
                await fs.promises.writeFile(this.filename, JSON.stringify([producto],null,2));                
            }
            return {status:200,message:"Producto guardado en el archivo",data:producto.id};
        } catch (error) {
            console.log("error al guardar: ",error);
            throw {status:400,message:"Error al guardar el archivo",data:null,error:error};
        }
    }

    async getAll(){
        try {
            const contenido = await fs.promises.readFile(this.filename,"utf-8");
           if(contenido.length>0){
                const productos = JSON.parse(contenido);
                return {status:200,message:"Listado de productos",data:productos};
           }else{
                return {status:200,message:"Archivo Vacío",data:[]};
           }
        } catch (error) {
            throw {status:400,message:"Error al leer el archivo"};
        }
    }

    async getById(id){
        try {
            const resp = await this.getAll();
            const producto = resp.data.find(elemento=>elemento.id === id);
            if(producto)
                return {status:200,message:"Producto encontrado",data:producto};
            else
                return {status:200,message:"Producto no encontrado",data:null};
        } catch (error) {
            throw {status:400,message:"Error al buscar el producto en el arreglo"};
        }
    }

    async deleteById(id){
        try {
            const resp = await this.getAll();
            const newProducts = await resp.data.filter(elemento=>elemento.id !== id);
            await fs.promises.writeFile(this.filename, JSON.stringify(newProducts,null,2));
            //console.log("Se quita producto del arreglo por ID")
            return "Producto eliminado";
        } catch (error) {
            //console.log("error al quitar elemento del arreglo")
            throw {status:400,message:"error al quitar elemento del arreglo"};
            
        }
    }

    async deleteAll(){
        try {
            
            await fs.promises.writeFile(this.filename, JSON.stringify([],null,2));
            //console.log("Se quita producto del arreglo por ID")
            return "Se han eliminado todos los productos";
        } catch (error) {
            //console.log("error al quitar elemento del arreglo")
            return "error al escribir el archivo";
            
        }
    }

}

const producto1 = {
    "title":"Makita DUX60 Multifuncional Inalámbrica motor BL",
    "price":456.78,
    "thumbnail":"https://http2.mlstatic.com/D_NQ_NP_737789-MLC44232308756_122020-O.jpg"
}
const producto2 = {
    "title":"Makita DUC353 Electrosierra motor BL",
    "price":567.89,
    "thumbnail":"https://m.media-amazon.com/images/I/61uSdJF55PL._AC_SL1099_.jpg"
}
const producto3 = {
    "title":"Makita DTW285 Atornillador de Impacto motor BL",
    "price":678.90,
    "thumbnail":"https://toolmania.cl/22118-large_default/atornillador-de-impacto-inalambrico-1-4-xgt-40vmax-bl-motor-xpt-220-nm-sin-bateria-ni-cargador-makita-td001gz.jpg"
}
const producto4 = {
    "title":"Makita DUB184 Soplador Inalámbrico motor BL",
    "price":789.10,
    "thumbnail":"https://http2.mlstatic.com/D_NQ_NP_2X_668280-MLC50291104780_062022-F.jpg"
}

const manejador = new Contenedor("productos.txt")

const ejecutar = async()=>{

    //getAll()
    const resp = await manejador.getAll();
    console.log("getData: ",resp);

    //save()
    const respsave1 = await manejador.save(producto1);
    console.log("SavePropducto1: ", respsave1);
    const respsave2 = await manejador.save(producto2);
    console.log("SavePropducto1: ", respsave2);
    const respsave3 = await manejador.save(producto3);
    console.log("SavePropducto1: ", respsave3);
    const respsave4 = await manejador.save(producto4);
    console.log("SavePropducto1: ", respsave4);

    //getbyId()
    const respgetbyId1 = await manejador.getById(3);
    console.log("getById; ",respgetbyId1);
    const respgetbyId2 = await manejador.getById(4);
    console.log("getById; ",respgetbyId2);

    //deleteById
    const respdeleteById1 = await manejador.deleteById(1);
    console.log("deteleById; ",respdeleteById1);
    const respdeleteById2 = await manejador.deleteById(2);
    console.log("deteleById; ",respdeleteById2);


    //deleteAll()
    //const respDeleteall = await manejador.deleteAll();
    //console.log("delete all")

}
//ejecutar();


export default Contenedor;