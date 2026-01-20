import { DataSource } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { Team } from '../teams/entities/team.entity';
import { Game } from '../games/entities/game.entity';
import { Role } from '../common/enums/role.enum';
import { GameType } from '../common/enums/gameType';
import * as fs from 'fs';
import * as path from 'path';

const SEED_FLAG_FILE = path.join(process.cwd(), '.seed-completed');

// First names and last names for generating random users
const FIRST_NAMES = [
  'James', 'Mary', 'John', 'Patricia', 'Robert', 'Jennifer', 'Michael', 'Linda',
  'William', 'Elizabeth', 'David', 'Barbara', 'Richard', 'Susan', 'Joseph', 'Jessica',
  'Thomas', 'Sarah', 'Charles', 'Karen', 'Christopher', 'Nancy', 'Daniel', 'Lisa',
  'Matthew', 'Betty', 'Anthony', 'Margaret', 'Mark', 'Sandra', 'Donald', 'Ashley',
  'Steven', 'Kimberly', 'Paul', 'Emily', 'Andrew', 'Donna', 'Joshua', 'Michelle',
  'Kenneth', 'Carol', 'Kevin', 'Amanda', 'Brian', 'Melissa', 'George', 'Deborah',
  'Timothy', 'Stephanie', 'Ronald', 'Rebecca', 'Jason', 'Sharon', 'Edward', 'Laura',
  'Jeffrey', 'Cynthia', 'Ryan', 'Kathleen', 'Jacob', 'Amy', 'Gary', 'Shirley',
  'Nicholas', 'Angela', 'Eric', 'Helen', 'Jonathan', 'Anna', 'Stephen', 'Brenda',
  'Larry', 'Pamela', 'Justin', 'Nicole', 'Scott', 'Emma', 'Brandon', 'Samantha',
  'Benjamin', 'Katherine', 'Samuel', 'Christine', 'Gregory', 'Debra', 'Frank', 'Rachel',
  'Alexander', 'Carolyn', 'Raymond', 'Janet', 'Patrick', 'Virginia', 'Jack', 'Maria',
  'Dennis', 'Heather', 'Jerry', 'Diane', 'Tyler', 'Julie', 'Aaron', 'Joyce',
];

const LAST_NAMES = [
  'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis',
  'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Wilson', 'Anderson', 'Thomas', 'Taylor',
  'Moore', 'Jackson', 'Martin', 'Lee', 'Thompson', 'White', 'Harris', 'Sanchez',
  'Clark', 'Ramirez', 'Lewis', 'Robinson', 'Walker', 'Young', 'Allen', 'King',
  'Wright', 'Scott', 'Torres', 'Nguyen', 'Hill', 'Flores', 'Green', 'Adams',
  'Nelson', 'Baker', 'Hall', 'Rivera', 'Campbell', 'Mitchell', 'Carter', 'Roberts',
  'Gomez', 'Phillips', 'Evans', 'Turner', 'Diaz', 'Parker', 'Cruz', 'Edwards',
  'Collins', 'Reyes', 'Stewart', 'Morris', 'Morales', 'Murphy', 'Cook', 'Rogers',
  'Gutierrez', 'Ortiz', 'Morgan', 'Cooper', 'Peterson', 'Bailey', 'Reed', 'Kelly',
  'Howard', 'Ramos', 'Kim', 'Cox', 'Ward', 'Richardson', 'Watson', 'Brooks',
  'Chavez', 'Wood', 'James', 'Bennett', 'Gray', 'Mendoza', 'Ruiz', 'Hughes',
  'Price', 'Alvarez', 'Castillo', 'Sanders', 'Patel', 'Myers', 'Long', 'Ross',
  'Foster', 'Jimenez', 'Powell', 'Jenkins', 'Perry', 'Russell', 'Sullivan', 'Bell',
  'Coleman', 'Butler', 'Henderson', 'Barnes', 'Gonzales', 'Fisher', 'Vasquez', 'Simmons',
];

const TEAM_NAMES = [
  'Thunder', 'Eagles', 'Wolves', 'Tigers', 'Lions', 'Panthers', 'Hawks', 'Falcons',
  'Sharks', 'Dolphins', 'Bears', 'Ravens', 'Wildcats', 'Warriors', 'Knights', 'Giants',
  'Dragons', 'Phoenix', 'Stallions', 'Vikings', 'Titans', 'Spartans', 'Crusaders', 'Gladiators',
];

const COUNTRIES = [
  'US', 'GB', 'CA', 'AU', 'DE', 'FR', 'IT', 'ES', 'NL', 'BE', 'CH', 'AT', 'SE', 'NO',
  'DK', 'FI', 'PL', 'CZ', 'IE', 'PT', 'GR', 'NZ', 'ZA', 'BR', 'MX', 'AR', 'CL', 'CO',
];

function getRandomElement<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

function getRandomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateRandomEmail(firstName: string, lastName: string, index: number): string {
  const domains = ['example.com', 'test.com', 'seed.com', 'demo.com'];
  return `${firstName.toLowerCase()}.${lastName.toLowerCase()}.${index}@${getRandomElement(domains)}`;
}

