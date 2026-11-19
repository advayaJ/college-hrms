import { IsEmail, IsOptional, IsString, MaxLength, MinLength } from 'class-validator'

export class LoginDto {
  @IsEmail()
  email!: string

  @IsString()
  @MinLength(6)
  @MaxLength(128)
  password!: string
}

export class SwitchRoleDto {
  @IsString()
  roleKey!: string
}

export class ChangePasswordDto {
  @IsString()
  @MinLength(6)
  @MaxLength(128)
  currentPassword!: string

  @IsString()
  @MinLength(8)
  @MaxLength(128)
  newPassword!: string
}
