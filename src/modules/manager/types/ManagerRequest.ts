import { IsString, IsOptional } from "class-validator";

export class SecurityQuestions {
  @IsString()
  @IsOptional()
  questionOne: string;

  @IsString()
  @IsOptional()
  answerOne: string;

  @IsString()
  @IsOptional()
  questionTwo: string;

  @IsString()
  @IsOptional()
  answerTwo: string;

  @IsString()
  password: string;
}
