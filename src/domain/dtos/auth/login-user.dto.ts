import { regularExps } from '../../../config'

export class LoginUserDto {
  private constructor(public email: string, public password: string) {}

  static login(object: { [key: string]: any }): [string?, LoginUserDto?] {
    const { email, password } = object
    if (!email) return ['Email is required']
    if (!regularExps.email.test(email)) return ['Email is not valid']
    if (!password) return ['Password is required']
    if (password.length < 6) return ['Password too short']

    return [undefined, new LoginUserDto(email, password)]
  }
}
