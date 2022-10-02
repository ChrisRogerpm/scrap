import express, { Application } from 'express';

// Routes
import propertyRoutes from './routes/property.routes'

export class App {

    private app: Application;

    constructor(private port?: number | string) {
        this.app = express();
        this.settings();
        this.middlewares();
        this.routes();
    }

    settings() {
        this.app.set('port', this.port || process.env.PORT);
    }

    middlewares() {
        this.app.use(express.urlencoded({ extended: false }));
        this.app.use(express.json());
    }

    routes() {
        this.app.use(propertyRoutes);
    }

    async listen() {
        this.app.listen(this.app.get('port'));
        console.log(`server started at http://localhost:${this.app.get('port')}`);
    }

}