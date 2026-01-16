import { Inject, Injectable } from "@nestjs/common";
import * as firebase from 'firebase-admin'
import { app } from "firebase-admin";
import { Messaging } from "firebase-admin/lib/messaging/messaging";
import { User } from "src/users/entities/user.entity";


@Injectable()
export class NotificationsService {
  private messaging: Messaging;

  constructor(
    @Inject("KUBBETITION_FIREBASE_PROVIDER") private firebaseApp: app.App
  ) {
    this.messaging = firebaseApp.messaging();
  }

  public async sendToUsers(
    tokens: Array<string | null>,
    title: string,
    body: string,
    dryRun?: boolean
  ) {
    console.log(tokens);
    const messages: firebase.messaging.TokenMessage[] = tokens
      .filter(Boolean)
      .map(token => ({
        token,
        notification: {
          title,
          body,
        },
      }));
    try {
      const result = await this.messaging.sendEach(messages, dryRun);
      console.log('messages', messages)
      console.log(result)
    } catch (error) {
      console.log(error)
    }
  }
}