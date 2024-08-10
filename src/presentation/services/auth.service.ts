import { bcryptAdapter, JwtAdapter } from '../../config'
import { UserModel } from '../../data'
import {
  CustomError,
  LoginUserDto,
  RegisterUserDto,
  UserEntity,
} from '../../domain'

export class AuthService {
  constructor() {}

  public async registerUser(registerUserDto: RegisterUserDto) {
    const existUser = await UserModel.findOne({ email: registerUserDto.email })

    if (existUser) {
      throw CustomError.badRequest(
        `User with email ${registerUserDto.email} already exists`
      )
    }

    try {
      const user = new UserModel(registerUserDto!)

      // Encriptar password
      user.password = bcryptAdapter.hash(registerUserDto.password)
      await user.save()

      // JWT

      // Email de confirmacion

      const { password, ...rest } = UserEntity.fromObject(user)

      return { user: rest, token: 'ABC' }
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
}
