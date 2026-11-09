import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateEstudianteDto } from './create-estudiante.dto';

describe('CreateEstudianteDto', () => {
  const validStudent = {
    dni: '12345678',
    nombres: 'Ana María',
    apellidos: 'García Soto',
    email: 'ana@example.test',
    telefono: '999888777',
    fecha_nacimiento: '2000-02-29',
    direccion: 'Cajamarca',
    estado: 'activo',
  };

  it('trims input and accepts nullable optional fields', async () => {
    const dto = plainToInstance(CreateEstudianteDto, {
      ...validStudent,
      nombres: ' Ana María ',
      email: ' ',
      telefono: null,
    });

    await expect(validate(dto)).resolves.toHaveLength(0);
    expect(dto.nombres).toBe('Ana María');
    expect(dto.email).toBeNull();
    expect(dto.telefono).toBeNull();
  });

  it('rejects invalid DNI, field bounds, email, state and future birth dates', async () => {
    const dto = plainToInstance(CreateEstudianteDto, {
      ...validStudent,
      dni: '1234567x',
      nombres: 'x'.repeat(101),
      apellidos: ' ',
      email: 'no-es-correo',
      telefono: 't'.repeat(21),
      fecha_nacimiento: '2999-01-01',
      direccion: 'd'.repeat(256),
      estado: 'borrado',
    });
    const errors = await validate(dto);

    expect(errors.map(({ property }) => property)).toEqual(
      expect.arrayContaining([
        'dni',
        'nombres',
        'apellidos',
        'email',
        'telefono',
        'fecha_nacimiento',
        'direccion',
        'estado',
      ]),
    );
  });
});
