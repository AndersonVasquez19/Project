import {
  BadRequestException,
  Injectable,
  UnprocessableEntityException,
} from '@nestjs/common';
import { writeAudit } from '../../../common/audit/write-audit';
import { PrismaService } from '../../../prisma/prisma.service';
import { CONFIGURATION_KEYS, SaveSettingDto } from '../dtos/save-setting.dto';

const SETTINGS: Record<
  (typeof CONFIGURATION_KEYS)[number],
  { label: string; description: string; defaultValue: string }
> = {
  'system.name': {
    label: 'Nombre del sistema',
    description: 'Nombre que se muestra en las áreas administrativas.',
    defaultValue: 'Horus',
  },
  'system.timezone': {
    label: 'Zona horaria',
    description: 'Zona horaria de referencia para reportes.',
    defaultValue: 'America/Lima',
  },
  'system.currency': {
    label: 'Moneda',
    description: 'Moneda usada para mostrar importes.',
    defaultValue: 'PEN',
  },
  'reports.company_name': {
    label: 'Nombre en reportes',
    description: 'Identificación que se imprime en los archivos exportados.',
    defaultValue: 'Horus',
  },
  'reports.footer': {
    label: 'Pie de página de reportes',
    description: 'Texto adicional para el pie de los documentos exportados.',
    defaultValue: '',
  },
};

const ALLOWED_VALUES: Partial<Record<string, string[]>> = {
  'system.timezone': ['America/Lima', 'UTC'],
  'system.currency': ['PEN', 'USD'],
};

@Injectable()
export class ConfiguracionService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    const stored = await this.prisma.system_settings.findMany({
      where: { key: { in: [...CONFIGURATION_KEYS] } },
      select: { key: true, value: true },
    });
    const storedValues = new Map(
      stored.map(({ key, value }) => [key, value ?? '']),
    );
    return {
      data: CONFIGURATION_KEYS.map((key) => ({
        key,
        ...SETTINGS[key],
        value: storedValues.get(key) ?? SETTINGS[key].defaultValue,
      })),
    };
  }

  async save(dto: SaveSettingDto, actorValue: string) {
    if (!/^[1-9]\d*$/.test(actorValue)) {
      throw new BadRequestException(
        'El identificador de usuario no es válido.',
      );
    }
    const actorId = BigInt(actorValue);
    if (!CONFIGURATION_KEYS.includes(dto.key)) {
      throw new UnprocessableEntityException('La opción no está permitida.');
    }
    if (dto.value.length > 255) {
      throw new UnprocessableEntityException(
        'El valor supera la longitud permitida.',
      );
    }
    const allowed = ALLOWED_VALUES[dto.key];
    if (allowed && !allowed.includes(dto.value)) {
      throw new UnprocessableEntityException(
        'El valor seleccionado no es válido.',
      );
    }

    const now = new Date();
    const setting = SETTINGS[dto.key];
    await this.prisma.system_settings.upsert({
      where: { key: dto.key },
      create: {
        key: dto.key,
        value: dto.value,
        description: setting.description,
        created_at: now,
        updated_at: now,
      },
      update: {
        value: dto.value,
        description: setting.description,
        updated_at: now,
      },
    });
    await writeAudit(this.prisma, {
      userId: actorId,
      action: 'configuracion.actualizada',
      modelType: 'system_settings',
      changes: { clave: dto.key, valor: dto.value },
    });
    return { key: dto.key, value: dto.value };
  }
}
