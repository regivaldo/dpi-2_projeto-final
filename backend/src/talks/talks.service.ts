import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { AuthenticatedUser } from '../auth/auth.types';
import { User } from '../users/user.entity';
import { UsersService } from '../users/users.service';
import { CreateTalkWithCoverDto } from './dto/create-talk.dto';
import { ListTalksQueryDto } from './dto/list-talks-query.dto';
import { UpdateTalkWithCoverDto } from './dto/update-talk.dto';
import { Talk } from './talk.entity';

@Injectable()
export class TalksService {
  constructor(
    @InjectRepository(Talk)
    private readonly talksRepository: Repository<Talk>,
    private readonly usersService: UsersService,
  ) {}

  async create(
    createTalkDto: CreateTalkWithCoverDto,
    currentUser: AuthenticatedUser,
  ) {
    const speaker = await this.getUserOrFail(currentUser.id);
    const talk = this.talksRepository.create({
      ...createTalkDto,
      speaker,
      attendees: [],
    });

    return this.talksRepository.save(talk);
  }

  async findAll(query: ListTalksQueryDto) {
    return this.findWithFilters(query);
  }

  async findMine(query: ListTalksQueryDto, currentUser: AuthenticatedUser) {
    return this.findWithFilters(query, currentUser.id);
  }

  private async findWithFilters(query: ListTalksQueryDto, speakerId?: string) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const queryBuilder = this.talksRepository
      .createQueryBuilder('talk')
      .leftJoinAndSelect('talk.speaker', 'speaker')
      .leftJoinAndSelect('talk.attendees', 'attendees')
      .orderBy('talk.date', 'ASC')
      .addOrderBy('talk.startTime', 'ASC')
      .skip((page - 1) * limit)
      .take(limit);

    if (query.search) {
      queryBuilder.andWhere(
        '(talk.title LIKE :search OR talk.description LIKE :search)',
        { search: `%${query.search}%` },
      );
    }

    if (query.date) {
      queryBuilder.andWhere('talk.date = :date', { date: query.date });
    }

    if (speakerId) {
      queryBuilder.andWhere('speaker.id = :speakerId', { speakerId });
    }

    const [items, total] = await queryBuilder.getManyAndCount();

    return {
      items,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const talk = await this.talksRepository.findOne({ where: { id } });

    if (!talk) {
      throw new NotFoundException('Palestra nao encontrada.');
    }

    return talk;
  }

  async update(
    id: string,
    updateTalkDto: UpdateTalkWithCoverDto,
    currentUser: AuthenticatedUser,
  ) {
    const talk = await this.findOne(id);
    this.ensureSpeakerOwnsTalk(talk, currentUser);
    Object.assign(talk, updateTalkDto);

    return this.talksRepository.save(talk);
  }

  async remove(id: string, currentUser: AuthenticatedUser) {
    const talk = await this.findOne(id);
    this.ensureSpeakerOwnsTalk(talk, currentUser);
    await this.talksRepository.remove(talk);

    return { message: 'Palestra deletada com sucesso.' };
  }

  async enroll(id: string, currentUser: AuthenticatedUser) {
    const talk = await this.findOne(id);
    const user = await this.getUserOrFail(currentUser.id);

    if (!talk.attendees.some((attendee) => attendee.id === user.id)) {
      talk.attendees.push(user);
      await this.talksRepository.save(talk);
    }

    return this.findOne(id);
  }

  async cancelEnrollment(id: string, currentUser: AuthenticatedUser) {
    const talk = await this.findOne(id);
    talk.attendees = talk.attendees.filter(
      (attendee) => attendee.id !== currentUser.id,
    );
    await this.talksRepository.save(talk);

    return this.findOne(id);
  }

  async removeAttendee(
    talkId: string,
    attendeeId: string,
    currentUser: AuthenticatedUser,
  ) {
    const talk = await this.findOne(talkId);
    this.ensureSpeakerOwnsTalk(talk, currentUser);
    talk.attendees = talk.attendees.filter((attendee) => attendee.id !== attendeeId);
    await this.talksRepository.save(talk);

    return this.findOne(talkId);
  }

  private ensureSpeakerOwnsTalk(talk: Talk, currentUser: AuthenticatedUser) {
    if (talk.speaker.id !== currentUser.id) {
      throw new ForbiddenException('Voce nao pode alterar esta palestra.');
    }
  }

  private async getUserOrFail(id: string): Promise<User> {
    const user = await this.usersService.findById(id);

    if (!user) {
      throw new NotFoundException('Usuario nao encontrado.');
    }

    return user;
  }
}
