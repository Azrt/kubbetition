import {
  Controller,
  Get,
  Req,
} from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { SWAGGER_BEARER_TOKEN } from 'src/app.constants';
import { CountriesService } from './countries.service';
import { Public } from 'src/common/decorators/public.decorator';
import { GeolocationService } from 'src/common/services/geolocation.service';

@ApiBearerAuth(SWAGGER_BEARER_TOKEN)
@Controller("countries")
export class CountriesController {
  constructor(private readonly countriesService: CountriesService, private readonly geolocationService: GeolocationService) {}

  @Public()
  @Get()
  async findAll(@Req() request: Request): Promise<any> {
    const ip = this.geolocationService.getIpFromRequest(request);
    if (ip) {
      const country = this.geolocationService.getCountryFromIp(ip);
      if (country) {
        const countries = await this.countriesService.getAllCountries();

        const currentCountry = countries.find((c: any) => c.code === country);

        if (currentCountry) {
          return [currentCountry, ...countries.filter((c: any) => c.code !== currentCountry.code)];
        }

        return countries;
      }
    }
    return this.countriesService.getAllCountries();
  }
}
