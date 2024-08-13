import { bcryptAdapter, envs, JwtAdapter } from '../../config'
import { UserModel } from '../../data'
import {
  CustomError,
  LoginUserDto,
  RegisterUserDto,
  UserEntity,
} from '../../domain'
import { EmailService } from './email.service'

export class AuthService {
  constructor(private readonly emailService: EmailService) {}

  public async registerUser(registerUserDto: RegisterUserDto) {
    const existUser = await UserModel.findOne({ email: registerUserDto.email })

    if (existUser) {
      throw CustomError.badRequest(
        `User with email ${registerUserDto.email} already exists`
      )
    }

    try {
      const user = new UserModel(registerUserDto!)

      user.password = bcryptAdapter.hash(registerUserDto.password)
      await user.save()

      await this.sedEmailValidationLink(user.email)

      const { password, ...rest } = UserEntity.fromObject(user)

      const token = await JwtAdapter.generateToken({ id: user.id })
      if (!token) throw CustomError.internalServer('Error generate token')

      return { user: rest, token }
    } catch (error) {
      throw CustomError.internalServer(`${error}`)
    }
  }

  public async loginUser(loginUserDto: LoginUserDto) {
    const userFound = await UserModel.findOne({ email: loginUserDto.email })
    if (!userFound) throw CustomError.badRequest('User not found')

    const isPasswordMatch = bcryptAdapter.compare(
      loginUserDto.password,
      userFound.password
    )
    if (!isPasswordMatch) throw CustomError.badRequest('Invalid credentials')

    const { password, ...rest } = UserEntity.fromObject(userFound)

    const token = await JwtAdapter.generateToken({ id: userFound.id })
    if (!token) throw CustomError.internalServer('Error generate token')

    return {
      user: rest,
      token,
    }
  }

  private sedEmailValidationLink = async (email: string) => {
    const token = await JwtAdapter.generateToken({ email })
    if (!token) throw CustomError.internalServer('Error generate token')

    const link = `${envs.WEBSERVICE_URL}/auth/validate-email/${token}`

    const html = `
      <h1>Validate your email</h1>
      <p>Click on the following link to validate your email</p>
      <a href="${link}">Validate Email</a>
    `

    const options = {
      to: email,
      subject: 'Validate your email',
      htmlBody: html,
    }

    const isSent = await this.emailService.sendEmail(options)
    if (!isSent) throw CustomError.internalServer('Error sending email')

    return true
  }

  public validateEmail = async (token: string) => {
    const payload = await JwtAdapter.validateToken(token)
    if (!payload) throw CustomError.unauthorized('Invalid token')

    const { email } = payload as { email: string }
    if (!email) throw CustomError.internalServer('Email not found in token')

    const user = await UserModel.findOne({ email })
    if (!user) throw CustomError.internalServer('User not found')

    user.emailValidated = true
    await user.save()

    return true
  }
}
