import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MinLength,
  IsOptional,
  IsBoolean,
  IsInt,
  Min,
  IsDateString,
  IsUUID,
  IsArray,
} from 'class-validator';

// ==========================================
// Authentication DTOs
// ==========================================

export class RegisterDto {
  @IsString()
  @IsNotEmpty()
  tenantName: string;

  @IsString()
  @IsNotEmpty()
  tenantSlug: string;

  @IsEmail()
  email: string;

  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @MinLength(8)
  password: string;
}

export class LoginDto {
  @IsEmail()
  email: string;

  @IsString()
  @IsNotEmpty()
  password: string;
}

export class RefreshTokenDto {
  @IsString()
  @IsNotEmpty()
  refreshToken: string;
}

export interface UserSessionPayload {
  sub: string;
  email: string;
  role: string;
  tenantId: string;
  iat?: number;
  exp?: number;
}

export interface AuthResponseDto {
  user: {
    id: string;
    email: string;
    name?: string | null;
    role: string;
    tenantId: string;
  };
  accessToken: string;
  refreshToken?: string;
}

// ==========================================
// Project DTOs
// ==========================================

export class CreateProjectDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class UpdateProjectDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class AssignUserProjectDto {
  @IsUUID()
  userId: string;

  @IsUUID()
  projectId: string;
}

// ==========================================
// Time Entry DTOs
// ==========================================

export class CreateTimeEntryDto {
  @IsUUID()
  projectId: string;

  @IsDateString()
  date: string;

  @IsInt()
  @Min(1)
  durationMinutes: number;

  @IsString()
  @IsOptional()
  rawComment?: string;
}

export class UpdateTimeEntryDto {
  @IsUUID()
  @IsOptional()
  projectId?: string;

  @IsDateString()
  @IsOptional()
  date?: string;

  @IsInt()
  @Min(1)
  @IsOptional()
  durationMinutes?: number;

  @IsString()
  @IsOptional()
  rawComment?: string;

  @IsString()
  @IsOptional()
  enrichedComment?: string;
}

// ==========================================
// AI / Streaming DTOs
// ==========================================

export class StreamChatDto {
  @IsString()
  @IsNotEmpty()
  message: string;
}

export class ParseTextDto {
  @IsString()
  @IsNotEmpty()
  text: string;
}

export interface ExtractedTimeEntry {
  rawText: string;
  durationMinutes: number;
  extractedTaskDescription: string;
  suggestedProjectKeywords?: string[];
  projectId?: string;
}

export interface ProjectSuggestion {
  id: string;
  name: string;
  matchConfidence: number;
}

export interface ParseStatePayload {
  status: 'SUCCESS' | 'AMBIGUOUS_PROJECT' | 'NO_PROJECT_FOUND' | 'ERROR';
  message: string;
  data?: {
    entries: ExtractedTimeEntry[];
    suggestedProjects?: ProjectSuggestion[];
  };
}
