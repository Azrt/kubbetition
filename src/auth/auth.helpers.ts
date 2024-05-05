import { oauth2_v2 } from "googleapis";
import { CreateUserDto } from "src/users/dto/create-user.dto";

export const parseGoogleUserData = (
  user: oauth2_v2.Schema$Userinfo
): CreateUserDto => ({
  email: user.email ?? '',
  firstName: user.given_name ?? '',
  lastName: user.family_name ?? '',
  image: user.picture ?? '',
});