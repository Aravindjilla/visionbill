import { Request } from 'express';
import { Scan } from './scans/schemas/scan.schema';
import { IsString, IsNumber, IsOptional, IsArray, ValidateNested, IsNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';

export interface AuthenticatedRequest extends Request {
  user: {
    sub: string;
    email: string;
  };
}

export class BillItemDto {
  @IsString()
  @IsNotEmpty()
  shorthand: string;

  @IsString()
  @IsNotEmpty()
  cleanName: string;

  @IsString()
  @IsOptional()
  category?: string;

  @IsNumber()
  qty: number;

  @IsString()
  @IsOptional()
  unit?: string;

  @IsNumber()
  price: number;

  @IsString()
  @IsOptional()
  imageUrl?: string;
}

export class UpdateItemsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BillItemDto)
  items: BillItemDto[];
}

export class ScanResponseDto {
  scan: Scan;
  status: string;
}

export class ScansListResponseDto {
  scans: Scan[];
  total?: number;
}
