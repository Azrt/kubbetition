import { Injectable } from "@nestjs/common";
import { ValidationArguments, ValidatorConstraint, ValidatorConstraintInterface } from "class-validator";
import { CountriesService } from "src/countries/countries.service";

@ValidatorConstraint({ async: true, name: 'CountryExists' })
@Injectable()
export class CountryExistsRule implements ValidatorConstraintInterface {
    constructor(
        private countriesService: CountriesService
    ) { }

    async validate(countryCode: string) {
        if (!countryCode) return false;

        const country = await this.countriesService.findOneByCountryCode(countryCode);

        return !!country;
    }

    defaultMessage(validationArguments?: ValidationArguments): string {
        return "Country doesn't exist";
    }
}