import { User } from '../interface/User'
import { Property } from '../interface/Property'
import { Cluster } from 'puppeteer-cluster'
import Colombia from '../data/Colombia.json'

export const getListProperties = async (pages: number) => {
    const listUrls: string[] = await getUrls(pages)
    let listProperties: Property[] = await getMultipleUrls(listUrls)
    listProperties = listProperties.map((property) => {
        return {
            ...property,
            tipoOperacion: getTypeOperation(property.tipoOperacion),
            tipoPropiedad: getTypeProperty(property.tipoPropiedad),
            departamento: getDepartament(property.departamento),
            zona: getZone(property.zona),
            idDormitorios: getBedRooms(property.idDormitorios),
            idBanios: getBathRooms(property.idBanios)
        }
    })
    return listUrls
}
export const getUrls = async (pages: number = 1) => {
    const cluster: Cluster<string> = await Cluster.launch({
        concurrency: Cluster.CONCURRENCY_PAGE,
        maxConcurrency: 10,
    });
    let list: string[] = []
    const urls = [
        'https://www.metrocuadrado.com/venta/nuevo',
        'https://www.metrocuadrado.com/venta/usado',
        'https://www.metrocuadrado.com/venta',
        'https://www.metrocuadrado.com/arriendo'
    ]
    await cluster.task(async ({ page, data: url }) => {
        await page.goto(url);
        let listTmp: string[] = []
        for (let i = 1; i <= pages; i++) {
            const listProperties = await page.evaluate(() => {
                const links = document.querySelectorAll('.card-result-img a')
                const list: string[] = []
                links.forEach((elem) => {
                    const tmpUrl = elem?.getAttribute('href') as string
                    list.push(`https://www.metrocuadrado.com${tmpUrl}`)
                })
                return list
            })
            listTmp = listTmp.concat(listProperties)
            await page.evaluate(() => {
                const el: HTMLElement = document.querySelector('a[aria-label="Next"]') as HTMLElement
                el?.click()
            })
            await page.waitForTimeout(1000);
        }
        return listTmp
    });
    for (let link of urls) {
        const result = await cluster.execute(link);
        list.push(...result);
    }
    await cluster.idle();
    await cluster.close();
    return [...new Set(list)]
}
export const getMultipleUrls = async (listurl: string[]) => {
    const cluster: Cluster<string> = await Cluster.launch({
        concurrency: Cluster.CONCURRENCY_PAGE,
        maxConcurrency: 10,
    });
    const list: Property[] = []
    await cluster.task(async ({ page, data: url }) => {
        await page.setRequestInterception(true);

        page.on("request", (req) => {
            if (req.resourceType() == "font" || req.resourceType() == "image") {
                req.abort();
            } else {
                req.continue();
            }
        });
        await page.goto(url);
        const property = await page.evaluate(() => {
            const dataGeneral = document.querySelector('#__NEXT_DATA__')?.textContent as string
            const dataProps = JSON.parse(dataGeneral).props.initialProps.pageProps.realEstate
            const getIdProperty = () => {
                const { propertyId } = dataProps
                return propertyId ? propertyId : ''
            }
            const getDescription = () => {
                const { comment } = dataProps
                return comment ? comment : ''
            }
            const getTitle = () => {
                const { shortTitle } = dataProps
                return shortTitle ? shortTitle : ''
            }
            const getDescriptionColumn = (column: number) => {
                let result = ''
                const { area, areac, garages } = dataProps
                switch (column) {
                    case 1:
                        result = area.toString()
                        break
                    case 2:
                        result = areac.toString()
                        break
                    case 3:
                        result = garages.toString()
                        break
                }
                return result
            }
            const getDataCurrency = (filter: number) => {
                const { salePrice, rentTotalPrice, priceFrom } = dataProps
                let result = 0
                if (filter === 1) {
                    result = priceFrom ? priceFrom : salePrice
                } else {
                    result = rentTotalPrice ? rentTotalPrice : result
                }
                return result
            }
            const getListImages = () => {
                let { images } = dataProps
                images = images.map((ele: any) => {
                    return ele.image
                })
                return images
            }
            const getUser = (): User => {
                const { companyName, contactPhone } = dataProps

                return {
                    userId: contactPhone,
                    name: companyName,
                    email: '',
                    phone: contactPhone,
                    profile: '',
                    updated_at: getTimeNow(),
                    endpoint: `/users/${contactPhone}/xml`,
                    properties_count: 0,
                }
            }
            const getExternalUrl = () => {
                const { link } = dataProps
                return link ? link : ''
            }
            const getTypeProperty = (parameter: number) => {
                let result = ''
                const { businessType, propertyType, city, commonNeighborhood } = dataProps
                switch (parameter) {
                    case 1:
                        result = propertyType.nombre
                        break
                    case 2:
                        result = businessType.toLowerCase()
                        break
                    case 3:
                        result = city.nombre
                        break
                    case 4:
                        result = commonNeighborhood
                        break
                }
                return result
            }
            const getDetailProperty = (filtro: string) => {
                const { bathrooms, rooms } = dataProps
                let result = ""
                switch (filtro) {
                    case "Habitaciones":
                        result = rooms
                        break
                    case "Baños":
                        result = bathrooms
                        break
                }
                return parseInt(result)
            }
            const getTimeNow = () => {
                const currentdate = new Date();
                const date = `${currentdate.getFullYear()}-${currentdate.getMonth()}-${currentdate.getDate()} ${currentdate.getHours()}:${currentdate.getMinutes()}:${currentdate.getSeconds()}`
                return date
            }
            const getLatitude = () => {
                const { coordinates } = dataProps
                return coordinates.lat
            }
            const getLongitude = () => {
                const { coordinates } = dataProps
                return coordinates.lon
            }
            return {
                id: getIdProperty(),
                tipoOperacion: getTypeProperty(2),
                tipoPropiedad: getTypeProperty(1),
                departamento: getTypeProperty(3),
                zona: getTypeProperty(4),
                idDormitorios: getDetailProperty('Habitaciones'),
                idBanios: getDetailProperty('Baños'),
                m2: getDescriptionColumn(1),
                m2edificados: getDescriptionColumn(2),
                garage: getDescriptionColumn(3),
                titulo: getTitle(),
                descripcion: getDescription(),
                precioVenta: getDataCurrency(1),
                monedaVenta: 4,
                precioAlquiler: getDataCurrency(2),
                monedaAlquiler: 4,
                latitud: getLatitude(),
                longitud: getLongitude(),
                imagenes: getListImages(),
                data_extracted_at: getTimeNow(),
                external_url: getExternalUrl(),
                user: getUser(),
            }
        })
        list.push(property)
    });
    for (let link of listurl) {
        cluster.queue(link);
    }
    await cluster.idle();
    await cluster.close();
    return list;
}
const getTypeOperation = (param: string) => {
    param = param.trim()
    let result = ''
    switch (param) {
        case "venta":
            result = "1"
            break
        case "arriendo":
            result = "2"
            break
        case "venta y arriendo":
            result = "3"
            break
    }
    return result
}
const getTypeProperty = (param: string) => {
    let result = ''
    switch (param) {
        case "Casa":
            result = "1"
            break
        case "Finca":
            result = "6"
            break
        case "Bodega":
            result = "13"
            break
        case "Lote o Casalote":
            result = "8"
            break
        case "Consultorio":
        case "Local Comercial":
            result = "4"
            break
        case "Oficina":
        case "Edificio de Oficinas":
            result = "5"
            break
        case "Edificio de Apartamentos":
        case "Apartamento":
            result = "2"
            break
    }
    return result
}
const getDepartament = (department: string) => {
    department = department?.normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    const objColombia = Colombia.find((el) => {
        const zonaTmp = el.zona.normalize("NFD").replace(/[\u0300-\u036f]/g, "")
        const departamentoTmp = el.departamento.normalize("NFD").replace(/[\u0300-\u036f]/g, "")
        return departamentoTmp.toLowerCase() === department?.toLowerCase() || zonaTmp.toLowerCase() === department?.toLowerCase()
    })
    let result = 0
    result = objColombia ? objColombia.IDdepartamentos : result
    return result.toString()
}
const getZone = (zone: string) => {
    zone = zone?.normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    const objColombia = Colombia.find((el) => {
        const zonaTmp = el.zona.normalize("NFD").replace(/[\u0300-\u036f]/g, "")
        const departamentoTmp = el.departamento.normalize("NFD").replace(/[\u0300-\u036f]/g, "")
        const idTmp = el.id
        const regexZona = new RegExp(zonaTmp, "i");
        const regexDepartamento = new RegExp(departamentoTmp, "i");
        let matchZona = zone?.toLowerCase().match(regexZona);
        let matchDepartamento = zone?.toLowerCase().match(regexDepartamento);
        const rspZona = matchZona ? matchZona.length : 0;
        const rspDepartamento = matchDepartamento ? matchDepartamento.length : 0;
        if (rspZona > 0) {
            return el.id === idTmp;
        } else if (rspDepartamento > 0) {
            return el.id === idTmp;
        }
        return false
    })
    let result = 0
    result = objColombia ? objColombia.id : result
    return result.toString()
}
const getBedRooms = (bedroom: number) => {
    let result = 0
    switch (bedroom) {
        case 1:
            result = 2
            break
        case 2:
            result = 3
            break
        case 3:
            result = 4
            break
        case 4:
            result = 5
            break
        default:
            result = 6
            break
    }
    return result
}
const getBathRooms = (bathroom: number) => {
    let result = 0
    switch (bathroom) {
        case 1:
            result = 1
            break
        case 2:
            result = 2
            break
        default:
            result = 3
            break
    }
    return result
}