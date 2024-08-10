import { Request, Response } from 'express'
import { CustomError, LoginUserDto, RegisterUserDto } from '../../domain'
import { AuthService } from '../services/auth.service'

export class AuthController {
  constructor(public readonly authService: AuthService) {}

  private handleError = (error: unknown, res: Response) => {
    if (error instanceof CustomError) {
      return res.status(error.statusCode).json({ error: error.message })
    }

    console.log(`${error}`)
    return res.status(500).json({ error: 'Internal Server Error' })
  }

  registerUser = (req: Request, res: Response) => {
    const [error, registerDto] = RegisterUserDto.create(req.body)
    if (error) return res.status(400).json({ error })

    this.authService
      .registerUser(registerDto!)
      .then((user) => res.status(201).json(user))
      .catch((error) => this.handleError(error, res))
  }

  loginUser = (req: Request, res: Response) => {
    const [error, loginUserDto] = LoginUserDto.login(req.body)
    if (error) return res.status(400).json({ error })

    this.authService
      .loginUser(loginUserDto!)
      .then((user) => res.status(200).json(user))
      .catch((error) => this.handleError(error, res))
  }

  validateEmail = (req: Request, res: Response) => {
    res.json('validateEmail')
  }
}
