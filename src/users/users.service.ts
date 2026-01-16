import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { FriendRequest } from './entities/friend-request.entity';
import { FriendRequestStatus } from './enums/friend-request-status.enum';
import { CreateFriendRequestDto } from './dto/create-friend-request.dto';
import { In, Repository } from 'typeorm';
import { TeamsService } from 'src/teams/teams.service';
import { UpdateUserTokenDto } from './dto/update-user-token.dto';
import { MobileTokenResponse } from './types/mobile-token-response.type';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(FriendRequest)
    private friendRequestsRepository: Repository<FriendRequest>,
    private teamsService: TeamsService
  ) {}

  async create(createUserDto: CreateUserDto) {
    return this.usersRepository.save(createUserDto);
  }

  findAll() {
    return this.usersRepository.find({ relations: ['team'] });
  }

  async search(email?: string, lastName?: string, teamId?: number) {
    const queryBuilder = this.usersRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.team', 'team');

    if (email) {
      queryBuilder.andWhere('user.email LIKE :email', { email: `%${email}%` });
    }

    if (lastName) {
      queryBuilder.andWhere('user.lastName LIKE :lastName', { lastName: `%${lastName}%` });
    }

    if (teamId !== undefined) {
      queryBuilder.andWhere('team.id = :teamId', { teamId });
    }

    return queryBuilder.getMany();
  }

  findOne(id: number) {
    return this.usersRepository.findOne({
      where: { 
        id,
      },
      relations: ['team'],
    });
  }

  findFriendRequest(id: number) {
    return this.friendRequestsRepository.findOne({
      where: { id },
      relations: ['requester', 'recipient'],
    });
  }

  findOneByEmail(email: string) {
    return this.usersRepository.findOneBy({ email });
  }

  findByIds(ids: Array<number>, team?: number) {
    return this.usersRepository.find({
      relations: ['team'],
      where: {
        id: In(ids),
        ...(team && {
          team: { id: team },
        }),
      },
    });
  }

  getMobileTokens(ids: Array<number>): Promise<Array<MobileTokenResponse>> {
    return this.usersRepository
      .createQueryBuilder('user')
      .select(['user.id AS id', 'user.mobileToken AS token'])
      .where('user.id IN (:...ids)', { ids })
      .getRawMany();
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

  async createFriendRequest(
    createFriendRequestDto: CreateFriendRequestDto,
    requester: User
  ) {
    if (createFriendRequestDto.recipient === requester.id) {
      throw new BadRequestException('Cannot send friend request to yourself');
    }

    const existingRequest = await this.friendRequestsRepository.findOne({
      where: [
        {
          requester: { id: requester.id },
          recipient: { id: createFriendRequestDto.recipient },
          status: In([
            FriendRequestStatus.IN_PROGRESS,
            FriendRequestStatus.ACCEPTED,
          ]),
        },
        {
          requester: { id: createFriendRequestDto.recipient },
          recipient: { id: requester.id },
          status: In([
            FriendRequestStatus.IN_PROGRESS,
            FriendRequestStatus.ACCEPTED,
          ]),
        },
      ],
    });

    if (existingRequest) {
      if (existingRequest.status === FriendRequestStatus.ACCEPTED) {
        throw new BadRequestException('Users are already friends');
      }

      throw new BadRequestException('Friend request already exists');
    }

    const requesterEntity = this.usersRepository.create({ id: requester.id });
    const recipient = this.usersRepository.create({
      id: createFriendRequestDto.recipient,
    });

    const friendRequest = this.friendRequestsRepository.create({
      message: createFriendRequestDto.message,
      requester: requesterEntity,
      recipient,
    });

    return this.friendRequestsRepository.save(friendRequest);
  }

  async getFriends(user: User) {
    const friendRequests = await this.friendRequestsRepository.find({
      where: [
        {
          status: FriendRequestStatus.ACCEPTED,
          requester: { id: user.id },
        },
        {
          status: FriendRequestStatus.ACCEPTED,
          recipient: { id: user.id },
        },
      ],
      relations: ['requester', 'recipient'],
    });

    const friendsById = new Map<number, User>();

    friendRequests.forEach((request) => {
      const friend =
        request.requester.id === user.id
          ? request.recipient
          : request.requester;

      friendsById.set(friend.id, friend);
    });

    return Array.from(friendsById.values());
  }

  async acceptFriendRequest(id: number, user: User) {
    const friendRequest = await this.findFriendRequest(id);

    if (!friendRequest) {
      throw new BadRequestException('Friend request doesn\'t exist');
    }

    if (friendRequest.status !== FriendRequestStatus.IN_PROGRESS) {
      throw new BadRequestException('Friend request is not in progress');
    }

    if (friendRequest.recipient.id !== user.id) {
      throw new BadRequestException('Only recipient can accept friend request');
    }

    const updatedFriendRequest = this.friendRequestsRepository.create({
      id: friendRequest.id,
      status: FriendRequestStatus.ACCEPTED,
    });

    return this.friendRequestsRepository.save(updatedFriendRequest);
  }

  async rejectFriendRequest(id: number, user: User) {
    const friendRequest = await this.findFriendRequest(id);

    if (!friendRequest) {
      throw new BadRequestException('Friend request doesn\'t exist');
    }

    if (friendRequest.status !== FriendRequestStatus.IN_PROGRESS) {
      throw new BadRequestException('Friend request is not in progress');
    }

    if (friendRequest.recipient.id !== user.id) {
      throw new BadRequestException('Only recipient can reject friend request');
    }

    const updatedFriendRequest = this.friendRequestsRepository.create({
      id: friendRequest.id,
      status: FriendRequestStatus.REJECTED,
    });

    return this.friendRequestsRepository.save(updatedFriendRequest);
  }

  async getReceivedFriendRequests(user: User) {
    return this.friendRequestsRepository.find({
      where: {
        recipient: { id: user.id },
        status: FriendRequestStatus.IN_PROGRESS,
      },
      relations: ['requester', 'recipient'],
    });
  }

  async getSentFriendRequests(user: User) {
    return this.friendRequestsRepository.find({
      where: {
        requester: { id: user.id },
        status: FriendRequestStatus.IN_PROGRESS,
      },
      relations: ['requester', 'recipient'],
    });
  }

  async deleteFriendRequest(id: number, user: User) {
    const friendRequest = await this.findFriendRequest(id);

    if (!friendRequest) {
      throw new BadRequestException('Friend request doesn\'t exist');
    }

    if (friendRequest.status !== FriendRequestStatus.IN_PROGRESS) {
      throw new BadRequestException('Friend request is not in progress');
    }

    // Allow deletion if user is either the requester or recipient
    if (
      friendRequest.requester.id !== user.id &&
      friendRequest.recipient.id !== user.id
    ) {
      throw new BadRequestException(
        'You can only delete your own friend requests'
      );
    }

    return this.friendRequestsRepository.delete(id);
  }
}
