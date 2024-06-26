import { Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { In, Repository } from 'typeorm';
import { TeamsService } from 'src/teams/teams.service';
import { UpdateUserTokenDto } from './dto/update-user-token.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private teamsService: TeamsService
  ) {}

  async create(createUserDto: CreateUserDto) {
    return this.usersRepository.save(createUserDto);
  }

  findAll() {
    return this.usersRepository.find({ relations: ["team"] });
  }

  findOne(id: number) {
    return this.usersRepository.findOneBy({ id });
  }

  findOneByEmail(email: string) {
    return this.usersRepository.findOneBy({ email });
  }

  findByIds(ids: Array<number>, team?: number) {
    return this.usersRepository.find({
      relations: ["team"],
      where: {
        id: In(ids),
        ...(team && {
          team: { id: team },
        }),
      },
    });
  }

  uploadImage(id: number, image: string) {
    return this.usersRepository.update(id, {
      image,
    });
  }

  async update(id: number, updateUserDto: UpdateUserDto) {
    const team = await this.teamsService.findOne(updateUserDto.team);
    return this.usersRepository.save({
      ...updateUserDto,
      id,
      team,
    });
  }

  async confirmEmail(email: string) {
    return this.usersRepository.update(
      { email },
      {
        isEmailConfirmed: true,
      }
    );
  }

  remove(id: number) {
    return this.usersRepository.delete({ id });
  }

  async updateCurrentUserToken(id: number, params: UpdateUserTokenDto) {
    const userToUpdate = this.usersRepository.create({
      id: Number(id),
      mobileToken: params.token,
    });

    await this.usersRepository.save(userToUpdate);

    const updatedUser = this.findOne(id);

    return updatedUser;
  }
}
