import { DataSource } from 'typeorm';
import { User } from './db.entity';

export const databaseProviders = [
  {
    provide: 'DATA_SOURCE',
    useFactory: async () => {
      const dataSource = new DataSource({
        type: 'mysql',
        host: 'localhost',
        port: 3307,
        username: process.env.DB,
        password: process.env.DBPW,
        database: 'test',
        entities: [User],
        synchronize: true,
      });

      return dataSource.initialize();
    },
  },
];
