import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateCursoDto } from './create-curso.dto';

describe('CreateCursoDto', () => {
  const validCourse = {
    codigo: 'CUR-008',
    nombre: 'Excel',
    descripcion: 'Curso de hojas de cálculo',
    categoria: 'tecnologia',
    duracion_horas: 20,
    precio: 150,
    modalidad: 'virtual',
    horario: 'Lun-Mié',
    cupos_maximos: 20,
    estado: 'activo',
  };

  it('trims strings and accepts valid Laravel course fields', async () => {
    const dto = plainToInstance(CreateCursoDto, {
      ...validCourse,
      codigo: ' CUR-008 ',
      nombre: ' Excel ',
    });

    await expect(validate(dto)).resolves.toHaveLength(0);
    expect(dto.codigo).toBe('CUR-008');
    expect(dto.nombre).toBe('Excel');
  });

  it('rejects blank required strings, invalid enums, and numeric bounds', async () => {
    const dto = plainToInstance(CreateCursoDto, {
      ...validCourse,
      codigo: '   ',
      nombre: 'x'.repeat(151),
      categoria: 'otra',
      duracion_horas: '0',
      precio: '',
      modalidad: 'mixta',
      horario: 'h'.repeat(101),
      cupos_maximos: '2147483648',
      estado: 'borrador',
    });
    const errors = await validate(dto);

    expect(errors.map(({ property }) => property)).toEqual(
      expect.arrayContaining([
        'codigo',
        'nombre',
        'categoria',
        'duracion_horas',
        'precio',
        'modalidad',
        'horario',
        'cupos_maximos',
        'estado',
      ]),
    );
  });
});
