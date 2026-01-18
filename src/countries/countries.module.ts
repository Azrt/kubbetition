import { Module } from '@nestjs/common';
import { CountriesService } from './countries.service';
import { CountriesController } from './countries.controller';
import { GeolocationService } from 'src/common/services/geolocation.service';

@Module({
    imports: [],
    controllers: [CountriesController],
    providers: [CountriesService, GeolocationService],
})
export class CountriesModule { }