export async function seedDatabase(dataSource: DataSource): Promise<void> {
  const isProduction = process.env.NODE_ENV === 'production';
  const shouldSeed = process.env.SEED_DATABASE === 'true';

  // Check if we should seed
  if (isProduction || !shouldSeed) {
    console.log('Skipping database seeding:', {
      isProduction,
      shouldSeed,
    });
    return;
  }

  // Check if seeding has already been completed
  if (fs.existsSync(SEED_FLAG_FILE)) {
    console.log('Database seeding already completed. Skipping...');
    return;
  }

  console.log('Starting database seeding...');

  const userRepository = dataSource.getRepository(User);
  const teamRepository = dataSource.getRepository(Team);
  const gameRepository = dataSource.getRepository(Game);

  try {
    // Create 100 users
    console.log('Creating 100 users...');
    const users: User[] = [];
    for (let i = 0; i < 100; i++) {
      const firstName = getRandomElement(FIRST_NAMES);
      const lastName = getRandomElement(LAST_NAMES);
      const user = userRepository.create({
        email: generateRandomEmail(firstName, lastName, i),
        firstName,
        lastName,
        isActive: true,
        isEmailConfirmed: true,
        role: i === 0 ? Role.ADMIN : Role.USER, // First user is admin
        country: getRandomElement(COUNTRIES),
      });
      users.push(user);
    }
    const savedUsers = await userRepository.save(users);
    console.log(`Created ${savedUsers.length} users`);

    // Create 10 teams
    console.log('Creating 10 teams...');
    const teams: Team[] = [];
    for (let i = 0; i < 10; i++) {
      const teamName = `${getRandomElement(TEAM_NAMES)} ${i + 1}`;
      // Assign a random user as team creator
      const creator = getRandomElement(savedUsers);
      const team = teamRepository.create({
        name: teamName,
        isActive: true,
        country: getRandomElement(COUNTRIES),
        createdBy: creator,
      });
      teams.push(team);
    }
    const savedTeams = await teamRepository.save(teams);
    console.log(`Created ${savedTeams.length} teams`);

    // Assign users to teams (some users can be team members)
    console.log('Assigning users to teams...');
    const usersWithoutTeams = [...savedUsers];
    const usersToUpdate: User[] = [];
    
    for (const team of savedTeams) {
      // Assign 3-8 random users to each team
      const teamSize = getRandomInt(3, 8);
      for (let i = 0; i < teamSize && usersWithoutTeams.length > 0; i++) {
        const randomIndex = getRandomInt(0, usersWithoutTeams.length - 1);
        const user = usersWithoutTeams.splice(randomIndex, 1)[0];
        user.team = team;
        usersToUpdate.push(user);
      }
    }
    
    // Save all users (both assigned to teams and not assigned)
    await userRepository.save([...usersToUpdate, ...usersWithoutTeams]);
    console.log(`Assigned ${usersToUpdate.length} users to teams`);

    // Create 100 games
    console.log('Creating 100 games...');
    const gameTypes = [GameType.OneVsOne, GameType.TwoVsTwo, GameType.ThreeVsThree, GameType.SixVsSix];
    const games: Game[] = [];

    for (let i = 0; i < 100; i++) {
      const gameType = getRandomElement(gameTypes);
      const creator = getRandomElement(savedUsers);
      
      // Select team members based on game type - use all users
      const availableUsers = savedUsers.filter(u => u.id !== creator.id);
      
      // For team-based games, try to get users from different teams
      let team1Members: User[] = [];
      let team2Members: User[] = [];

      if (gameType === GameType.OneVsOne) {
        // 1v1 - pick 2 random users
        const shuffled = [...availableUsers].sort(() => Math.random() - 0.5);
        team1Members = shuffled.slice(0, 1);
        team2Members = shuffled.slice(1, 2);
      } else if (gameType === GameType.TwoVsTwo) {
        // 2v2 - pick 4 random users, split into 2 teams
        const shuffled = [...availableUsers].sort(() => Math.random() - 0.5);
        team1Members = shuffled.slice(0, 2);
        team2Members = shuffled.slice(2, 4);
      } else if (gameType === GameType.ThreeVsThree) {
        // 3v3 - pick 6 random users, split into 2 teams
        const shuffled = [...availableUsers].sort(() => Math.random() - 0.5);
        team1Members = shuffled.slice(0, 3);
        team2Members = shuffled.slice(3, 6);
      } else if (gameType === GameType.SixVsSix) {
        // 6v6 - pick 12 random users, split into 2 teams
        const shuffled = [...availableUsers].sort(() => Math.random() - 0.5);
        team1Members = shuffled.slice(0, 6);
        team2Members = shuffled.slice(6, 12);
      }

      // Only create game if we have enough users
      if (team1Members.length === gameType && team2Members.length === gameType) {
        const allMembers = [...team1Members, ...team2Members];
        const participants = allMembers;
        
        // Randomly decide if game is completed or not
        const isCompleted = Math.random() > 0.3; // 70% chance game is completed
        
        const game = gameRepository.create({
          type: gameType,
          duration: getRandomInt(15, 45),
          createdBy: creator,
          team1Members,
          team2Members,
          participants,
          team1Ready: isCompleted,
          team2Ready: isCompleted,
          isCancelled: false,
          startTime: isCompleted ? new Date(Date.now() - getRandomInt(1, 30) * 24 * 60 * 60 * 1000) : null,
          endTime: isCompleted ? new Date(Date.now() - getRandomInt(1, 29) * 24 * 60 * 60 * 1000) : null,
          team1Score: isCompleted ? getRandomInt(0, 13) : null,
          team2Score: isCompleted ? getRandomInt(0, 13) : null,
        });
        
        games.push(game);
      }
    }

    const savedGames = await gameRepository.save(games);
    console.log(`Created ${savedGames.length} games`);

    // Mark seeding as completed
    fs.writeFileSync(SEED_FLAG_FILE, new Date().toISOString());
    console.log('Database seeding completed successfully!');
  } catch (error) {
    console.error('Error during database seeding:', error);
    throw error;
  }
}
