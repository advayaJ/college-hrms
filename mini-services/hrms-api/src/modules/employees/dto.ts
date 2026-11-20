import { Type } from 'class-transformer'
import {
  IsBoolean, IsDateString, IsEmail, IsEnum, IsInt, IsNumber, IsOptional, IsString, Length, Matches, Max, Min, ValidateNested,
} from 'class-validator'
import {
  EmploymentType, Gender, MaritalStatus, ReservationCategory, SeparationType, StaffType,
} from '@prisma/client'

export class QualificationDto {
  @IsString() degree!: string
  @IsString() field!: string
  @IsString() institutionName!: string
  @IsString() university!: string
  @IsInt() @Min(1975) @Max(2030) yearOfPassing!: number
  @IsOptional() @IsNumber() percentage?: number
  @IsOptional() @IsString() mode?: string
}
export class CreateEmployeeDto {
  @IsString() @Length(1, 40) firstName!: string
  @IsString() @Length(1, 40) lastName!: string
  @IsEnum(Gender) gender!: Gender
  @IsDateString() dateOfBirth!: string
  @IsOptional() @IsString() bloodGroup?: string
  @IsOptional() @IsEnum(MaritalStatus) maritalStatus?: MaritalStatus
  @IsOptional() @IsEnum(ReservationCategory) reservationCategory?: ReservationCategory

  @IsEmail() personalEmail!: string
  @IsString() @Matches(/^[0-9+\-\s]{10,15}$/) phone!: string
  @IsOptional() @IsString() alternatePhone?: string
  @IsString() addressLine!: string
  @IsString() city!: string
  @IsString() state!: string
  @IsString() @Matches(/^\d{6}$/) pincode!: string

  @IsString() campusId!: string
  @IsOptional() @IsString() departmentId?: string
  @IsString() designationId!: string
  @IsEnum(StaffType) staffType!: StaffType
  @IsEnum(EmploymentType) employmentType!: EmploymentType
  @IsDateString() joiningDate!: string
  @IsOptional() @IsNumber() basicMonthly?: number

  @IsOptional() @ValidateNested({ each: true }) @Type(() => QualificationDto)
  qualifications?: QualificationDto[]
  @IsOptional() @IsBoolean() createAccount?: boolean
}

export class UpdateEmployeeDto {
  @IsOptional() @IsString() @Length(1, 40) firstName?: string
  @IsOptional() @IsString() @Length(1, 40) lastName?: string
  @IsOptional() @IsString() bloodGroup?: string
  @IsOptional() @IsString() personalEmail?: string
  @IsOptional() @IsString() phone?: string
  @IsOptional() @IsString() alternatePhone?: string
  @IsOptional() @IsString() addressLine?: string
  @IsOptional() @IsString() city?: string
  @IsOptional() @IsString() state?: string
  @IsOptional() @IsString() pincode?: string
  @IsOptional() @IsString() emergencyContactName?: string
  @IsOptional() @IsString() emergencyContactPhone?: string
  @IsOptional() @IsString() departmentId?: string
  @IsOptional() @IsString() designationId?: string
  @IsOptional() @IsString() campusId?: string
  @IsOptional() @IsEnum(EmploymentType) employmentType?: EmploymentType
}

export class SeparateEmployeeDto {
  @IsEnum(SeparationType) separationType!: SeparationType
  @IsDateString() separationDate!: string
  @IsOptional() @IsString() remarks?: string
}
