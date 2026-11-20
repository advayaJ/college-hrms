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

  /** Optional disambiguator: a user may hold the same role key in two
   *  departments (e.g. Non-Teaching Staff in two sections). */
  @IsOptional()
  @IsString()
  departmentId?: string
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
