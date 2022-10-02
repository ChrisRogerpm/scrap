import { User } from './User'

export interface Property {
    id: string;
    tipoOperacion: string;
    tipoPropiedad: string;
    departamento: string;
    zona: string;
    idDormitorios: number;
    idBanios: number;
    m2: string;
    m2edificados: string;
    garage: string;
    titulo: string;
    descripcion: string;
    precioVenta: number;
    monedaVenta: number;
    precioAlquiler: number;
    monedaAlquiler: number;
    latitud: string;
    longitud: string;
    imagenes: string[];
    data_extracted_at: string;
    external_url: string;
    user: User
}
