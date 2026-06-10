import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { UserRole } from '../../users/enums/user-role.enum';
import { UserTitle } from '../../users/enums/user-title.enum';
import { CreateUserDto } from './create-user.dto';

describe('CreateUserDto', () => {
  const validPayload = {
    fullName: 'Maria Silva',
    birthDate: '1990-01-01',
    email: 'maria@email.com',
    password: 'Senha@123',
    phone: '11999999999',
    title: UserTitle.Graduacao,
    role: UserRole.Usuario,
  };

  it('accepts a strong password', async () => {
    const dto = plainToInstance(CreateUserDto, validPayload);
    const errors = await validate(dto);

    expect(errors).toHaveLength(0);
  });

  it('rejects a weak password', async () => {
    const dto = plainToInstance(CreateUserDto, {
      ...validPayload,
      password: 'senha123',
    });
    const errors = await validate(dto);

    expect(errors.some((error) => error.property === 'password')).toBe(true);
  });
});
