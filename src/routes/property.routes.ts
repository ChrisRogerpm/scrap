import { Router } from 'express';
import { generateData, userProperties, userList } from '../controllers/metrocuadrado.controller'
const router = Router()

router.get('/generateData/:pages', generateData)
router.get('/users/xml', userList)
router.get('/users/:id/xml', userProperties)
export default router;