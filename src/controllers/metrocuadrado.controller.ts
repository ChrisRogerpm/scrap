import { Request, Response } from 'express'
import { getListProperties } from '../utils/index.utils'
import { Property } from '../interface/Property'
import xml from 'xml'
import fs from 'fs'


export async function generateData(req: Request, _res: Response) {
    const pages: number = parseInt(req.params.pages as string)
    const properties: Property[] = await getListProperties(pages)
    if (properties.length > 0) {
        fs.writeFile('./properties.json', JSON.stringify(properties, null, 2), (error) => {
            if (error) {
                _res.json({
                    'response': error
                })
            }
            else {
                _res.json({
                    'response': 'Se ha generado el archivo JSON',
                    'propertiesTotal': properties.length
                })
            }
        })
    } else {
        _res.json({
            'response': 'No se ha encontrado registros nuevos'
        })
    }
}
export const userProperties = (req: Request, res: Response) => {
    const obj = req.params
    let properties: Property[] = []
    const currentPath = `${process.cwd()}/properties.json`;
    if (fs.existsSync(currentPath)) {
        properties = JSON.parse(fs.readFileSync(currentPath, 'utf8'));
    }
    const data = properties.filter(ele => {
        const userObj = ele.user
        if (userObj.userId === obj.id) {
            return ele
        }
        return false
    })
    let propertiesTmp: object[] = []
    data.forEach((ele) => {
        const listImg = ele.imagenes.map(ele => {
            return { url: ele }
        })
        propertiesTmp.push({
            "propiedad": [
                { id: ele.id },
                { tipoOperacion: ele.tipoOperacion },
                { tipoPropiedad: ele.tipoPropiedad },
                { departamento: ele.departamento },
                { zona: ele.zona },
                { idDormitorios: ele.idDormitorios },
                { idBanios: ele.idBanios },
                { m2: ele.m2 },
                { m2edificados: ele.m2edificados },
                { garage: ele.garage },
                { titulo: ele.titulo },
                { descripcion: ele.descripcion },
                { precioVenta: ele.precioVenta },
                { monedaVenta: ele.monedaVenta },
                { precioAlquiler: ele.precioAlquiler },
                { monedaAlquiler: ele.monedaAlquiler },
                { latitud: ele.latitud },
                { longitud: ele.longitud },
                { imagenes: listImg },
                { data_extracted_at: ele.data_extracted_at },
                { external_url: ele.external_url },
            ]
        })
    })
    const propertiesList = {
        "xml": propertiesTmp
    }
    res.set('Content-Type', 'text/xml');
    res.send(xml([propertiesList], true))
}
export const userList = (_req: Request, res: Response) => {
    const uniqueIds: string[] = [];
    let properties: Property[] = []
    const currentPath = `${process.cwd()}/properties.json`;
    if (fs.existsSync(currentPath)) {
        properties = JSON.parse(fs.readFileSync(currentPath, 'utf8'));
    }
    const unique = properties.filter(element => {
        if (element.user.userId !== "") {
            const isDuplicate = uniqueIds.includes(element?.user?.userId);
            if (!isDuplicate) {
                const tmp = element.user.userId as string
                uniqueIds.push(tmp);
                return true;
            }
        }
        return false;
    }).map(element => {
        const total = properties.filter(ele => {
            return ele.user.userId === element.user.userId
        })
        return { ...element.user, properties_count: total.length }
    });
    let users: object[] = []
    unique.forEach((ele) => {
        users.push({
            "user": [
                { userId: ele.userId },
                { name: ele.name },
                { email: ele.email },
                { phone: ele.phone },
                { profile: ele.profile },
                { updated_at: ele.updated_at },
                { endpoint: ele.endpoint },
                { properties_count: ele.properties_count },
            ]
        })
    })
    const usersList = {
        "userXML": users
    }
    res.set('Content-Type', 'text/xml');
    res.send(xml([usersList], true))
}