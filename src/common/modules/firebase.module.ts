import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import * as admin from "firebase-admin";
import { NotificationsService } from "../services/notifications.service";

const firebaseProvider = {
  provide: "KUBBETITION_FIREBASE_PROVIDER",
  inject: [ConfigService],
  useFactory: (configService: ConfigService) => {
    const firebaseConfig = {
      type: "service_account",
      project_id: configService.get<string>("FIREBASE_PROJECT_ID"),
      private_key_id: configService.get<string>("FIREBASE_PRIVATE_KEY_ID"),
      private_key: configService
        .get<string>("FIREBASE_PRIVATE_KEY")
        .replace(/\\n/g, "\n"),
      client_email: configService.get<string>("FIREBASE_CLIENT_EMAIL"),
      client_id: configService.get<string>("FIREBASE_CLIENT_ID"),
      auth_uri: configService.get<string>("FIREBASE_AUTH_URI"),
      token_uri: configService.get<string>("FIREBASE_TOKEN_URI"),
      auth_provider_x509_cert_url: configService.get<string>(
        "FIREBASE_AUTH_CERT_URL"
      ),
      client_x509_cert_url: configService.get<string>(
        "FIREBASE_CLIENT_CERT_URL"
      ),
      universe_domain: "googleapis.com",
    } as admin.ServiceAccount;

    return admin.initializeApp({
      credential: admin.credential.cert(firebaseConfig),
      databaseURL: `https://${firebaseConfig.projectId}.firebaseio.com`,
      storageBucket: `${firebaseConfig.projectId}.appspot.com`,
    });
  },
};

@Module({
  imports: [ConfigModule],
  providers: [firebaseProvider, NotificationsService],
  exports: [NotificationsService],
})
export class FirebaseModule {}
