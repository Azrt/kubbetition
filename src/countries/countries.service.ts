import { getName, getData } from 'country-list';
import { Injectable } from '@nestjs/common';

@Injectable()
export class CountriesService {
  async findOneByCountryCode(countryCode: string) {
    return getName(countryCode);
  }

  async getAllCountries() {
    return getData();
  }
}