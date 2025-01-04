import { Router } from 'express'
import { CategoryController } from './controller'

export class CategoryRoutes {
  static get routes(): Router {
    const router = Router()
    const constroller = new CategoryController()

    // Definir las rutas
    router.get('/', constroller.getCategories)
    router.post('/', constroller.createCategory)

    return router
  }
}
